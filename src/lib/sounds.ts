/**
 * Small in-app sounds, synthesised with the Web Audio API (no audio files, works offline).
 * Browsers only allow audio after a tap, so these are played from taps and from their results.
 * The user can switch them off in Settings; the choice is kept on this device.
 */
const KEY = "cashbook-sounds";
export type SoundKind = "micOn" | "micOff" | "error" | "saved" | "remind";
type Note = { f: number; at: number; dur: number; gain: number; type?: OscillatorType };

const SOUNDS: Record<SoundKind, Note[]> = {
  micOn: [{ f: 660, at: 0, dur: 0.11, gain: 0.1 }, { f: 988, at: 0.09, dur: 0.16, gain: 0.1 }],
  micOff: [{ f: 988, at: 0, dur: 0.11, gain: 0.09 }, { f: 622, at: 0.09, dur: 0.16, gain: 0.09 }],
  error: [{ f: 220, at: 0, dur: 0.12, gain: 0.11, type: "triangle" }, { f: 196, at: 0.16, dur: 0.16, gain: 0.11, type: "triangle" }],
  saved: [{ f: 1175, at: 0, dur: 0.07, gain: 0.07 }, { f: 1568, at: 0.05, dur: 0.1, gain: 0.05 }],
  remind: [{ f: 784, at: 0, dur: 0.18, gain: 0.08 }, { f: 1047, at: 0.17, dur: 0.24, gain: 0.08 }],
};

let ctx: AudioContext | null = null;

export function soundsEnabled(): boolean {
  try { return localStorage.getItem(KEY) !== "off"; } catch { return true; }
}
export function setSoundsEnabled(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* storage unavailable */ }
}

export function playSound(kind: SoundKind) {
  if (typeof window === "undefined" || !soundsEnabled()) return;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + 0.01;
    for (const n of SOUNDS[kind]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.value = n.f;
      const s = t0 + n.at;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(n.gain, s + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, s + n.dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(s);
      osc.stop(s + n.dur + 0.02);
    }
  } catch { /* audio unavailable: stay silent */ }
}
