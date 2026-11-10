/** Pure helpers for the Treasury Position visuals (read-only; no accounting logic lives here). */

const pad = (x: number) => String(x).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The last `n` calendar days ending on `today` (YYYY-MM-DD), oldest first. */
export function lastDays(n: number, today: string): string[] {
  const [y, m, d] = today.split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(iso(new Date(y!, (m ?? 1) - 1, (d ?? 1) - i)));
  return out;
}

type FundRows = { opening: number; rows: { e: { date: string }; bal: number }[] };

/** End-of-day combined balance of the given funds for each day. Rows must be date-sorted (fundLedger already is). */
export function balanceSeries(funds: FundRows[], days: string[]): number[] {
  const ptr = funds.map(() => 0);
  return days.map((day) =>
    funds.reduce((sum, f, i) => {
      let p = ptr[i]!;
      while (p < f.rows.length && f.rows[p]!.e.date <= day) p++;
      ptr[i] = p;
      return sum + (p > 0 ? f.rows[p - 1]!.bal : f.opening);
    }, 0),
  );
}

/** Fractions (0..1) of the positive values; negatives count as zero. Empty when there is nothing positive. */
export function shares(values: number[]): number[] {
  const v = values.map((x) => Math.max(0, x));
  const total = v.reduce((a, b) => a + b, 0);
  return total > 0 ? v.map((x) => x / total) : [];
}

/** Combined balance of the funds after each day on which something changed it (opening balance first), last `max` points. */
export function activitySeries(funds: FundRows[], today: string, max = 12): number[] {
  const dates = [...new Set(funds.flatMap((f) => f.rows.map((r) => r.e.date)).filter((d) => d <= today))].sort();
  const start = funds.reduce((t, f) => t + f.opening, 0);
  const vals = [start, ...balanceSeries(funds, dates)];
  const out = vals.filter((v, i) => i === 0 || v !== vals[i - 1]);
  return out.slice(-max);
}

/** Combined balance at the end of each of the last `days` days (carried forward on quiet days), sampled to `samples` points. */
export function dailySeries(funds: FundRows[], today: string, days = 30, samples = 10): number[] {
  const dates = [...new Set(funds.flatMap((f) => f.rows.map((r) => r.e.date)).filter((d) => d <= today))].sort();
  const start = funds.reduce((t, f) => t + f.opening, 0);
  const after = balanceSeries(funds, dates);
  const balanceOn = (iso: string) => { let v = start; for (let i = 0; i < dates.length && dates[i]! <= iso; i++) v = after[i]!; return v; };
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const isoOf = (back: number) => { const x = new Date(y, m - 1, d - back); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const out: number[] = [];
  for (let i = 0; i < samples; i++) out.push(balanceOn(isoOf(Math.round(((samples - 1 - i) * (days - 1)) / (samples - 1)))));
  return out;
}

/** Smooth SVG line through the values inside a w x h box, plus the end point and its direction (degrees) for an arrow head. */
export function smoothPath(values: number[], w: number, h: number, pad_ = 3): { d: string; end: { x: number; y: number; angle: number } | null } {
  if (values.length < 2) return { d: "", end: null };
  const min = Math.min(...values);
  const span = Math.max(...values) - min;
  const X = (i: number) => pad_ + (i * (w - 2 * pad_)) / (values.length - 1);
  const Y = (v: number) => (span === 0 ? h / 2 : h - pad_ - ((v - min) / span) * (h - 2 * pad_));
  const P = values.map((v, i) => ({ x: X(i), y: Y(v) }));
  const cy = (y: number) => Math.min(h - pad_, Math.max(pad_, y));
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(P[0]!.x)} ${f(P[0]!.y)}`;
  let c2 = P[0]!;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] ?? P[i]!, p1 = P[i]!, p2 = P[i + 1]!, p3 = P[i + 2] ?? P[i + 1]!;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: cy(p1.y + (p2.y - p0.y) / 6) };
    c2 = { x: p2.x - (p3.x - p1.x) / 6, y: cy(p2.y - (p3.y - p1.y) / 6) };
    d += ` C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  const last = P[P.length - 1]!;
  return { d, end: { x: last.x, y: last.y, angle: (Math.atan2(last.y - c2.y, last.x - c2.x) * 180) / Math.PI } };
}
