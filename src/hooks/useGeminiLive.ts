import { useState, useRef, useCallback, useEffect } from "react";
import { getGeminiLiveConfig } from "@/lib/gemini-live.functions";
import { loadGreeting, saveGreeting } from "@/lib/voice-greeting-cache";
import type { AccountDraft, EntryDraft } from "@/lib/voice-tools";

/** What is waiting for the user's confirmation: a new entry or a new account. */
export type PendingDraft =
  | { kind: "entry"; draft: EntryDraft; summary: string }
  | { kind: "account"; draft: AccountDraft; summary: string };

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export type VoiceStatus = "idle" | "connecting" | "listening" | "speaking";

interface UseGeminiLiveOptions {
  /** Runs one tool the model asked for (lookups, drafts, confirmation) and returns its result. */
  onToolCall?: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** Read at session start: voice, extra instruction lines, the greeting (text + cache key) and optional context. */
  getSessionConfig?: () => { voice: string; extraInstruction: string; greeting: string | null; greetingKey: string; initialContext: string | null };
}

// Gemini frames are loosely typed JSON; `any` keeps strict index-signature rules from rejecting property access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = any;

const IN_RATE = 16000;
const DEFAULT_OUT_RATE = 24000;

function audioCtor(): typeof AudioContext {
  return window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
}

/** Linear-interpolation resample, used when the browser cannot give us a 16 kHz capture context. */
function resample(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (inRate === outRate) return input;
  const ratio = inRate / outRate;
  const len = Math.floor(input.length / ratio);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    const a = input[i0] ?? 0;
    const b = input[i0 + 1] ?? a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

/** Float32 -> base64 16-bit little-endian PCM. */
function pcmFloat32ToBase64(f: Float32Array): string {
  const buffer = new ArrayBuffer(f.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < f.length; i++) {
    const s = Math.max(-1, Math.min(1, f[i] ?? 0));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export function useGeminiLive(options: UseGeminiLiveOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentDraft, setCurrentDraft] = useState<PendingDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const scheduledTimeRef = useRef<number>(0);
  const playingRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const intentionalCloseRef = useRef(false);
  const lastActivityRef = useRef(0);
  const turnClosedRef = useRef(true);
  const sawOutputTxRef = useRef(false);
  const gateUntilRef = useRef(0);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const recRef = useRef<{ key: string; mime: string; chunks: string[] } | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const draftRef = useRef<PendingDraft | null>(null);
  draftRef.current = currentDraft;

  const stopPlayback = useCallback(() => {
    playingRef.current.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } });
    playingRef.current.clear();
    scheduledTimeRef.current = 0;
    setIsSpeaking(false);
  }, []);

  /** Queue one chunk of PCM from Gemini for gap-free sequential playback. */
  const playIncomingPcmChunk = useCallback((base64Data: string, mimeType?: string) => {
    try {
      const ctx = audioContextOutRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();
      const rate = Number(/rate=(\d+)/.exec(mimeType ?? "")?.[1]) || DEFAULT_OUT_RATE;

      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        const v = int16[i] ?? 0;
        float32[i] = v / (v < 0 ? 32768 : 32767);
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, rate);
      audioBuffer.copyToChannel(float32, 0);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      if (scheduledTimeRef.current < now + 0.02) scheduledTimeRef.current = now + 0.02;
      source.start(scheduledTimeRef.current);
      scheduledTimeRef.current += audioBuffer.duration;
      playingRef.current.add(source);
      setIsSpeaking(true);

      source.onended = () => {
        playingRef.current.delete(source);
        if (ctx.currentTime >= scheduledTimeRef.current - 0.05) setIsSpeaking(false);
      };
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }, []);

  const stopMicrophoneCapture = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    void audioContextInRef.current?.close();
    audioContextInRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setMediaStream(null);
    setIsRecording(false);
  }, []);

  /** Start streaming the already-open microphone to Gemini (called after setupComplete). */
  const startCapture = useCallback((ws: WebSocket) => {
    const ctx = audioContextInRef.current;
    const stream = mediaStreamRef.current;
    if (!ctx || !stream) return;
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(2048, 1, 1);
    processorRef.current = processor;
    const inRate = ctx.sampleRate;
    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN || !readyRef.current) return;
      // Do not send the microphone while the saved greeting is playing (it would hear itself).
      const outCtx = audioContextOutRef.current;
      if (outCtx && outCtx.currentTime < gateUntilRef.current) return;
      const mono = resample(e.inputBuffer.getChannelData(0), inRate, IN_RATE);
      ws.send(JSON.stringify({ realtimeInput: { audio: { data: pcmFloat32ToBase64(mono), mimeType: `audio/pcm;rate=${IN_RATE}` } } }));
    };
    source.connect(processor);
    processor.connect(ctx.destination);
    setIsRecording(true);
  }, []);

  /** Add a text message to the live conversation (the model may answer it). */
  const sendContext = useCallback((text: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && readyRef.current) ws.send(JSON.stringify({ realtimeInput: { text } }));
  }, []);

  // Append streamed transcript text to the open bubble of the same speaker, or start a new one.
  const appendTranscript = useCallback((role: "user" | "assistant", text: string) => {
    if (!text) return;
    const startNew = turnClosedRef.current;
    turnClosedRef.current = false;
    setLiveTranscript(text);
    setChatHistory((prev) => {
      const last = prev[prev.length - 1];
      if (!startNew && last && last.role === role) return [...prev.slice(0, -1), { role, text: last.text + text }];
      return [...prev, { role, text }];
    });
  }, []);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
    setLiveTranscript("");
    turnClosedRef.current = true;
  }, []);

  const stopSession = useCallback(() => {
    intentionalCloseRef.current = true;
    readyRef.current = false;
    clearTimeout(connectTimerRef.current);
    recRef.current = null;
    gateUntilRef.current = 0;
    stopMicrophoneCapture();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    playingRef.current.forEach((s) => { try { s.stop(); } catch { /* ignore */ } });
    playingRef.current.clear();
    void audioContextOutRef.current?.close();
    audioContextOutRef.current = null;
    scheduledTimeRef.current = 0;
    setIsConnected(false);
    setConnecting(false);
    setIsSpeaking(false);
    setLiveTranscript("");
    setChatHistory([]);
    turnClosedRef.current = true;
  }, [stopMicrophoneCapture]);

  const sendToolResponse = (ws: WebSocket, id: string, name: string, output: AnyRec) => {
    ws.send(JSON.stringify({ toolResponse: { functionResponses: [{ id, name, response: { output } }] } }));
  };

  /** Give up on a connection that is slow or broken: stop everything and show a clear message. */
  const failConnection = useCallback((message: string) => {
    intentionalCloseRef.current = true;
    clearTimeout(connectTimerRef.current);
    readyRef.current = false;
    gateUntilRef.current = 0;
    recRef.current = null;
    if (wsRef.current) { try { wsRef.current.close(); } catch { /* ignore */ } wsRef.current = null; }
    stopMicrophoneCapture();
    playingRef.current.forEach((x) => { try { x.stop(); } catch { /* ignore */ } });
    playingRef.current.clear();
    void audioContextOutRef.current?.close();
    audioContextOutRef.current = null;
    scheduledTimeRef.current = 0;
    setIsConnected(false);
    setConnecting(false);
    setIsSpeaking(false);
    setLiveTranscript("");
    setError(message);
  }, [stopMicrophoneCapture]);

  /** Start a live session. Must be called from a user gesture (tap): audio is unlocked before any await. */
  const startSession = useCallback(async () => {
    if (wsRef.current || connecting) return;
    const t0 = performance.now();
    const tick = (label: string) => console.info(`[voice] ${label} +${Math.round(performance.now() - t0)}ms`);
    setError(null);
    intentionalCloseRef.current = false;
    readyRef.current = false;
    lastActivityRef.current = Date.now();
    turnClosedRef.current = true;
    sawOutputTxRef.current = false;
    gateUntilRef.current = 0;
    setConnecting(true);

    // 1) Unlock audio + ask for the mic synchronously inside the tap (mobile browsers require this).
    let outCtx: AudioContext | null = null;
    let inCtx: AudioContext | null = null;
    let micPromise: Promise<MediaStream>;
    try {
      const Ctor = audioCtor();
      outCtx = new Ctor(); // default rate; buffers of any rate are resampled automatically
      try { inCtx = new Ctor({ sampleRate: IN_RATE }); } catch { inCtx = new Ctor(); }
      void outCtx.resume();
      void inCtx.resume();
      micPromise = navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: IN_RATE, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      audioContextOutRef.current = outCtx;
      audioContextInRef.current = inCtx;
    } catch (e) {
      void outCtx?.close(); void inCtx?.close();
      setConnecting(false);
      setError("Is browser mein microphone ya audio support nahi.");
      console.error(e);
      return;
    }
    tick("tap: audio unlocked, mic requested");

    // 2) Start the server round-trip right away, and play the saved greeting at once (no waiting for the connection).
    const configPromise = getGeminiLiveConfig();
    const sc = optionsRef.current.getSessionConfig?.();
    let greetedLocally = false;
    if (sc?.greeting) {
      const cached = await loadGreeting(sc.greetingKey);
      if (cached) {
        cached.chunks.forEach((c) => playIncomingPcmChunk(c, cached.mime));
        gateUntilRef.current = scheduledTimeRef.current;
        greetedLocally = true;
        tick("saved greeting playing");
      }
    }
    // Slow or failing connection: say so instead of leaving the user waiting.
    clearTimeout(connectTimerRef.current);
    connectTimerRef.current = setTimeout(() => {
      if (!readyRef.current) failConnection("Connection slow hai ya nahi ban saka. Dobara koshish karein.");
    }, 10_000);

    try {
      const [config, stream] = await Promise.all([configPromise, micPromise]);
      tick("config + microphone ready");
      mediaStreamRef.current = stream;
      setMediaStream(stream);

      const ws = new WebSocket(config.url);
      wsRef.current = ws;

      ws.onopen = () => {
        tick("websocket open");
        ws.send(JSON.stringify({
          setup: {
            model: config.model,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: sc?.voice ?? "Puck" } } },
            },
            systemInstruction: sc?.extraInstruction
              ? { parts: [...config.systemInstruction.parts, { text: sc.extraInstruction }] }
              : config.systemInstruction,
            tools: JSON.parse(config.tools),
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        }));
      };

      ws.onmessage = async (event) => {
        try {
          // Browsers deliver Gemini's JSON frames as Blob; accept both Blob and string.
          const raw = typeof event.data === "string" ? event.data : await (event.data as Blob).text();
          const resp = JSON.parse(raw) as AnyRec;
          lastActivityRef.current = Date.now();

          if (resp["setupComplete"] !== undefined) {
            tick("setupComplete");
            clearTimeout(connectTimerRef.current);
            readyRef.current = true;
            setConnecting(false);
            setIsConnected(true);
            startCapture(ws);
            if (sc?.initialContext) {
              ws.send(JSON.stringify({ realtimeInput: { text: sc.initialContext } }));
            } else if (sc?.greeting && !greetedLocally) {
              // First time only: the model says the greeting, and we keep its audio for next time.
              recRef.current = { key: sc.greetingKey, mime: `audio/pcm;rate=${DEFAULT_OUT_RATE}`, chunks: [] };
              ws.send(JSON.stringify({ realtimeInput: { text: sc.greeting } }));
            }
            return;
          }

          const sv: AnyRec = resp["serverContent"];
          if (sv?.inputTranscription?.text) appendTranscript("user", sv.inputTranscription.text as string);
          if (sv?.outputTranscription?.text) { sawOutputTxRef.current = true; appendTranscript("assistant", sv.outputTranscription.text as string); }
          if (sv?.turnComplete) {
            turnClosedRef.current = true;
            const rec = recRef.current;
            if (rec && rec.chunks.length) void saveGreeting(rec.key, { mime: rec.mime, chunks: rec.chunks });
            recRef.current = null;
          }

          const parts: AnyRec[] = sv?.modelTurn?.parts ?? [];
          for (const part of parts) {
            if (part?.inlineData?.data) {
              playIncomingPcmChunk(part.inlineData.data as string, part.inlineData.mimeType as string | undefined);
              if (recRef.current) {
                if (part.inlineData.mimeType) recRef.current.mime = part.inlineData.mimeType as string;
                recRef.current.chunks.push(part.inlineData.data as string);
              }
            }
            if (part?.text && !sawOutputTxRef.current) appendTranscript("assistant", part.text as string);
          }

          // Interruption: drop everything queued so the assistant stops talking at once.
          if (sv?.interrupted) { recRef.current = null; stopPlayback(); }

          const calls: AnyRec[] | undefined = resp["toolCall"]?.functionCalls;
          if (calls) {
            for (const call of calls) {
              const id = call["id"] as string;
              const name = call["name"] as string;
              const args = (call["args"] ?? {}) as Record<string, unknown>;
              let out: Record<string, unknown>;
              try { out = (await optionsRef.current.onToolCall?.(name, args)) ?? { status: "unsupported_tool" }; }
              catch (err) { out = { status: "error", message: err instanceof Error ? err.message : String(err) }; }
              sendToolResponse(ws, id, name, out);
            }
          }
        } catch (err) {
          console.error("Error handling Gemini message:", err);
        }
      };

      ws.onerror = (e) => { console.error(e); };

      ws.onclose = (ev) => {
        clearTimeout(connectTimerRef.current);
        if (!intentionalCloseRef.current) {
          setError(readyRef.current
            ? `Voice connection band ho gaya (${ev.code})${ev.reason ? `: ${ev.reason}` : ""}. Dobara mic dabayen.`
            : "Connection nahi ban saka. Internet check karke dobara koshish karein.");
        }
        readyRef.current = false;
        wsRef.current = null;
        setIsConnected(false);
        setConnecting(false);
        stopMicrophoneCapture();
      };
    } catch (err) {
      clearTimeout(connectTimerRef.current);
      wsRef.current = null;
      void micPromise.then((st) => st.getTracks().forEach((t) => t.stop())).catch(() => undefined);
      stopMicrophoneCapture();
      void audioContextOutRef.current?.close();
      audioContextOutRef.current = null;
      setConnecting(false);
      const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setError(denied ? "Microphone ki ijazat nahi mili. Browser ki settings mein allow karein." : "Connection nahi ban saka. Internet check karke dobara koshish karein.");
    }
  }, [connecting, appendTranscript, failConnection, playIncomingPcmChunk, startCapture, stopMicrophoneCapture, stopPlayback]);

  // Idle guard: 2 minutes without activity (5 while a draft is waiting) ends the session.
  useEffect(() => {
    if (!isConnected) return;
    const id = window.setInterval(() => {
      const limit = draftRef.current ? 300_000 : 120_000;
      if (Date.now() - lastActivityRef.current > limit) {
        stopSession();
        setError("Kuch der koi baat nahi hui, voice session band kar diya.");
      }
    }, 10_000);
    return () => window.clearInterval(id);
  }, [isConnected, stopSession]);

  useEffect(() => () => { stopSession(); }, [stopSession]);

  const status: VoiceStatus = connecting ? "connecting" : !isConnected ? "idle" : isSpeaking ? "speaking" : "listening";

  return {
    isConnected,
    isRecording,
    isSpeaking,
    status,
    liveTranscript,
    chatHistory,
    currentDraft,
    setCurrentDraft,
    clearHistory,
    sendContext,
    mediaStream,
    startSession,
    stopSession,
    error,
  };
}
