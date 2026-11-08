import { useId, type ReactNode } from "react";
import { smoothPath } from "@/lib/treasury-series";
import { cn } from "@/lib/utils";

/** Donut made of segments. `parts` are fractions (sum <= 1) and `colors` CSS colours; `masked` draws a neutral ring that shows no proportions. */
export function Ring({ parts, colors, masked, className, stroke = 14, label, children }: { parts: number[]; colors: string[]; masked?: boolean | undefined; className?: string | undefined; stroke?: number | undefined; label?: string | undefined; children?: ReactNode }) {
  const r = 50 - stroke / 2;
  const soft = stroke <= 14; // thin rings get rounded ends, so the segments need a wider gap
  const gap = parts.length > 1 ? (soft ? 0.07 : 0.012) : 0;
  let acc = 0;
  return (
    <span role={label ? "img" : undefined} aria-label={label} title={label} className={cn("relative inline-grid shrink-0 place-items-center", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} className="tre-ring-track" />
        {!masked && parts.map((p, i) => {
          const seg = Math.max(0, p - gap) * 100;
          const from = acc;
          acc += p;
          if (soft && parts.length > 1 && p <= gap + 0.01) return null; // too small to draw without a dot
          const c = colors[i % colors.length];
          return <circle key={i} cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} strokeLinecap={soft ? "round" : "butt"} strokeDasharray={`${seg} ${100 - seg}`} strokeDashoffset={-(from + gap / 2) * 100} pathLength={100} className="tre-ring-seg" style={{ stroke: c, strokeOpacity: 0.92, filter: `drop-shadow(0 0 2px color-mix(in oklab, ${c} 50%, transparent))` }} />;
        })}
      </svg>
      {children}
    </span>
  );
}

/** Soften a short series so the line becomes a gentle wave, not a zig-zag: two light moving averages, then at most 8 points. */
function softSeries(v: number[], n = 8): number[] {
  if (v.length < 3) return v;
  const ma = (a: number[]) => a.map((_, i) => (a[Math.max(0, i - 1)]! + a[i]! + a[Math.min(a.length - 1, i + 1)]!) / 3);
  const s = ma(ma(v));
  const m = Math.min(n, s.length);
  return Array.from({ length: m }, (_, i) => {
    const t = (i * (s.length - 1)) / (m - 1);
    const lo = Math.floor(t);
    const hi = Math.min(s.length - 1, lo + 1);
    return s[lo]! + (s[hi]! - s[lo]!) * (t - lo);
  });
}

/** Small wavy trend line with an arrow head (top right of the Bank tile). `masked` (amounts hidden) shows a flat dashed line only. */
export function Trend({ values, masked }: { values: number[]; masked?: boolean | undefined }) {
  const gid = `tre-t-${useId().replace(/:/g, "")}`;
  const { d, end } = smoothPath(softSeries(values), 38, 22, 3);
  const up = values.length < 2 || values[values.length - 1]! >= values[0]!;
  const tail = up ? "var(--tre-cash)" : "var(--tre-pay)";
  const flat = masked || !d;
  const tip = end ?? { x: 35, y: 11, angle: 0 };
  return (
    <svg width={44} height={22} viewBox="0 0 44 22" aria-hidden className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--tre-bank)" }} />
          <stop offset="1" style={{ stopColor: tail }} />
        </linearGradient>
      </defs>
      {masked ? (
        <path d="M3 11 L35 11" fill="none" strokeWidth={1.6} strokeDasharray="3 4" className="tre-spark-mask" />
      ) : (
        <>
          <path d={flat ? "M3 11 L35 11" : d} fill="none" pathLength={1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="tre-draw tre-glow" style={{ stroke: `url(#${gid})` }} />
          <g transform={`translate(${tip.x} ${tip.y}) rotate(${tip.angle})`}><path d="M2.5 -3.2 L6.5 0 L2.5 3.2" fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: tail }} className="tre-glow" /></g>
        </>
      )}
    </svg>
  );
}

const BAR_COLORS = [
  "var(--tre-recv)",
  "var(--tre-bank)",
  "var(--tre-cash)",
  "color-mix(in oklab, var(--tre-recv) 55%, var(--tre-pay))",
  "var(--tre-chq)",
  "color-mix(in oklab, var(--treasury-foreground) 45%, transparent)",
];

/** Six little bars in different colours (top right of the Receivables tile). Biggest party is the tallest; missing slots are faint stubs. */
export function Bars({ values, masked }: { values: number[]; masked?: boolean | undefined }) {
  const real = masked ? [] : [...values].sort((a, b) => b - a).slice(0, 5).reverse();
  const max = Math.max(...real, 0);
  const stubs = 5 - real.length;
  return (
    <span className="flex h-[22px] items-end gap-[3px]" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => {
        const v = masked || i < stubs ? null : real[i - stubs]!;
        return <span key={i} className={cn("tre-bar", v === null && "opacity-25")}
          style={{ height: v === null || max <= 0 ? (masked ? "55%" : "16%") : `${Math.max(24, (v / max) * 100)}%`, background: BAR_COLORS[i], animationDelay: `${i * 50}ms` }} />;
      })}
    </span>
  );
}

/** Pending / cleared / bounced as three small dots (top right of the Pending cheques tile). A dot fades when its count is zero. */
export function StatusDots({ pending, cleared, bounced }: { pending: number; cleared: number; bounced: number }) {
  const items = [["var(--tre-chq)", pending, "pending"], ["var(--tre-cash)", cleared, "cleared"], ["var(--tre-pay)", bounced, "bounced"]] as const;
  return (
    <span className="flex items-center gap-1" role="img" aria-label={items.map(([, n, l]) => `${n} ${l}`).join(", ")}>
      {items.map(([c, n, l]) => <span key={l} className="h-2 w-2 rounded-full" style={{ background: c, opacity: n > 0 ? 1 : 0.3 }} />)}
    </span>
  );
}
