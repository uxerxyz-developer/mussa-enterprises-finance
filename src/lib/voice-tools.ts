/**
 * Everything the voice assistant can look up or draft, as pure functions over the app's data.
 * The model only asks questions; THIS code decides what is missing, which account is meant, and what the entry will be,
 * using the same rules as the entry form. No browser APIs here, so it can be tested in isolation.
 */
import {
  ENTRY_TYPES, METHODS, accountBalance, accountTypeLabel, balanceClass, fundList, liveAccounts, liveBanks, liveEntries, liveProduction, notBounced,
  partyTotals, stockSummary, workerMonth, workerTotals,
  type Account, type AccountType, type Data, type Entry, type EntryType, type PayMethod,
} from "./db";
import { fmtTon } from "./format";
import { matchNames, type Ranked } from "./fuzzy";

export type Args = Record<string, unknown>;
export type ToolResult = Record<string, unknown>;

export const VOICE_ENTRY_TYPES: EntryType[] = ["sale", "purchase", "inward", "outward", "expense", "salary", "advance"];

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/,/g, "")) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const money = (n: number) => `Rs ${Math.round(n * 100) / 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ---------------- dates ---------------- */
const iso = (y: number, m: number, d: number) => `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const parts = (s: string) => ({ y: Number(s.slice(0, 4)), m: Number(s.slice(5, 7)), d: Number(s.slice(8, 10)) });
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** date (YYYY-MM-DD) | days_ago | day_of_month (this month, or last month if that day has not come yet). */
export function resolveDate(a: Args, today: string): string | undefined {
  const date = str(a["date"]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const ago = num(a["days_ago"]);
  if (ago !== undefined) { const t = parts(today); const dt = new Date(Date.UTC(t.y, t.m - 1, t.d - Math.round(ago))); return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()); }
  const dom = num(a["day_of_month"]);
  if (dom !== undefined && dom >= 1 && dom <= 31) {
    const t = parts(today);
    let y = t.y, m = t.m;
    if (dom > t.d) { m -= 1; if (m === 0) { m = 12; y -= 1; } }
    if (dom > daysIn(y, m)) return undefined;
    return iso(y, m, dom);
  }
  return undefined;
}
const hasDateArg = (a: Args) => !!(str(a["date"]) || num(a["days_ago"]) !== undefined || num(a["day_of_month"]) !== undefined);

/* ---------------- which accounts an entry type may use ---------------- */
export function partyKinds(type: EntryType): { only?: AccountType; exclude?: AccountType } {
  if (type === "sale") return { only: "buyer" };
  if (type === "purchase") return { only: "supplier" };
  if (type === "salary" || type === "advance") return { only: "worker" };
  return { exclude: "worker" }; // receive / issue payment and expense "paid to": never a worker
}
const allowed = (a: Account, type?: EntryType) => {
  if (a.equity) return false;
  if (!type) return true;
  const k = partyKinds(type);
  if (k.only) return a.type === k.only;
  if (k.exclude) return a.type !== k.exclude;
  return true;
};

const accInfo = (d: Data, a: Account) => ({ id: a.id, name: a.name, type: a.type, type_label: accountTypeLabel(d, a.type), balance: accountBalance(d, a.id), balance_class: balanceClass(a, accountBalance(d, a.id)) });

/** Look up an account from a spoken (possibly partial / misspelt) name, limited to the types the entry needs. */
export function findAccountTool(d: Data, name: string, entryType?: EntryType): ToolResult {
  const all = liveAccounts(d).filter((a) => !a.equity);
  const pool = all.filter((a) => allowed(a, entryType));
  const r = matchNames(name, pool, (a) => a.name);
  const pick = (x: Ranked<Account>[]) => x.map((c) => ({ name: c.item.name, type: accountTypeLabel(d, c.item.type) }));
  if (r.status === "exact" || r.status === "clear") return { status: "found", account: accInfo(d, r.best as Account), spoken_name: (r.best as Account).name };
  if (r.status === "ambiguous") return { status: "ambiguous", candidates: pick(r.candidates), instruction: "Ask the user which one they mean, reading the full names." };
  const wrong = entryType ? matchNames(name, all.filter((a) => !allowed(a, entryType)), (a) => a.name) : undefined;
  const res: ToolResult = { status: "not_found", can_create: true, instruction: "Tell the user this account is not in the system and ask if you should create a new one." };
  if (wrong && wrong.status !== "none") {
    res["exists_as_other_type"] = pick(wrong.candidates);
    res["instruction"] = `An account with a similar name exists but with another type, and this entry needs ${entryType ? (partyKinds(entryType).only ?? "a non-worker") : ""} accounts. Tell the user, and offer to create a new account of the right type or to check the entry type.`;
  }
  return res;
}
const resolveAccount = (d: Data, name: string, type?: EntryType) => matchNames(name, liveAccounts(d).filter((a) => allowed(a, type)), (a) => a.name);

/* ---------------- entry drafts ---------------- */
export interface EntryDraft {
  type: EntryType; date: string; amount: number; particulars: string;
  accountId?: string | undefined; accountName?: string | undefined;
  method?: PayMethod | undefined; bankId?: string | undefined; bankName?: string | undefined;
  chequeNo?: string | undefined; reference?: string | undefined;
  categoryId?: string | undefined; categoryName?: string | undefined;
  materialId?: string | undefined; materialName?: string | undefined; weightKg?: number | undefined; rate?: number | undefined;
  payMode?: "credit" | "net" | undefined; remarks?: string | undefined; receivedBy?: string | undefined;
}

const NONE = (v: string) => ["none", "skip", "no", "nahi", "-"].includes(v.toLowerCase());

export function validateEntryDraft(d: Data, a: Args, today: string): ToolResult {
  const type = str(a["type"]) as EntryType;
  if (!VOICE_ENTRY_TYPES.includes(type)) return { ok: false, status: "invalid_type", allowed_types: VOICE_ENTRY_TYPES, instruction: "Ask the user which kind of entry this is." };
  const meta = ENTRY_TYPES[type];
  const trade = type === "sale" || type === "purchase";
  const missing: string[] = [];
  let date = today;
  if (hasDateArg(a)) { const r = resolveDate(a, today); if (!r) return { ok: false, status: "invalid_date", instruction: "That date is not valid. Ask the user for the date again." }; date = r; }

  // account
  let acc: Account | undefined;
  if (meta.party || type === "expense") {
    const nm = str(a["party_name"]);
    if (!nm) missing.push(type === "expense" ? "paid_to: who the expense was paid to (an existing account)" : `party_name: the ${partyKinds(type).only ?? "party"} account`);
    else {
      const r = resolveAccount(d, nm, type);
      if (r.status === "exact" || r.status === "clear") acc = r.best as Account;
      else return { ok: false, ...findAccountTool(d, nm, type) };
    }
  }
  // expense category
  let cat: { id: string; name: string } | undefined;
  if (type === "expense") {
    const cn = str(a["category"]);
    const cats = d.categories.filter((c) => c.selectable !== false);
    if (!cn) missing.push(`category: one of ${cats.map((c) => c.name).join(", ")}`);
    else { const r = matchNames(cn, cats, (c) => c.name); if (r.best) cat = r.best; else return { ok: false, status: r.status === "ambiguous" ? "category_ambiguous" : "category_not_found", categories: cats.map((c) => c.name), instruction: "Ask the user to pick one of these categories." }; }
  }
  // material, weight, rate, amount
  let mat: { id: string; name: string } | undefined;
  let weight: number | undefined, rate: number | undefined, amount = num(a["amount"]);
  if (trade) {
    const mn = str(a["material"]);
    if (!mn) missing.push(`material: one of ${d.materials.map((m) => m.name).join(", ")}`);
    else { const r = matchNames(mn, d.materials, (m) => m.name); if (r.best) mat = r.best; else return { ok: false, status: r.status === "ambiguous" ? "material_ambiguous" : "material_not_found", materials: d.materials.map((m) => m.name), instruction: "Ask the user to pick one of these materials." }; }
    weight = num(a["weight_kg"]); rate = num(a["rate"]);
    if (weight && rate) amount = Math.round(weight * rate * 100) / 100;
    else if (!amount) missing.push("weight_kg and rate (rupees per kg), or the total amount");
  } else if (!amount || amount <= 0) missing.push("amount");
  // sale / purchase type
  const pm = str(a["pay_mode"]);
  const payMode = pm === "credit" || pm === "net" ? pm : undefined;
  if (trade && !payMode) missing.push(`pay_mode: "credit" (pay later) or "net" (settled on the spot) for this ${type}`);
  // payment method, bank, cheque
  const showPay = meta.cash || (trade && payMode === "net");
  let method: PayMethod | undefined, bank: { id: string; name: string } | undefined, chequeNo: string | undefined, reference: string | undefined;
  if (showPay) {
    const pmeth = str(a["payment_method"]);
    if (pmeth === "cash" || pmeth === "cheque" || pmeth === "online") method = pmeth;
    else missing.push("payment_method: cash, cheque or online");
    if (method && method !== "cash") {
      const banks = liveBanks(d);
      const bn = str(a["bank_name"]);
      if (!bn) missing.push(`bank_name: one of ${banks.map((b) => b.name).join(", ") || "(no bank is set up yet)"}`);
      else { const r = matchNames(bn, banks, (b) => b.name); if (r.best) bank = r.best; else return { ok: false, status: r.status === "ambiguous" ? "bank_ambiguous" : "bank_not_found", banks: banks.map((b) => b.name), instruction: "Ask the user which of these banks. Never invent a bank name." }; }
      if (method === "cheque") { const cn = str(a["cheque_no"]); if (!cn) missing.push('cheque_no: ask for the cheque number (pass "none" if the user does not have it)'); else if (!NONE(cn)) chequeNo = cn; }
      if (method === "online") { const rf = str(a["reference"]); if (!rf) missing.push('reference: ask for the transaction reference (pass "none" to skip)'); else if (!NONE(rf)) reference = rf; }
    }
  }
  if (missing.length) return { ok: false, status: "missing_fields", missing, instruction: "Ask the user ONLY for these details, one or two at a time, in simple Roman Urdu. Then call record_transaction_draft again with everything collected so far." };
  const amt = amount as number;
  const label = ENTRY_TYPES[type].label;
  const tradeText = trade && weight ? `${mat?.name ?? ""} ${fmtTon(weight)}${rate ? ` @ Rs ${rate}/kg` : ""}` : mat?.name ?? "";
  const draft: EntryDraft = {
    type, date, amount: amt,
    particulars: trade ? tradeText || label : str(a["remarks"]) || (type === "expense" ? cat?.name ?? "Expense" : label),
    accountId: acc?.id, accountName: acc?.name, method, bankId: bank?.id, bankName: bank?.name, chequeNo, reference,
    categoryId: cat?.id, categoryName: cat?.name, materialId: mat?.id, materialName: mat?.name, weightKg: trade ? weight : undefined, rate: trade ? rate : undefined,
    payMode: trade ? payMode : undefined, remarks: trade ? str(a["remarks"]) || undefined : undefined,
  };
  return { ok: true, status: "draft_ready", draft, summary: summarizeDraft(draft) };
}

export function summarizeDraft(x: EntryDraft): string {
  const bits = [`${ENTRY_TYPES[x.type].label}${x.accountName ? ` ${x.type === "sale" ? "to" : x.type === "purchase" ? "from" : x.type === "inward" ? "from" : "to"} ${x.accountName}` : ""}`];
  if (x.materialName) bits.push(`${x.materialName}${x.weightKg ? ` ${fmtTon(x.weightKg)}` : ""}${x.rate ? ` at Rs ${x.rate} per kg` : ""}`);
  if (x.categoryName) bits.push(`category ${x.categoryName}`);
  bits.push(`total ${money(x.amount)}`);
  if (x.payMode) bits.push(x.payMode === "credit" ? "credit" : "net, paid on the spot");
  if (x.method) bits.push(`${METHODS[x.method]}${x.bankName ? ` via ${x.bankName}` : ""}${x.chequeNo ? `, cheque ${x.chequeNo}` : ""}${x.reference ? `, ref ${x.reference}` : ""}`);
  bits.push(`date ${x.date}`);
  return bits.join(", ");
}
export function draftRows(x: EntryDraft): Array<[string, string]> {
  const r: Array<[string, string | undefined]> = [
    [x.type === "expense" ? "Paid to" : "Party", x.accountName], ["Category", x.categoryName], ["Material", x.materialName],
    ["Weight", x.weightKg ? fmtTon(x.weightKg) : undefined], ["Rate", x.rate ? `Rs ${x.rate}/kg` : undefined],
    ["Amount", money(x.amount)], ["Type", x.payMode === "net" ? "Net (paid now)" : x.payMode === "credit" ? "Credit" : undefined],
    ["Method", x.method ? METHODS[x.method] : undefined], ["Bank", x.bankName], ["Cheque no", x.chequeNo], ["Reference", x.reference], ["Date", x.date],
  ];
  return r.filter((p): p is [string, string] => !!p[1]);
}
/** The saved entry, built the same way the entry form builds it. */
export function entryPayload(x: EntryDraft) {
  const cashy = !!x.method;
  return {
    type: x.type, date: x.date, amount: x.amount, particulars: x.particulars, remarks: x.remarks,
    accountId: x.accountId, method: x.method, chequeNo: x.method === "cheque" ? x.chequeNo : undefined,
    bank: cashy && x.method !== "cash" ? x.bankName : undefined, bankId: cashy && x.method !== "cash" ? x.bankId : undefined,
    reference: x.method === "online" ? x.reference : undefined,
    chequeStatus: ENTRY_TYPES[x.type].cash && x.method === "cheque" ? ("pending" as const) : undefined,
    categoryId: x.categoryId, materialId: x.materialId, weightKg: x.weightKg, rate: x.rate, payMode: x.payMode,
  };
}

/* ---------------- account drafts ---------------- */
export interface AccountDraft { name: string; type: AccountType; typeLabel: string; phone: string; address: string; openingBalance: number; fixedWages?: number | undefined; idCard?: string | undefined }

export function validateAccountDraft(d: Data, a: Args): ToolResult {
  const name = str(a["name"]);
  const tn = str(a["type"]);
  const types: Array<{ id: AccountType; name: string }> = [{ id: "buyer", name: "Buyer" }, { id: "supplier", name: "Supplier" }, { id: "worker", name: "Worker" }, ...d.accountTypes.map((t) => ({ id: t.id as AccountType, name: t.name }))];
  const missing: string[] = [];
  if (!name) missing.push("name");
  let type: { id: AccountType; name: string } | undefined;
  if (!tn) missing.push(`type: one of ${types.map((t) => t.name).join(", ")}`);
  else { const r = matchNames(tn, types, (t) => t.name, 0.7); type = r.best ?? r.candidates[0]?.item; if (!type) return { ok: false, status: "type_not_found", types: types.map((t) => t.name), instruction: "Ask the user to pick one of these account types." }; }
  if (type?.id === "worker" && a["fixed_wages"] === undefined) missing.push('fixed_wages: monthly wages in rupees (pass 0 if not decided)');
  if (missing.length) return { ok: false, status: "missing_fields", missing, instruction: "Ask the user ONLY for these, then call create_account again with everything collected." };
  if (a["confirm_new"] !== true) {
    const similar = matchNames(name, liveAccounts(d).filter((x) => !x.equity), (x) => x.name, 0.8);
    if (similar.status !== "none") return { ok: false, status: "similar_account_exists", candidates: similar.candidates.map((c) => ({ name: c.item.name, type: accountTypeLabel(d, c.item.type) })), instruction: "A similar account already exists. Read these names to the user. If they still want a new one, call create_account again with confirm_new true." };
  }
  const t = type as { id: AccountType; name: string };
  const draft: AccountDraft = { name, type: t.id, typeLabel: t.name, phone: str(a["phone"]), address: str(a["address"]), openingBalance: num(a["opening_balance"]) ?? 0, fixedWages: t.id === "worker" ? num(a["fixed_wages"]) ?? 0 : undefined, idCard: str(a["cnic"]) || undefined };
  return { ok: true, status: "draft_ready", draft, summary: `New ${t.name} account ${name}${draft.phone ? `, phone ${draft.phone}` : ""}${draft.openingBalance ? `, opening balance ${money(draft.openingBalance)}` : ""}${draft.fixedWages ? `, wages ${money(draft.fixedWages)}` : ""}` };
}

/* ---------------- questions about the data ---------------- */
const typeLabel = (t: EntryType) => ENTRY_TYPES[t]?.label ?? t;
export function entryRow(d: Data, e: Entry): ToolResult {
  const r: ToolResult = { date: e.date, voucher_no: e.voucherNo, type: typeLabel(e.type), account: d.accounts.find((x) => x.id === e.accountId)?.name, amount: e.amount };
  if (e.method) r["method"] = METHODS[e.method];
  if (e.bank) r["bank"] = e.bank;
  if (e.chequeNo) r["cheque_no"] = e.chequeNo;
  if (e.chequeStatus) r["cheque_status"] = e.chequeStatus;
  if (e.materialId) r["material"] = d.materials.find((m) => m.id === e.materialId)?.name;
  if (e.weightKg) r["weight_kg"] = e.weightKg;
  if (e.rate) r["rate_per_kg"] = e.rate;
  if (e.payMode) r["sale_type"] = e.payMode;
  if (e.categoryId) r["category"] = d.categories.find((c) => c.id === e.categoryId)?.name;
  if (e.particulars) r["particulars"] = e.particulars;
  if (e.remarks) r["remarks"] = e.remarks;
  return r;
}
const byNewest = (a: Entry, b: Entry) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

function accountOrFail(d: Data, name: string): { acc: Account } | { fail: ToolResult } {
  if (!name) return { fail: { status: "missing_fields", missing: ["account_name"] } };
  const r = matchNames(name, liveAccounts(d).filter((a) => !a.equity), (a) => a.name);
  if (r.status === "exact" || r.status === "clear") return { acc: r.best as Account };
  if (r.status === "ambiguous") return { fail: { status: "ambiguous", candidates: r.candidates.map((c) => ({ name: c.item.name, type: accountTypeLabel(d, c.item.type) })), instruction: "Ask which account the user means." } };
  return { fail: { status: "not_found", instruction: "No such account in the system. Say so; do not guess." } };
}

export function lastTransactionTool(d: Data, a: Args): ToolResult {
  const r = accountOrFail(d, str(a["account_name"]));
  if ("fail" in r) return r.fail;
  const rows = liveEntries(d).filter((e) => e.accountId === r.acc.id).sort(byNewest);
  if (!rows.length) return { status: "ok", account: r.acc.name, message: "No entries yet for this account.", opening_balance: r.acc.openingBalance };
  return { status: "ok", account: r.acc.name, last: entryRow(d, rows[0] as Entry), previous: rows.slice(1, 3).map((e) => entryRow(d, e)), balance: accountBalance(d, r.acc.id) };
}

export function searchEntriesTool(d: Data, a: Args, today: string): ToolResult {
  let rows = liveEntries(d);
  const an = str(a["account_name"]);
  let accName: string | undefined;
  if (an) { const r = accountOrFail(d, an); if ("fail" in r) return r.fail; accName = r.acc.name; rows = rows.filter((e) => e.accountId === r.acc.id); }
  const t = str(a["type"]) as EntryType;
  if (t && ENTRY_TYPES[t]) rows = rows.filter((e) => e.type === t);
  if (hasDateArg(a)) { const dt = resolveDate(a, today); if (!dt) return { status: "invalid_date" }; rows = rows.filter((e) => e.date === dt); }
  const from = str(a["from"]), to = str(a["to"]);
  if (from) rows = rows.filter((e) => e.date >= from);
  if (to) rows = rows.filter((e) => e.date <= to);
  const min = num(a["min_amount"]), max = num(a["max_amount"]);
  if (min !== undefined) rows = rows.filter((e) => e.amount >= min);
  if (max !== undefined) rows = rows.filter((e) => e.amount <= max);
  const text = str(a["text"]).toLowerCase();
  if (text) rows = rows.filter((e) => `${e.particulars ?? ""} ${e.remarks ?? ""} ${e.voucherNo}`.toLowerCase().includes(text));
  rows = [...rows].sort(byNewest);
  const limit = Math.min(25, Math.max(1, Math.round(num(a["limit"]) ?? 8)));
  return { status: "ok", account: accName, resolved_date: hasDateArg(a) ? resolveDate(a, today) : undefined, count: rows.length, total_amount: rows.filter(notBounced).reduce((s, e) => s + e.amount, 0), entries: rows.slice(0, limit).map((e) => entryRow(d, e)) };
}

export function accountBalanceTool(d: Data, a: Args): ToolResult {
  const r = accountOrFail(d, str(a["account_name"]));
  if ("fail" in r) return r.fail;
  return { status: "ok", ...accInfo(d, r.acc), recent: liveEntries(d).filter((e) => e.accountId === r.acc.id).sort(byNewest).slice(0, 3).map((e) => entryRow(d, e)) };
}

export function overviewTool(d: Data, today: string): ToolResult {
  const month = today.slice(0, 7);
  const live = liveEntries(d).filter((e) => e.date.startsWith(month));
  const sum = (t: EntryType) => live.filter((e) => e.type === t && notBounced(e)).reduce((s, e) => s + e.amount, 0);
  const p = partyTotals(d);
  return {
    status: "ok", today, funds: fundList(d).map((f) => ({ name: f.name, balance: f.closing })),
    receivables: p.receivable, payables: p.payable, supplier_advances: p.supplierAdvance, customer_advances: p.customerAdvance, worker_advance_outstanding: p.workerAdvance,
    this_month: { sales: sum("sale"), purchases: sum("purchase"), expenses: sum("expense"), salaries: sum("salary") },
    stock_kg: stockSummary(d).filter((r) => r.stock !== 0).map((r) => ({ material: r.name, kg: Math.round(r.stock) })),
    pending_cheques: liveEntries(d).filter((e) => e.chequeStatus === "pending").length, workers: workerTotals(d, month),
  };
}

const REPORTS = ["sales", "purchases", "expenses", "stock", "heats", "cheques", "workers", "receivables", "payables", "cash"] as const;
export function reportTool(d: Data, a: Args, today: string): ToolResult {
  const rep = str(a["report"]);
  const from = str(a["from"]) || today.slice(0, 8) + "01", to = str(a["to"]) || today;
  const inRange = (e: { date: string }) => e.date >= from && e.date <= to;
  const group = (rows: Entry[], key: (e: Entry) => string) => { const m = new Map<string, number>(); rows.forEach((e) => m.set(key(e), (m.get(key(e)) ?? 0) + e.amount)); return [...m].sort((x, y) => y[1] - x[1]).slice(0, 10).map(([k, v]) => ({ name: k, total: v })); };
  const acc = (e: Entry) => d.accounts.find((x) => x.id === e.accountId)?.name ?? "—";
  if (rep === "sales" || rep === "purchases") { const rows = liveEntries(d).filter((e) => e.type === (rep === "sales" ? "sale" : "purchase") && inRange(e)); return { status: "ok", report: rep, from, to, count: rows.length, total: rows.filter(notBounced).reduce((s, e) => s + e.amount, 0), total_kg: rows.reduce((s, e) => s + (e.weightKg ?? 0), 0), top_accounts: group(rows, acc) }; }
  if (rep === "expenses") { const rows = liveEntries(d).filter((e) => e.type === "expense" && inRange(e)); return { status: "ok", report: rep, from, to, count: rows.length, total: rows.filter(notBounced).reduce((s, e) => s + e.amount, 0), by_category: group(rows, (e) => d.categories.find((c) => c.id === e.categoryId)?.name ?? "Other") }; }
  if (rep === "stock") return { status: "ok", report: rep, stock: stockSummary(d).map((r) => ({ material: r.name, stock_kg: Math.round(r.stock), purchased_kg: Math.round(r.purchased), sold_kg: Math.round(r.sold), produced_kg: Math.round(r.produced) })) };
  if (rep === "heats") { const rows = liveProduction(d).filter(inRange); return { status: "ok", report: rep, from, to, heats: rows.length, total_output_kg: Math.round(rows.reduce((s, p) => s + p.totalKg, 0)), recent: [...rows].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5).map((p) => ({ date: p.date, output_kg: Math.round(p.totalKg), input_kg: Math.round(p.inputKg ?? p.totalKg) })) }; }
  if (rep === "cheques") { const rows = liveEntries(d).filter((e) => !!e.chequeStatus); return { status: "ok", report: rep, pending: rows.filter((e) => e.chequeStatus === "pending").map((e) => entryRow(d, e)).slice(0, 10), pending_count: rows.filter((e) => e.chequeStatus === "pending").length }; }
  if (rep === "workers") { const month = today.slice(0, 7); return { status: "ok", report: rep, month, workers: liveAccounts(d).filter((x) => x.type === "worker").map((w) => ({ name: w.name, ...workerMonth(d, w.id, month), advance_outstanding: Math.max(0, accountBalance(d, w.id)) })) }; }
  if (rep === "receivables" || rep === "payables") { const rows = liveAccounts(d).filter((x) => !x.equity && x.type !== "worker").map((x) => ({ name: x.name, balance: accountBalance(d, x.id) })).filter((r) => (rep === "receivables" ? r.balance > 0 : r.balance < 0)).sort((x, y) => Math.abs(y.balance) - Math.abs(x.balance)); return { status: "ok", report: rep, accounts: rows.slice(0, 15).map((r) => ({ name: r.name, amount: Math.abs(r.balance) })), count: rows.length }; }
  if (rep === "cash") return { status: "ok", report: rep, funds: fundList(d).map((f) => ({ name: f.name, balance: f.closing })) };
  return { status: "unknown_report", available: REPORTS };
}

/* ---------------- what each form needs ---------------- */
export function formSpecTool(a: Args): ToolResult {
  const t = str(a["entry_type"]) as EntryType;
  if (!VOICE_ENTRY_TYPES.includes(t)) return { status: "unknown_type", available: VOICE_ENTRY_TYPES };
  const common = "date (default today)";
  const pay = "payment_method (cash / cheque / online); for cheque or online also bank_name (from list_banks only); cheque: cheque_no; online: reference";
  const spec: Record<string, string> = {
    sale: `Account (a BUYER), material (list_materials), weight_kg and rate per kg (or a total amount), pay_mode credit or net; if net: ${pay}; ${common}; optional remarks.`,
    purchase: `Account (a SUPPLIER), material (list_materials), weight_kg and rate per kg (or a total amount), pay_mode credit or net; if net: ${pay}; ${common}; optional remarks.`,
    inward: `Receive payment: account (not a worker), amount, ${pay}; ${common}.`,
    outward: `Issue payment: account (not a worker), amount, ${pay}; ${common}.`,
    expense: `Category (list_categories), paid-to account (not a worker), amount, ${pay}; ${common}; optional remarks.`,
    salary: `Salary: worker account, amount, ${pay}; ${common}.`,
    advance: `Advance: worker account, amount, ${pay}; ${common}.`,
  };
  return { status: "ok", entry_type: t, label: ENTRY_TYPES[t].label, required_and_optional: spec[t] };
}
export function listTool(d: Data, what: string): ToolResult {
  if (what === "banks") return { status: "ok", banks: liveBanks(d).map((b) => b.name), note: "Cash in hand is separate; these are the only banks you may offer." };
  if (what === "materials") return { status: "ok", materials: d.materials.map((m) => m.name) };
  if (what === "categories") return { status: "ok", categories: d.categories.filter((c) => c.selectable !== false).map((c) => c.name) };
  return { status: "ok", account_types: ["Buyer", "Supplier", "Worker", ...d.accountTypes.map((t) => t.name)] };
}
