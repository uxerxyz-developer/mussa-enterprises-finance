import { useEffect, useMemo, useRef, useState } from "react";
import { moveToTarget } from "@/lib/quick-order";
import { useNavigate } from "@tanstack/react-router";
import { BadgeDollarSign, Banknote, Check, Flame, HandCoins, Plus, Receipt, ShoppingCart, UserPlus, type LucideIcon } from "lucide-react";
import { liveEntries, useData, type Entry, type EntryType } from "@/lib/db";
import { fmtPKR } from "@/lib/format";
import { haptic } from "@/lib/dashboard-layout";
import { HERO_FR, quickKinds, quickMinHeight, quickRowWeights } from "@/lib/quick-layout";
import { QuickTile } from "@/components/app/QuickActionTile";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type QuickId = "sale" | "purchase" | "inward" | "outward" | "expense" | "heat" | "account";
// The first two actions are shown as full-width hero buttons, so the payment actions lead by default.
export const DEFAULT_QUICK: QuickId[] = ["inward", "outward", "sale", "purchase"];
const KEY = "quick-actions-v1";
const HOLD_MS = 360;

const META: Record<QuickId, { label: string; icon: LucideIcon; text: string; tone: string }> = {
  sale: { label: "Sale", icon: BadgeDollarSign, text: "text-sale", tone: "var(--qa-sale)" },
  purchase: { label: "Purchase", icon: ShoppingCart, text: "text-purchase", tone: "var(--qa-purchase)" },
  inward: { label: "Receive Payment", icon: HandCoins, text: "text-received", tone: "var(--qa-receive)" },
  outward: { label: "Issue Payment", icon: Banknote, text: "text-paid", tone: "var(--qa-issue)" },
  expense: { label: "Expense", icon: Receipt, text: "text-expense-card", tone: "var(--qa-expense)" },
  heat: { label: "Heat", icon: Flame, text: "text-entry-card", tone: "var(--qa-heat)" },
  account: { label: "Add Account", icon: UserPlus, text: "text-account", tone: "var(--qa-account)" },
};
const ALL = Object.keys(META) as QuickId[];

/** Pure helper: move an action into or out of the quick list (kept testable). */
export function applyDrop(list: QuickId[], id: QuickId, zone: "in" | "out", beforeId?: QuickId): QuickId[] {
  const rest = list.filter((x) => x !== id);
  if (zone === "out") return rest;
  return moveToTarget(list, id, beforeId);
}

/** Pure helper: toggle an action on/off, always keeping at least one. */
export function toggleQuick(list: QuickId[], id: QuickId): QuickId[] {
  if (list.includes(id)) return list.length > 1 ? list.filter((x) => x !== id) : list;
  return [...list, id];
}

function load(): QuickId[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(v)) {
      const l = v.filter((x): x is QuickId => ALL.includes(x));
      if (l.length) return l;
    }
  } catch { /* ignore */ }
  return DEFAULT_QUICK;
}

export function QuickActions({ wide, openEntry, openAccount, header }: { wide: boolean; openEntry: (t: EntryType) => void; openAccount: () => void; header?: React.ReactNode }) {
  const navigate = useNavigate();
  const [list, setList] = useState<QuickId[]>(DEFAULT_QUICK);
  const [drag, setDrag] = useState<{ id: QuickId; x: number; y: number } | null>(null);
  const [menu, setMenu] = useState(false);
  const [pulse, setPulse] = useState<QuickId | null>(null);
  const [over, setOver] = useState<QuickId | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const d = useData();
  const [rip, setRip] = useState<{ id: QuickId; x: number; y: number; k: number } | null>(null);
  const suppress = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => setList(load()), []);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => { if (e) setBox({ w: e.contentRect.width, h: e.contentRect.height }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const save = (l: QuickId[]) => { setList(l); localStorage.setItem(KEY, JSON.stringify(l)); };
  void wide;

  // Newest entry of each type, for the "Latest: ..." line on hero buttons (read-only).
  const latest = useMemo(() => {
    const m = new Map<string, Entry>();
    for (const e of liveEntries(d)) {
      const c = m.get(e.type);
      if (!c || e.createdAt > c.createdAt) m.set(e.type, e);
    }
    return m;
  }, [d]);
  const latestText = (id: QuickId) => {
    const e = latest.get(id);
    if (!e) return id === "account" || id === "heat" ? undefined : "No entries yet";
    const who = e.accountId ? d.accounts.find((a) => a.id === e.accountId)?.name : undefined;
    return `Latest: ${fmtPKR(e.amount)}${who ? ` · ${who}` : ""}`;
  };
  // Touch ripple that starts exactly where the finger lands.
  const startRipple = (e: React.PointerEvent<HTMLElement>, id: QuickId) => {
    if (e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = Date.now();
    setRip({ id, x: e.clientX - r.left, y: e.clientY - r.top, k });
    window.setTimeout(() => setRip((p) => (p && p.k === k ? null : p)), 650);
  };

  const run = (id: QuickId) => {
    if (suppress.current) return;
    if (id === "account") openAccount();
    else if (id === "heat") navigate({ to: "/production" });
    else openEntry(id as EntryType);
  };

  const onDown = (e: React.PointerEvent, id: QuickId) => {
    if (e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    let active = false, done = false;
    suppress.current = false;
    const blockTouch = (ev: TouchEvent) => { if (active) ev.preventDefault(); };
    const cleanup = () => {
      done = true; clearTimeout(timer);
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("touchmove", blockTouch);
      setDrag(null); setOver(null);
      setTimeout(() => { suppress.current = false; }, 60);
    };
    const timer = setTimeout(() => {
      if (done) return;
      active = true; suppress.current = true;
      try { navigator.vibrate?.(15); } catch { /* ignore */ }
      setDrag({ id, x: sx, y: sy });
    }, HOLD_MS);
    const inside = (x: number, y: number) => {
      const r = rootRef.current?.getBoundingClientRect();
      return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const move = (ev: PointerEvent) => {
      if (!active) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) cleanup(); // user is scrolling
        return;
      }
      ev.preventDefault();
      if (!inside(ev.clientX, ev.clientY)) { cleanup(); return; } // left the card → cancel, snap back
      setDrag({ id, x: ev.clientX, y: ev.clientY });
      const under = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-qid]")?.dataset["qid"] as QuickId | undefined;
      setOver(under && under !== id ? under : null);
    };
    const up = (ev: PointerEvent) => {
      const wasActive = active;
      cleanup();
      if (!wasActive || !inside(ev.clientX, ev.clientY)) return;
      const t = document.elementFromPoint(ev.clientX, ev.clientY);
      const before = t?.closest<HTMLElement>("[data-qid]")?.dataset["qid"] as QuickId | undefined;
      if (before && before !== id) save(applyDrop(list, id, "in", before));
    };
    const cancel = () => cleanup();
    window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", cancel);
    window.addEventListener("touchmove", blockTouch, { passive: false });
  };

  // Auto-fit: pick columns/rows so every button fits inside the card.
  const n = list.length;
  const cols = n <= 1 ? 1 : box.w > 0 && box.w / Math.min(n, 4) >= 110 && box.h < 150 ? Math.min(n, 4) : n > 6 && box.w > 300 ? 3 : 2;
  const rows = Math.max(1, Math.ceil(n / cols));
  const cellH = box.h > 0 ? (box.h - (rows - 1) * 8) / rows : 80;
  const size = cellH < 44 ? "xs" : cellH < 64 ? "sm" : "md";
  // Hero layout (first two buttons full width, an odd last one too) when the card is big enough; otherwise the compact grid above.
  const kinds = quickKinds(n);
  const rowWeights = quickRowWeights(kinds);
  const heroMode = n > 0 && box.w >= 220 && box.h >= quickMinHeight(kinds, 8);
  const heroH = heroMode ? ((box.h - (rowWeights.length - 1) * 8) * HERO_FR) / rowWeights.reduce((t, w) => t + w, 0) : 0;

  return (
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">{header}</div>
        <Popover open={menu} onOpenChange={setMenu}>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Choose quick actions"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-card text-foreground transition-colors hover:bg-secondary">
              <Plus className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" collisionPadding={8} onClick={(e) => e.stopPropagation()}
            className="w-52 max-h-[min(80vh,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain p-1">
              <p className="px-2 pb-1 pt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">Tap to show / hide</p>
              {ALL.map((id) => {
                const m = META[id];
                const on = list.includes(id);
                return (
                  <button key={id} type="button" onClick={() => save(toggleQuick(list, id))} disabled={on && list.length === 1}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary disabled:opacity-50">
                    <m.icon className={cn("h-4 w-4", m.text)} />
                    <span className="flex-1">{m.label}</span>
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
          </PopoverContent>
        </Popover>
      </div>
      <div ref={gridRef} className={cn("mt-2 grid min-h-0 flex-1 gap-2 rounded-lg", drag && "outline-dashed outline-1 outline-border")}
        style={heroMode
          ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gridTemplateRows: rowWeights.map((w) => `minmax(0, ${w}fr)`).join(" ") }
          : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {list.map((id, i) => {
          const m = META[id];
          const hero = heroMode && kinds[i] === "hero";
          return (
            <QuickTile key={id} id={id} label={m.label} icon={m.icon} tone={m.tone} variant={heroMode ? (hero ? "hero" : "tile") : size} span={hero}
              latest={hero && heroH >= 64 ? latestText(id) : undefined}
              ripple={rip?.id === id ? rip : null} pulse={pulse === id} lifted={drag?.id === id} target={!!drag && over === id}
              onPointerDown={(e) => { startRipple(e, id); onDown(e, id); }}
              onClick={() => { if (!suppress.current) haptic(12); run(id); setPulse(id); window.setTimeout(() => setPulse((p) => (p === id ? null : p)), 700); }} />
          );
        })}
      </div>
      {drag && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 scale-110 rounded-md border bg-card px-2.5 py-1.5 text-xs font-semibold shadow-2xl ring-1 ring-primary/30" style={{ left: drag.x, top: drag.y }}>
          {META[drag.id].label}
        </div>
      )}
    </div>
  );
}
