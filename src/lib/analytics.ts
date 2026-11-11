import { liveEntries, liveAccounts, notBounced, fundAmount, ENTRY_TYPES, type Data, type Entry } from "./db";

/** Analytics series derived from entries — no business logic changes, pure read-only aggregation. */

export type MonthPoint = { key: string; label: string; sales: number; purchases: number; expenses: number; net: number };
export type CategoryPoint = { id: string; name: string; total: number };
export type PartyPoint = { id: string; name: string; type: string; receivable: number; payable: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(iso: string) { return iso.slice(0, 7); }

/** Signed money flow for the monthly trend: in = +, out = −, credit sales/purchases and transfers = 0. */
function signedFlow(e: Entry): number {
  if (!notBounced(e)) return 0;
  const t = ENTRY_TYPES[e.type];
  if (e.type === "sale" || e.type === "purchase") {
    // credit trade moves no money; net (settled) trade moves it via its method
    if (e.payMode === "net" && e.method) return e.type === "sale" ? e.amount : -e.amount;
    return 0;
  }
  if (t.flow === "in") return fundAmount(e);
  if (t.flow === "out") return -fundAmount(e);
  return 0;
}

/** Last N calendar months (including the current one) of sales / purchases / expenses / net flow. */
export function monthlyTrend(d: Data, months = 6): MonthPoint[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  }
  const points: MonthPoint[] = keys.map((k) => ({ key: k, label: MONTHS[Number(k.slice(5)) - 1] ?? "", sales: 0, purchases: 0, expenses: 0, net: 0 }));
  const byKey = new Map(points.map((p) => [p.key, p]));
  for (const e of liveEntries(d)) {
    const p = byKey.get(monthKey(e.date));
    if (!p) continue;
    if (e.type === "sale" && notBounced(e)) p.sales += e.amount;
    if (e.type === "purchase" && notBounced(e)) p.purchases += e.amount;
    if ((e.type === "expense" || e.type === "salary") && notBounced(e)) p.expenses += e.amount;
    p.net += signedFlow(e);
  }
  return points;
}

/** Expense breakdown by category (expense entries only; uncategorised grouped under "General"). */
export function expenseBreakdown(d: Data, limit = 6): CategoryPoint[] {
  const map = new Map<string, number>();
  for (const e of liveEntries(d)) {
    if (e.type !== "expense" || !notBounced(e)) continue;
    const catId = e.categoryId ?? "__general__";
    map.set(catId, (map.get(catId) ?? 0) + e.amount);
  }
  const catName = (id: string) => id === "__general__" ? "General" : (d.categories?.find((c) => c.id === id)?.name ?? "General");
  return [...map.entries()]
    .map(([id, total]) => ({ id, name: catName(id), total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Top parties by outstanding balance (receivable or payable), excluding equity accounts. */
export function topParties(d: Data, limit = 5): PartyPoint[] {
  const out: PartyPoint[] = [];
  for (const a of liveAccounts(d)) {
    if (a.equity) continue;
    let receivable = 0, payable = 0;
    for (const e of liveEntries(d)) {
      if (e.accountId !== a.id || !notBounced(e)) continue;
      if (e.type === "sale") receivable += e.amount;
      else if (e.type === "purchase") payable += e.amount;
      else if (e.type === "inward") receivable -= e.amount;
      else if (e.type === "outward") payable -= e.amount;
    }
    const net = receivable - payable;
    if (net > 0) out.push({ id: a.id, name: a.name, type: a.type, receivable: net, payable: 0 });
    else if (net < 0) out.push({ id: a.id, name: a.name, type: a.type, receivable: 0, payable: -net });
  }
  return out.sort((a, b) => Math.max(b.receivable, b.payable) - Math.max(a.receivable, a.payable)).slice(0, limit);
}
