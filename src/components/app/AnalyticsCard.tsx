import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, TrendingUp, PieChart, Users } from "lucide-react";
import { useData } from "@/lib/db";
import { monthlyTrend, expenseBreakdown, topParties } from "@/lib/analytics";
import { fmtPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

const SALES = "var(--chart-1, #2f7de1)";
const PURCHASES = "var(--chart-2, #d97706)";
const EXPENSES = "var(--chart-3, #c2410c)";
const NET = "var(--chart-4, #7c3aed)";
const CAT_COLORS = ["var(--chart-1, #2f7de1)", "var(--chart-2, #d97706)", "var(--chart-3, #c2410c)", "var(--chart-4, #7c3aed)", "var(--chart-5, #64748b)", "var(--primary, #334155)"];

function shortPKR(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return `${n}`;
}

/** Monthly money-flow bars: sales up, purchases+expenses down, net as a dot per month. */
function TrendChart({ points, wide }: { points: ReturnType<typeof monthlyTrend>; wide: boolean }) {
  const W = 560, H = wide ? 190 : 150, PAD = 26;
  const max = Math.max(1, ...points.map((p) => Math.max(p.sales, p.purchases + p.expenses)));
  const bw = (W - PAD * 2) / points.length;
  const y = (v: number) => H / 2 - (v / max) * (H / 2 - 22);
  const netPts = points.map((p, i) => `${PAD + bw * i + bw / 2},${y(p.net)}`).join(" ");
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: SALES }} />Sales</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: PURCHASES }} />Purchases</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: EXPENSES }} />Expenses</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: NET }} />Net flow</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full" role="img" aria-label="Monthly sales, purchases, expenses and net flow">
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="currentColor" className="text-border" strokeWidth="1" />
        {points.map((p, i) => {
          const x = PAD + bw * i + bw / 2;
          const gw = Math.min(22, bw / 3.2);
          return (
            <g key={p.key}>
              <rect x={x - gw - 1} y={y(p.sales)} width={gw} height={Math.max(1, H / 2 - 22 > 0 ? (H / 2 - y(p.sales)) : 1)} rx="2" fill={SALES} opacity="0.9" />
              <rect x={x + 1} y={H / 2} width={gw} height={Math.max(1, ((p.purchases + p.expenses) / max) * (H / 2 - 22))} rx="2" fill={PURCHASES} opacity="0.9" />
              <text x={x} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="10">{p.label}</text>
            </g>
          );
        })}
        <polyline points={netPts} fill="none" stroke={NET} strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={p.key} cx={PAD + bw * i + bw / 2} cy={y(p.net)} r="3" fill={NET} />)}
      </svg>
    </div>
  );
}

/** Donut of expense categories. */
function ExpenseDonut({ items }: { items: ReturnType<typeof expenseBreakdown> }) {
  const total = items.reduce((s, x) => s + x.total, 0);
  const R = 52, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0" role="img" aria-label="Expense breakdown by category">
        <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" className="text-border" strokeWidth="16" opacity="0.35" />
        {items.map((x, i) => {
          const frac = total > 0 ? x.total / total : 0;
          const dash = `${frac * C} ${C}`;
          const off = -acc * C; acc += frac;
          return <circle key={x.id} cx="70" cy="70" r={R} fill="none" stroke={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth="16" strokeDasharray={dash} strokeDashoffset={off} transform="rotate(-90 70 70)" />;
        })}
        <text x="70" y="66" textAnchor="middle" className="fill-foreground" fontSize="13" fontWeight="600">{shortPKR(total)}</text>
        <text x="70" y="80" textAnchor="middle" className="fill-muted-foreground" fontSize="9">total</text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {items.map((x, i) => (
          <li key={x.id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5"><i className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} /><span className="truncate">{x.name}</span></span>
            <span className="num shrink-0 font-medium">{fmtPKR(x.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars for top receivable / payable parties. */
function PartyBars({ items, hidden }: { items: ReturnType<typeof topParties>; hidden?: boolean }) {
  const max = Math.max(1, ...items.map((p) => Math.max(p.receivable, p.payable)));
  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li key={p.id}>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-medium">{p.name}</span>
            <span className="num shrink-0 font-semibold">{hidden ? "••••" : fmtPKR(Math.max(p.receivable, p.payable))}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
            <div className={cn("h-full rounded-full", p.receivable > 0 ? "bg-metric-cash" : "bg-metric-payable")} style={{ width: `${Math.max(4, (Math.max(p.receivable, p.payable) / max) * 100)}%` }} />
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">{p.receivable > 0 ? "receivable" : "payable"}</div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsCard({ w, h, hidden }: { w: number; h: number; hidden?: boolean }) {
  const d = useData();
  const a = useMemo(() => ({ trend: monthlyTrend(d), cats: expenseBreakdown(d), parties: topParties(d) }), [d]);
  const wide = w >= 3;
  const tall = h >= 2;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-muted-foreground">Analytics</div>
          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">Trend · expenses · top parties</div>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><BarChart3 className="h-5 w-5" strokeWidth={1.9} /></span>
      </div>

      <div className={cn("mt-2 min-h-0 flex-1 gap-4 overflow-hidden", wide ? "grid grid-cols-2" : "flex flex-col", tall && "gap-3")}>
        <section className="min-h-0">
          <h3 className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" />Monthly trend</h3>
          <TrendChart points={a.trend} wide={wide || w === 2} />
        </section>
        {tall && (
          <section className="min-h-0">
            <h3 className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><PieChart className="h-3.5 w-3.5" />Expense breakdown</h3>
            {a.cats.length === 0 ? <p className="py-3 text-center text-xs text-muted-foreground">No expenses yet.</p> : <ExpenseDonut items={a.cats} />}
          </section>
        )}
        {tall && (
          <section className="min-h-0">
            <h3 className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><Users className="h-3.5 w-3.5" />Top parties</h3>
            {a.parties.length === 0 ? <p className="py-3 text-center text-xs text-muted-foreground">No party balances yet.</p> : <PartyBars items={a.parties} hidden={hidden} />}
          </section>
        )}
      </div>

      {(!tall || !wide) && (
        <Link to="/reports" onClick={(ev) => ev.stopPropagation()} className="mt-auto pt-2 text-[11px] font-semibold text-primary">Open full reports →</Link>
      )}
    </div>
  );
}
