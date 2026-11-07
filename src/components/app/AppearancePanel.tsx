import { useEffect } from "react";
import { RotateCcw, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PALETTES, discardAppearance, previewAppearance, resetAppearance, saveAppearance, useAppearance, type AppTheme } from "@/lib/appearance";

const SLIDERS = [
  { key: "bright", label: "Background brightness", hint: "Slightly darker or lighter page" },
  { key: "cardShadow", label: "Card shadow", hint: "Less or more lift under cards" },
  { key: "btnShadow", label: "Button shadow", hint: "Less or more lift under buttons" },
  { key: "glow", label: "Sidebar glow", hint: "Highlight when you hover the menu" },
] as const;

/**
 * Appearance panel. It never dims or blocks the page, so every change is visible live.
 * Changes are a preview until "Save"; closing (X, Cancel, Escape) restores the saved look.
 */
export function AppearancePanel({ onClose, theme }: { onClose: () => void; theme: AppTheme }) {
  const { value: a, dirty } = useAppearance(theme);
  const name = theme === "dark" ? "Dark" : "Light";

  // Unsaved edits of this theme are discarded when the panel closes or the theme is switched.
  useEffect(() => () => discardAppearance(theme), [theme]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Appearance"
      className="no-print fixed inset-x-3 bottom-3 z-50 flex max-h-[46vh] flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl md:inset-x-auto md:bottom-4 md:right-4 md:top-20 md:max-h-none md:w-[21.5rem]"
    >
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">Appearance</h2>
          <p className="text-xs text-muted-foreground">Editing the <span className="font-semibold text-foreground">{name}</span> theme. Changes show live; press Save to keep them.</p>
        </div>
        <button type="button" aria-label="Close without saving" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div role="radiogroup" aria-label={`${name} palette`} className="grid grid-cols-2 gap-2">
          {PALETTES[theme].map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={a.palette === p.id}
              onClick={() => previewAppearance(theme, { palette: p.id })}
              className={cn("rounded-xl border p-2.5 text-left transition-colors", a.palette === p.id ? "border-primary ring-1 ring-primary" : "hover:bg-muted/50")}
            >
              <span className="mb-2 flex h-8 overflow-hidden rounded-md border" aria-hidden>
                {p.swatch.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
              </span>
              <span className="block text-sm font-medium">{p.label}</span>
              <span className="block text-[11px] text-muted-foreground">{p.note}</span>
            </button>
          ))}
        </div>
        {SLIDERS.map((s) => (
          <div key={s.key} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label id={`ap-${theme}-${s.key}`} className="text-sm font-medium">{s.label}</label>
              <span className="num text-xs text-muted-foreground">{a[s.key]}</span>
            </div>
            <Slider aria-labelledby={`ap-${theme}-${s.key}`} min={0} max={100} step={1} value={[a[s.key]]}
              onValueChange={(v) => { const n = v[0]; if (typeof n === "number") previewAppearance(theme, { [s.key]: n }); }} />
            <p className="text-[11px] text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t px-4 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => resetAppearance(theme)} title="Preview the default look"><RotateCcw /> Reset</Button>
        <span className="flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="button" size="sm" disabled={!dirty} onClick={() => { saveAppearance(theme); onClose(); }}>Save</Button>
      </div>
    </div>
  );
}
