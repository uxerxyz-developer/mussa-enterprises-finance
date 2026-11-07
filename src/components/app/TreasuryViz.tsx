import { useId, type ReactNode } from "react";
import { smoothPath } from "@/lib/treasury-series";
import { cn } from "@/lib/utils";

/** Donut made of segments. `parts` are fractions (sum <= 1) and `colors` CSS colours; `masked` draws a neutral ring that shows no proportions. */
export function Ring({ parts, colors, masked, className, stroke = 14, label, children }: { parts: number[]; colors: string[]; masked?: boolean | undefined; className?: string | undefined; stroke?: number | undefined; label?: string | undefined; children?: ReactNode }) {
  const r = 50 - stroke / 2;
  const gap = parts.length > 1 ? 0.012 : 0;
  let acc = 0;
  return (
    <span role={label ? "img" : undefined} aria-label={label} title={label} className={cn("relative inline-grid shrink-0 place-items-center", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} className="tre-ring-track" />
        {!masked && parts.map((p, i) => {
          const seg = Math.max(0, p - gap) * 100;
          const el = <circle key={i} cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} strokeDasharray={`${seg} ${100 - seg}`} strokeDashoffset={-acc * 100} pathLength={100} className="tre-ring-seg" style={{ stroke: colors[i % colors.length] }} />;
          acc += p;
          return el;
        })}
      </svg>
      {children}
    </span>
  );
}

/** Small wavy trend line with an arrow head (top right of the Bank tile). `masked` (amounts hidden) shows a flat dashed line only. */
export function Trend({ values, masked }: { values: number[]; masked?: boolean | undefined }) {
  const gid = `tre-t-${useId().replace(/:/g, "")}`;
  const { d, end } = smoothPath(values, 38, 22, 3);
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
          <g transform={`translate(${tip.x} ${tip.y}) rotate(${tip.angle})`}><path d="M5 0 L-1 -3 L-1 3 Z" style={{ fill: tail }} className="tre-glow" /></g>
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
  const real = masked ? [] : [...values].sort((a, b) => b - a).slice(0, 6).reverse();
  const max = Math.max(...real, 0);
  const stubs = 6 - real.length;
  return (
    <span className="flex h-[22px] items-end gap-[3px]" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => {
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
