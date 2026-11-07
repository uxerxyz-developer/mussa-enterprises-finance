import { useSyncExternalStore } from "react";

/** The few voice-assistant choices a user makes. Everything else uses fixed, device-appropriate defaults. */
export type VoiceName = "Puck" | "Charon" | "Kore" | "Aoede";
export type VoiceLang = "mixed" | "urdu" | "english";
export type VoiceLength = "short" | "detailed";

export interface VoiceSettings {
  voice: VoiceName;
  language: VoiceLang;
  length: VoiceLength;
  autoStart: boolean;
}

export const VOICE_KEY = "voice_settings";
export const VOICE_DEFAULTS: VoiceSettings = { voice: "Puck", language: "mixed", length: "short", autoStart: true };

export const VOICE_OPTIONS: { value: VoiceName; label: string; hint: string }[] = [
  { value: "Puck", label: "Puck", hint: "Male, lively" },
  { value: "Charon", label: "Charon", hint: "Male, calm" },
  { value: "Kore", label: "Kore", hint: "Female, clear" },
  { value: "Aoede", label: "Aoede", hint: "Female, soft" },
];

const VOICES = VOICE_OPTIONS.map((v) => v.value);
const LANGS: VoiceLang[] = ["mixed", "urdu", "english"];
const LENGTHS: VoiceLength[] = ["short", "detailed"];

/** Validate anything (e.g. malformed localStorage) into a complete, valid settings object. */
export function sanitizeVoice(raw: unknown): VoiceSettings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const pick = <T extends string>(v: unknown, list: T[], d: T): T => (typeof v === "string" && (list as string[]).includes(v) ? (v as T) : d);
  return {
    voice: pick(o["voice"], VOICES, VOICE_DEFAULTS.voice),
    language: pick(o["language"], LANGS, VOICE_DEFAULTS.language),
    length: pick(o["length"], LENGTHS, VOICE_DEFAULTS.length),
    autoStart: typeof o["autoStart"] === "boolean" ? o["autoStart"] : VOICE_DEFAULTS.autoStart,
  };
}

/** Extra system-prompt lines derived from the settings (appended to the server's base instruction). */
export function voiceInstruction(s: VoiceSettings, today?: string): string {
  const lang =
    s.language === "urdu" ? "Always speak Urdu with natural Pakistani pronunciation and accent."
    : s.language === "english" ? "Always speak English, clearly and slowly enough for a Pakistani business user."
    : "Reply in the same language the user speaks (Urdu, Roman Urdu or English) with a natural Pakistani accent.";
  const len = s.length === "short" ? "Keep spoken replies very short: one or two sentences." : "You may explain a little more when it helps, but stay concise.";
  const rules = "If a user message is exactly ENTRY_SAVED, answer with a very short confirmation (for example: Entry save ho gayi) and forget the previous entry's party and amount. Messages starting with CONTEXT: are background information about the screen; acknowledge in one short sentence and never save anything yourself.";
  const date = today ? ` Today is ${today} (Pakistan time); use it for words like aaj, kal and parson.` : "";
  return `${lang} ${len} ${rules}${date}`;
}

/** First thing the assistant says when a session opens (the model is silent until it gets a first turn). */
export function voiceGreeting(s: VoiceSettings): string {
  return s.language === "english"
    ? "Say a short, warm greeting in English: 'Hello, I'm listening. What entry would you like to make?'"
    : "Say a short, warm greeting in Roman Urdu: 'Ji boliye, main sun raha hoon! Kya entry karni hai?'";
}

type Snapshot = { settings: VoiceSettings; configured: boolean };
let snap: Snapshot = { settings: VOICE_DEFAULTS, configured: false };
let loaded = false;
const subs = new Set<() => void>();

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const txt = window.localStorage.getItem(VOICE_KEY);
    if (txt) snap = { settings: sanitizeVoice(JSON.parse(txt)), configured: true };
  } catch { /* malformed or unavailable storage: keep defaults, ask again */ }
}

export function getVoiceSettings(): Snapshot {
  ensureLoaded();
  return snap;
}

export function saveVoiceSettings(s: VoiceSettings) {
  ensureLoaded();
  snap = { settings: sanitizeVoice(s), configured: true };
  try { window.localStorage.setItem(VOICE_KEY, JSON.stringify(snap.settings)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

const SERVER: Snapshot = { settings: VOICE_DEFAULTS, configured: true };
export function useVoiceSettings(): Snapshot {
  return useSyncExternalStore((f) => { ensureLoaded(); subs.add(f); return () => { subs.delete(f); }; }, getVoiceSettings, () => SERVER);
}
