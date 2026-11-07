import React, { useState, useEffect, useRef } from "react";
import { X, Check, ChevronUp, TriangleAlert, RotateCw } from "lucide-react";
import { romanize } from "@/lib/romanize";
import "./GeminiLiveWorkspaceBar.css";
import micLight from "@/assets/mic-icon-v8-light.gif.asset.json";
import micDark from "@/assets/mic-icon-v8-dark.gif.asset.json";
import micLightIdle from "@/assets/mic-icon-v8-light-idle.png.asset.json";
import micDarkIdle from "@/assets/mic-icon-v8-dark-idle.png.asset.json";

export interface VoiceDraft {
  /** Heading of the card and the rows it shows (entry or new account). When rows are given they replace the fixed fields below. */
  title?: string | undefined;
  rows?: Array<[string, string]> | undefined;
  type?: string | undefined; party?: string | undefined; amount?: number | string | undefined;
  /** Real ledger account the draft will post to (when resolved). */
  accountName?: string | undefined;
  /** "missing" = no such account; "ambiguous" = several match, user must pick; "na" = entry has no party. */
  matchState?: "matched" | "ambiguous" | "missing" | "na" | undefined;
  candidates?: Array<{ id: string; name: string }> | undefined;
  amountWords?: string | undefined;
  method?: string | undefined; payMode?: string | undefined; bank?: string | undefined; chequeNo?: string | undefined; date?: string | undefined;
  /** Existing similar voucher, if any. */
  duplicateOf?: string | undefined;
}

export interface GeminiLiveWorkspaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  isSpeaking: boolean;
  liveTranscript: string;
  chatHistory: Array<{ role: "user" | "assistant"; text: string }>;
  currentDraft: VoiceDraft | null;
  onConfirmDraft: () => void;
  onCancelDraft: () => void;
  onToggleRecord: () => void;
  audioStream?: MediaStream | null;
  error?: string | null;
  isConnected?: boolean;
  onPickCandidate?: (id: string) => void;
  /** Try the connection again after a slow or failed connection. */
  onRetry?: () => void;
  /** First-time setup card (replaces the normal body until saved). */
  setupSlot?: React.ReactNode;
  /** Session phase, shown purely through animation (aura + orb), never as text. */
  status?: "idle" | "connecting" | "listening" | "speaking";
  /** An unfinished draft from an earlier session, waiting for a decision. */
  resume?: { summary: string; onContinue: () => void; onDiscard: () => void } | null;
}

const PARTICLES = [
  { id: 1, dx: "-24px", dy: "-20px", size: "6px", color: "purple", delay: "0s" },
  { id: 2, dx: "26px", dy: "-18px", size: "4px", color: "yellow", delay: "0.2s" },
  { id: 3, dx: "-28px", dy: "14px", size: "5px", color: "blue", delay: "0.4s" },
  { id: 4, dx: "22px", dy: "24px", size: "7px", color: "purple", delay: "0.1s" },
  { id: 5, dx: "0px", dy: "-30px", size: "3px", color: "blue", delay: "0.5s" },
  { id: 6, dx: "-22px", dy: "-26px", size: "5px", color: "yellow", delay: "0.3s" },
  { id: 7, dx: "30px", dy: "0px", size: "4px", color: "purple", delay: "0.6s" },
  { id: 8, dx: "-12px", dy: "28px", size: "6px", color: "yellow", delay: "0.25s" },
];

export function GeminiLiveWorkspaceBar({
  isOpen, onClose, isRecording, isSpeaking, liveTranscript, chatHistory,
  currentDraft, onConfirmDraft, onCancelDraft, onToggleRecord, audioStream, error, isConnected, onPickCandidate, setupSlot, resume, status = "idle", onRetry,
}: GeminiLiveWorkspaceBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbMeshRef = useRef<HTMLSpanElement>(null);
  const artRef = useRef<HTMLSpanElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeState = isRecording || isSpeaking;

  // Auto-scroll the conversation to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && isExpanded) el.scrollTop = el.scrollHeight;
  }, [chatHistory, isExpanded]);
  useEffect(() => {
    if (!isOpen) setIsExpanded(false);
  }, [isOpen]);
  useEffect(() => {
    if (currentDraft) setIsExpanded(false);
  }, [currentDraft]);

  // Outside tap: collapse history first, otherwise end the session. The header mic handles its own toggle.
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest?.("[data-voice-trigger]")) return;
      if (containerRef.current && !containerRef.current.contains(t)) {
        if (isExpanded) setIsExpanded(false);
        else onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, isExpanded, onClose]);

  // Orb reacts to live voice frequency.
  useEffect(() => {
    if (!activeState || !audioStream) {
      if (orbMeshRef.current) orbMeshRef.current.style.transform = "scale(1)";
      if (artRef.current) artRef.current.style.transform = "scale(1)";
      return;
    }
    let audioCtx: AudioContext | null = null;
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      audioCtx.createMediaStreamSource(audioStream).connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] ?? 0;
        const norm = sum / dataArray.length / 255;
        if (orbMeshRef.current) orbMeshRef.current.style.transform = `scale(${1 + norm * 0.3})`;
        if (artRef.current) artRef.current.style.transform = `scale(${1 + norm * 0.25})`;
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn("Audio Context init fallback:", e);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtx?.close();
    };
  }, [activeState, audioStream]);

  if (!isOpen) return null;

  return (
    <>
      <div aria-hidden="true" className="voice-aura no-print" data-status={status}>
        <span className="voice-aura-blob voice-aura-a" /><span className="voice-aura-blob voice-aura-b" /><span className="voice-aura-blob voice-aura-c" />
      </div>
      <div ref={containerRef} className="gemini-dock fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 mx-auto flex max-w-xl flex-col items-center px-4 md:left-60">
        {setupSlot}
        {!setupSlot && resume && (
          <div role="group" aria-label="Unfinished entry" className="voice-panel animate-slide-up mb-3 w-full rounded-2xl border p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pichli adhoori entry</p>
            <p className="mb-3 text-sm font-medium">{resume.summary}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={resume.onDiscard} className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted/50"><X className="h-3.5 w-3.5" /> Khatam karein</button>
              <button type="button" onClick={resume.onContinue} className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"><Check className="h-3.5 w-3.5" /> Jari rakhen</button>
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="voice-panel animate-slide-up mb-3 flex w-full items-start gap-2 rounded-2xl border border-destructive/40 p-3 text-xs text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> <span className="min-w-0 flex-1">{error}</span>
            {onRetry && <button type="button" onClick={onRetry} className="flex shrink-0 items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 font-medium hover:bg-destructive/10"><RotateCw className="h-3.5 w-3.5" /> Retry</button>}
          </div>
        )}
        {currentDraft && (() => {
          const blocked = currentDraft.matchState === "missing" || currentDraft.matchState === "ambiguous";
          const rows: Array<[string, string | undefined]> = currentDraft.rows ?? [
            ["Party", currentDraft.accountName ?? currentDraft.party],
            ["Amount", currentDraft.amount !== undefined ? `${currentDraft.amount}${currentDraft.amountWords ? ` (${currentDraft.amountWords})` : ""}` : undefined],
            ["Method", currentDraft.method], ["Mode", currentDraft.payMode], ["Bank", currentDraft.bank],
            ["Cheque no", currentDraft.chequeNo], ["Date", currentDraft.date],
          ];
          return (
            <div role="group" aria-label="Transaction draft" className="voice-panel animate-slide-up mb-3 w-full rounded-2xl border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{currentDraft.title ?? "Transaction Draft"}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{currentDraft.type || "Draft"}</span>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                {rows.filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}><span className="block text-xs text-muted-foreground">{k}:</span><span className="font-medium text-foreground">{v}</span></div>
                ))}
              </div>
              {currentDraft.matchState === "missing" && (
                <p role="alert" className="mb-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Ye party Accounts mein nahi mili. Pehle account banayen, phir dobara bolen.</p>
              )}
              {currentDraft.matchState === "ambiguous" && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-medium text-foreground">Kai parties milti hain. Sahi wali chunein:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentDraft.candidates?.map((c) => (
                      <button key={c.id} type="button" onClick={() => onPickCandidate?.(c.id)} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted">{c.name}</button>
                    ))}
                  </div>
                </div>
              )}
              {currentDraft.duplicateOf && (
                <p className="mb-3 rounded-lg bg-warning/15 p-2 text-xs">Milti julti entry pehle se maujood hai ({currentDraft.duplicateOf}). Save karne par dobara confirm poocha jayega.</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={onCancelDraft} className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"><X className="h-3.5 w-3.5" /> Cancel</button>
                <button type="button" onClick={onConfirmDraft} disabled={blocked} title={blocked ? "Pehle party theek karein" : undefined} className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-3.5 w-3.5" /> Confirm &amp; Save</button>
              </div>
            </div>
          );
        })()}


        {!setupSlot && (
          <div className="voice-panel voice-window mb-2 w-full overflow-hidden rounded-2xl border">
            <div className="voice-history" data-open={isExpanded} inert={!isExpanded}>
              <div className="min-h-0 overflow-hidden">
                <div ref={scrollRef} className="voice-history-scroll flex flex-col gap-2.5 p-4" role="log" aria-live="polite">
                  {chatHistory.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">Abhi koi baat-cheet nahi hui…</p>
                  ) : chatHistory.map((chat, idx) => (
                    <div key={idx} className={`flex max-w-[85%] flex-col rounded-2xl px-3 py-2 text-xs ${chat.role === "user" ? "ml-auto rounded-br-sm bg-primary text-primary-foreground" : "mr-auto rounded-bl-sm bg-muted/80 text-foreground"}`}>
                      <span className="mb-0.5 text-[10px] font-semibold opacity-75">{chat.role === "user" ? "You" : "Assistant"}</span>
                      <span>{romanize(chat.text)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-label="Show conversation of this session"
              onClick={() => setIsExpanded((v) => !v)}
              className="flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2 text-center"
            >
              {liveTranscript
                ? <span className="min-w-0 truncate text-xs font-medium text-foreground/90">{romanize(liveTranscript)}</span>
                : <span aria-hidden className="h-1 w-9 rounded-full bg-foreground/20" />}
              <ChevronUp className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        <div className="relative flex items-center justify-center">
          <button type="button" aria-label={activeState || isConnected ? "Stop assistant" : "Start assistant"} data-status={status} className={`${activeState ? "gemini-orb-btn gemini-orb-active" : "gemini-orb-btn"} gemini-orb-lg`} onClick={onToggleRecord}>
            <span ref={orbMeshRef} className="gemini-orb-mesh" aria-hidden="true">
              <span className="orb-blob orb-purple" /><span className="orb-blob orb-blue" /><span className="orb-blob orb-yellow" />
            </span>
            {activeState && (
              <span className="gemini-particles" aria-hidden="true">
                {PARTICLES.map((p) => (
                  <span key={p.id} className={`gemini-dot gemini-dot-${p.color}`} style={{ "--dx": p.dx, "--dy": p.dy, width: p.size, height: p.size, animationDelay: p.delay } as React.CSSProperties} />
                ))}
              </span>
            )}
            <span ref={artRef} className="gemini-art" aria-hidden="true">
              <img src={micLightIdle.url} alt="" className={`gemini-image gemini-image-light ${activeState ? "gemini-idle" : ""}`} />
              <img src={micDarkIdle.url} alt="" className={`gemini-image gemini-image-dark ${activeState ? "gemini-idle" : ""}`} />
              {activeState && <>
                <img src={micLight.url} alt="" className="gemini-image gemini-image-light" />
                <img src={micDark.url} alt="" className="gemini-image gemini-image-dark" />
              </>}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
