import { useSyncExternalStore } from "react";

/**
 * Appearance: a colour palette plus four fine-tune sliders, kept separately for the light and the dark theme
 * (localStorage keys `appearance_light` / `appearance_dark`). Edits are a live PREVIEW until the user presses Save;
 * closing the panel without saving restores the saved look. Stored values are validated; nothing runs on the server.
 */
export type AppTheme = "light" | "dark";

export interface PaletteInfo { id: string; label: string; note: string; swatch: [string, string, string, string] }

export const PALETTES: Record<AppTheme, PaletteInfo[]> = {
  light: [
    { id: "classic", label: "Classic", note: "Current look", swatch: ["#E6EBEE", "#FFFFFF", "#313335", "#313335"] },
    { id: "slate-grey", label: "Slate Grey", note: "Neutral slate", swatch: ["#DCE0E6", "#F9FAFC", "#252B34", "#475569"] },
    { id: "slate-blue", label: "Slate Blue", note: "Soft blue slate", swatch: ["#D2DCEC", "#F5F8FD", "#24324F", "#4A5F8A"] },
    { id: "silver", label: "Silver", note: "Light neutral", swatch: ["#EDEDF0", "#FCFCFD", "#232327", "#5B5B68"] },
    { id: "manor-blue", label: "Manor Blue", note: "Deep blue-grey", swatch: ["#C5CFDC", "#F2F5F9", "#2B394B", "#3F5E86"] },
  ],
  dark: [
    { id: "classic", label: "Classic", note: "Current look", swatch: ["#0B0F14", "#151A20", "#D9DCE3", "#D3D4D6"] },
    { id: "deep-night", label: "Deep Night", note: "Deep navy", swatch: ["#0F172A", "#1E293B", "#E5E7EB", "#38BDF8"] },
    { id: "maritime", label: "Maritime", note: "Dusky indigo", swatch: ["#262434", "#312F45", "#CDD1D7", "#B9B6D6"] },
    { id: "moody-blue", label: "Moody Blue", note: "Smoky blue", swatch: ["#1A1D29", "#282D40", "#C9CCD6", "#9AA3B5"] },
    { id: "graphite", label: "Graphite", note: "Neutral charcoal", swatch: ["#0E0E10", "#232327", "#C9C9D2", "#C9C9D2"] },
  ],
};

export interface Appearance { palette: string; bright: number; cardShadow: number; btnShadow: number; glow: number }
export const APPEARANCE_DEFAULTS: Record<AppTheme, Appearance> = {
  light: { palette: "classic", bright: 50, cardShadow: 50, btnShadow: 50, glow: 50 },
  dark: { palette: "classic", bright: 50, cardShadow: 50, btnShadow: 50, glow: 50 },
};
const KEY: Record<AppTheme, string> = { light: "appearance_light", dark: "appearance_dark" };

const num = (v: unknown, d: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : d;
};

export function sanitizeAppearance(raw: unknown, theme: AppTheme): Appearance {
  const d = APPEARANCE_DEFAULTS[theme];
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const id = typeof o["palette"] === "string" ? o["palette"] : "";
  return {
    palette: PALETTES[theme].some((p) => p.id === id) ? id : d.palette,
    bright: num(o["bright"], d.bright),
    cardShadow: num(o["cardShadow"], d.cardShadow),
    btnShadow: num(o["btnShadow"], d.btnShadow),
    glow: num(o["glow"], d.glow),
  };
}

const same = (a: Appearance, b: Appearance) => a.palette === b.palette && a.bright === b.bright && a.cardShadow === b.cardShadow && a.btnShadow === b.btnShadow && a.glow === b.glow;

let saved: Record<AppTheme, Appearance> = { light: APPEARANCE_DEFAULTS.light, dark: APPEARANCE_DEFAULTS.dark };
let draft: Record<AppTheme, Appearance | null> = { light: null, dark: null };
let loaded = false;
let firstApply = true;
const subs = new Set<() => void>();

function read(theme: AppTheme): Appearance {
  try {
    const txt = window.localStorage.getItem(KEY[theme]);
    return sanitizeAppearance(txt ? JSON.parse(txt) : null, theme);
  } catch { return APPEARANCE_DEFAULTS[theme]; }
}
function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  saved = { light: read("light"), dark: read("dark") };
}
const effective = (theme: AppTheme) => draft[theme] ?? saved[theme];
const emit = () => subs.forEach((f) => f());

/** Shadow slider -> multiplier: 50 = untouched app defaults; below softens, above deepens (up to 3x). */
const shadowK = (v: number) => (v < 50 ? v / 50 : 1 + (v - 50) / 25);

/** Write one theme's (preview or saved) appearance onto <html> as attributes + CSS variables. Client only. */
export function applyAppearance(theme: AppTheme) {
  if (typeof document === "undefined") return;
  ensureLoaded();
  const a = effective(theme);
  const root = document.documentElement;
  if (!firstApply && !root.hasAttribute("data-vt") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("theme-fade");
    window.setTimeout(() => root.classList.remove("theme-fade"), 320);
  }
  firstApply = false;
  root.setAttribute("data-palette", a.palette);
  // Background brightness: at most a 5 % mix, so text contrast stays inside the checked range.
  const d = a.bright - 50;
  const limit = d >= 0 ? (theme === "dark" ? 5 : 4) : theme === "dark" ? 3 : 5;
  root.style.setProperty("--ap-tone", d >= 0 ? "white" : "black");
  root.style.setProperty("--ap-pct", `${((Math.abs(d) / 50) * limit).toFixed(2)}%`);
  const setShadow = (attr: string, prop: string, v: number) => {
    if (v === 50) { root.removeAttribute(attr); root.style.removeProperty(prop); }
    else { root.setAttribute(attr, "custom"); root.style.setProperty(prop, shadowK(v).toFixed(3)); }
  };
  setShadow("data-card-shadow", "--ap-card-k", a.cardShadow);
  setShadow("data-btn-shadow", "--ap-btn-k", a.btnShadow);
  root.style.setProperty("--ap-glow-k", (a.glow / 50).toFixed(2));
}

/** Live preview: applies instantly, is NOT stored until saveAppearance. */
export function previewAppearance(theme: AppTheme, patch: Partial<Appearance>) {
  ensureLoaded();
  const next = sanitizeAppearance({ ...effective(theme), ...patch }, theme);
  draft = { ...draft, [theme]: same(next, saved[theme]) ? null : next };
  emit();
  applyAppearance(theme);
}

export function saveAppearance(theme: AppTheme) {
  ensureLoaded();
  const d = draft[theme];
  if (!d) return;
  saved = { ...saved, [theme]: d };
  draft = { ...draft, [theme]: null };
  try { window.localStorage.setItem(KEY[theme], JSON.stringify(d)); } catch { /* storage unavailable */ }
  emit();
}

/** Throw away unsaved edits and go back to the saved look. */
export function discardAppearance(theme: AppTheme) {
  ensureLoaded();
  if (!draft[theme]) return;
  draft = { ...draft, [theme]: null };
  emit();
  applyAppearance(theme);
}

/** Preview the default look for this theme (press Save to keep it). */
export function resetAppearance(theme: AppTheme) {
  previewAppearance(theme, APPEARANCE_DEFAULTS[theme]);
}

export function useAppearance(theme: AppTheme): { value: Appearance; dirty: boolean } {
  const value = useSyncExternalStore(
    (f) => { ensureLoaded(); subs.add(f); return () => { subs.delete(f); }; },
    () => { ensureLoaded(); return effective(theme); },
    () => APPEARANCE_DEFAULTS[theme],
  );
  return { value, dirty: draft[theme] !== null };
}
