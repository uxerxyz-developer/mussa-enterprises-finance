/**
 * Plays a short sample in a chosen assistant voice so it can be picked by ear.
 * The first time a voice is previewed a brief connection is made and the recording is kept on this device
 * (same store as the saved greeting); every later preview plays instantly.
 */
import { getGeminiLiveConfig } from "@/lib/gemini-live.functions";
import { loadGreeting, saveGreeting } from "@/lib/voice-greeting-cache";

const SAMPLE = "Assalam o alaikum! Main aap ka assistant hoon. Boliye, kya entry karni hai?";
const RATE = 24000;
let ctx: AudioContext | null = null;
let stopCurrent: (() => void) | null = null;

function player() {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) throw new Error("no audio");
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Schedule one base64 PCM16 chunk after the previous one; returns the time it ends. */
function playChunk(ac: AudioContext, b64: string, at: number): number {
  const bin = atob(b64);
  const n = Math.floor(bin.length / 2);
  const buf = ac.createBuffer(1, n, RATE);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) { const v = (bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8)) << 16 >> 16; ch[i] = v / 32768; }
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  const start = Math.max(at, ac.currentTime + 0.02);
  src.start(start);
  return start + buf.duration;
}

/** Resolves when the sample has finished (or failed). */
export async function playVoiceSample(voice: string): Promise<void> {
  stopCurrent?.();
  const key = `preview|${voice}|v1`;
  let ac: AudioContext;
  try { ac = player(); } catch { return; }
  const cached = await loadGreeting(key);
  if (cached) {
    let t = ac.currentTime;
    cached.chunks.forEach((c) => { t = playChunk(ac, c, t); });
    await new Promise<void>((r) => setTimeout(r, Math.max(0, (t - ac.currentTime) * 1000) + 100));
    return;
  }
  await new Promise<void>((resolve) => {
    const chunks: string[] = [];
    let t = ac.currentTime;
    let ws: WebSocket | null = null;
    let done = false;
    const finish = () => { if (done) return; done = true; try { ws?.close(); } catch { /* already closed */ } resolve(); };
    stopCurrent = finish;
    const guard = setTimeout(finish, 15000);
    void getGeminiLiveConfig().then((config) => {
      ws = new WebSocket(config.url);
      ws.onopen = () => ws?.send(JSON.stringify({ setup: { model: config.model, generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } }, systemInstruction: { parts: [{ text: "You are a voice sample. Say exactly the sentence you are given, in a warm natural tone, and nothing else." }] } } }));
      ws.onmessage = async (event) => {
        try {
          const raw = typeof event.data === "string" ? event.data : await (event.data as Blob).text();
          const msg = JSON.parse(raw) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
          if (msg["setupComplete"] !== undefined) { ws?.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: `Say exactly: ${SAMPLE}` }] }], turnComplete: true } })); return; }
          const parts = msg["serverContent"]?.modelTurn?.parts as Array<{ inlineData?: { data?: string } }> | undefined;
          parts?.forEach((p) => { const d = p.inlineData?.data; if (d) { chunks.push(d); t = playChunk(ac, d, t); } });
          if (msg["serverContent"]?.turnComplete) {
            if (chunks.length) void saveGreeting(key, { mime: `audio/pcm;rate=${RATE}`, chunks });
            clearTimeout(guard);
            setTimeout(finish, Math.max(0, (t - ac.currentTime) * 1000) + 150);
          }
        } catch { finish(); }
      };
      ws.onerror = () => { clearTimeout(guard); finish(); };
    }).catch(() => { clearTimeout(guard); finish(); });
  });
}
