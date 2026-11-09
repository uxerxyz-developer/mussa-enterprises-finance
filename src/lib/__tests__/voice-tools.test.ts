import { describe, it, expect, beforeEach, vi } from "vitest";

const store: Record<string, string> = {};
vi.stubGlobal("sessionStorage", { clear: () => {} });
vi.stubGlobal("localStorage", { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { for (const k of Object.keys(store)) delete store[k]; } });

const db = await import("../db");
const vt = await import("../voice-tools");
const fz = await import("../fuzzy");
const rm = await import("../romanize");
const { addAccount, addBank, addEntry, getData, resetAllData } = db;
const TODAY = "2026-11-12";

const seed = () => {
  addAccount({ name: "Al Fateh Steel Industries", type: "supplier", phone: "", address: "", openingBalance: 0 });
  addAccount({ name: "Al Fateh Traders", type: "buyer", phone: "", address: "", openingBalance: 0 });
  addAccount({ name: "Ali Traders", type: "supplier", phone: "", address: "", openingBalance: 0 });
  addAccount({ name: "Ali Raza", type: "buyer", phone: "", address: "", openingBalance: 0 });
  addAccount({ name: "Usman Metals", type: "buyer", phone: "", address: "", openingBalance: 0 });
  addAccount({ name: "Bilal Worker", type: "worker", phone: "", address: "", openingBalance: 0, fixedWages: 30000 });
  addBank({ name: "Meezan Bank", accountNo: "1", openingBalance: 0 });
  addBank({ name: "HBL", accountNo: "2", openingBalance: 0 });
};
beforeEach(() => { resetAllData(); seed(); });
const names = (r: any) => (r.candidates ?? []).map((c: any) => c.item?.name ?? c.name);

describe("fuzzy names", () => {
  it("spelling variants and joined words find the right account", () => {
    const d = getData();
    const accs = d.accounts;
    const m = (q: string) => fz.matchNames(q, accs, (a) => a.name);
    expect(m("alfatah steel").best?.name).toBe("Al Fateh Steel Industries");
    expect(m("fateh steel industry").best?.name).toBe("Al Fateh Steel Industries");
    expect(m("usmaan metal").best?.name).toBe("Usman Metals");
    expect(m("ali traders").best?.name).toBe("Ali Traders");
    expect(m("alfateh").status).toBe("ambiguous");
    expect(m("ali").status).toBe("ambiguous");
    expect(m("zzzz").status).toBe("none");
  });
});

describe("find account respects the entry type", () => {
  it("purchase only looks at suppliers, sale only at buyers, payments never at workers", () => {
    const d = getData();
    expect((vt.findAccountTool(d, "alfateh", "purchase") as any).account.name).toBe("Al Fateh Steel Industries");
    expect((vt.findAccountTool(d, "alfateh", "sale") as any).account.name).toBe("Al Fateh Traders");
    expect((vt.findAccountTool(d, "ali raza", "purchase") as any).status).toBe("not_found");
    expect((vt.findAccountTool(d, "ali raza", "purchase") as any).exists_as_other_type).toBeTruthy();
    expect((vt.findAccountTool(d, "bilal", "outward") as any).status).toBe("not_found");
    expect((vt.findAccountTool(d, "bilal", "advance") as any).account.name).toBe("Bilal Worker");
  });
});

describe("entry drafts follow the form rules", () => {
  it("an unknown account is reported, never drafted", () => {
    const r = vt.validateEntryDraft(getData(), { type: "purchase", party_name: "Nobody Traders", amount: 100 }, TODAY) as any;
    expect(r.ok).toBe(false);
    expect(r.status).toBe("not_found");
    expect(r.can_create).toBe(true);
  });
  it("purchase asks for material, weight and rate, type", () => {
    const r = vt.validateEntryDraft(getData(), { type: "purchase", party_name: "alfateh steel" }, TODAY) as any;
    expect(r.status).toBe("missing_fields");
    expect(r.missing.join(" ")).toContain("material");
    expect(r.missing.join(" ")).toContain("weight_kg");
    expect(r.missing.join(" ")).toContain("pay_mode");
  });
  it("a complete credit purchase is ready, amount = weight x rate", () => {
    const r = vt.validateEntryDraft(getData(), { type: "purchase", party_name: "alfateh steel", material: "scrap", weight_kg: 4500, rate: 120, pay_mode: "credit" }, TODAY) as any;
    expect(r.ok).toBe(true);
    expect(r.draft.amount).toBe(540000);
    expect(r.draft.accountName).toBe("Al Fateh Steel Industries");
    expect(r.draft.materialName).toBe("Scrap");
  });
  it("cheque needs a bank from the list and a cheque number", () => {
    const base = { type: "outward", party_name: "ali traders", amount: 5000, payment_method: "cheque" };
    expect((vt.validateEntryDraft(getData(), base, TODAY) as any).missing.join(" ")).toContain("bank_name");
    expect((vt.validateEntryDraft(getData(), { ...base, bank_name: "Zzzq Finance" }, TODAY) as any).status).toBe("bank_not_found");
    // a built-in bank that was never used before is accepted too (it is created when the entry is saved)
    const allied = vt.validateEntryDraft(getData(), { ...base, bank_name: "Allied" }, TODAY) as any;
    expect(allied.status).not.toBe("bank_not_found");
    expect(vt.listTool(getData(), "banks")).toMatchObject({ banks: expect.arrayContaining(["Meezan Bank", "Bank Alfalah"]) });
    const r = vt.validateEntryDraft(getData(), { ...base, bank_name: "mezan bank" }, TODAY) as any;
    expect(r.missing.join(" ")).toContain("cheque_no");
    const ok = vt.validateEntryDraft(getData(), { ...base, bank_name: "mezan bank", cheque_no: "123456" }, TODAY) as any;
    expect(ok.ok).toBe(true);
    expect(ok.draft.bankName).toBe("Meezan Bank");
    expect(ok.draft.chequeNo).toBe("123456");
  });
  it("payment method is required for payments and expenses", () => {
    const r = vt.validateEntryDraft(getData(), { type: "inward", party_name: "usman", amount: 100 }, TODAY) as any;
    expect(r.missing.join(" ")).toContain("payment_method");
  });
  it("expense needs a category and a paid-to account", () => {
    const r = vt.validateEntryDraft(getData(), { type: "expense", amount: 900, payment_method: "cash" }, TODAY) as any;
    expect(r.missing.join(" ")).toContain("category");
    expect(r.missing.join(" ")).toContain("paid_to");
  });
});

describe("dates", () => {
  it("days_ago and day_of_month resolve from today", () => {
    expect(vt.resolveDate({ days_ago: 2 }, TODAY)).toBe("2026-11-10");
    expect(vt.resolveDate({ day_of_month: 10 }, TODAY)).toBe("2026-11-10");
    expect(vt.resolveDate({ day_of_month: 20 }, TODAY)).toBe("2026-10-20");
    expect(vt.resolveDate({ day_of_month: 31 }, "2026-12-05")).toBe(undefined);
  });
});

describe("questions about the ledger", () => {
  it("last transaction, and what was paid on a date", () => {
    const d0 = getData();
    const ali = d0.accounts.find((a) => a.name === "Ali Traders")!;
    addEntry({ type: "purchase", date: "2026-11-05", amount: 1000, accountId: ali.id, particulars: "p", payMode: "credit" });
    addEntry({ type: "outward", date: "2026-11-10", amount: 400, accountId: ali.id, method: "cash", particulars: "pay" });
    const d = getData();
    const last = vt.lastTransactionTool(d, { account_name: "ali traders" }) as any;
    expect(last.last.type).toBe("Payment Issued");
    expect(last.last.amount).toBe(400);
    const on10 = vt.searchEntriesTool(d, { account_name: "ali traders", day_of_month: 10, type: "outward" }, TODAY) as any;
    expect(on10.count).toBe(1);
    expect(on10.total_amount).toBe(400);
    expect(on10.resolved_date).toBe("2026-11-10");
    const parson = vt.searchEntriesTool(d, { account_name: "ali traders", days_ago: 2 }, TODAY) as any;
    expect(parson.entries[0].voucher_no).toBeTruthy();
  });
});

describe("account drafts", () => {
  it("asks for type, warns about a similar account, builds the draft", () => {
    const d = getData();
    expect((vt.validateAccountDraft(d, { name: "New Co" }) as any).missing.join(" ")).toContain("type");
    expect((vt.validateAccountDraft(d, { name: "Al Fateh Steel", type: "supplier" }) as any).status).toBe("similar_account_exists");
    // phone, address and opening balance are asked for unless the user skips them
    expect((vt.validateAccountDraft(d, { name: "Zain Brothers", type: "buyer", phone: "0300" }) as any).status).toBe("ask_details");
    const ok = vt.validateAccountDraft(d, { name: "Zain Brothers", type: "buyer", phone: "0300", skip_optional: true }) as any;
    expect(ok.ok).toBe(true);
    expect(ok.draft.type).toBe("buyer");
  });
  it("never guesses which way an opening balance runs, and stores payable as negative", () => {
    const d = getData();
    const base = { name: "Zain Brothers", type: "supplier", phone: "none", address: "none" };
    expect((vt.validateAccountDraft(d, { ...base, opening_lakh: 1 }) as any).status).toBe("opening_side_needed");
    const pay = vt.validateAccountDraft(d, { ...base, opening_lakh: 1, opening_side: "payable" }) as any;
    expect(pay.draft.openingBalance).toBe(-100000);
    const rec = vt.validateAccountDraft(d, { ...base, opening_balance: 250000, opening_side: "receivable" }) as any;
    expect(rec.draft.openingBalance).toBe(250000);
    expect((vt.validateAccountDraft(d, { ...base, opening_balance: 0 }) as any).draft.openingBalance).toBe(0);
  });
});

describe("amounts", () => {
  it("groups the Pakistani way and speaks lakh and crore", () => {
    expect(vt.money(1479640)).toBe("Rs 14,79,640");
    expect(vt.money(-4000000)).toBe("Rs -40,00,000");
    expect(vt.speakAmount(1479640)).toBe("14 lakh 79 hazar 640 rupay");
    expect(vt.speakAmount(15000000)).toBe("1 crore 50 lakh rupay");
    expect(vt.speakAmount(100000)).toBe("1 lakh rupay");
  });
  it("sums an amount given in parts", () => {
    expect(vt.partsAmount({ amount_crore: 1, amount_lakh: 50 })).toBe(15000000);
    expect(vt.partsAmount({ opening_lakh: 5, opening_thousand: 25 }, "opening")).toBe(525000);
    expect(vt.partsAmount({ amount: 5000 })).toBeUndefined();
  });
  it("adds spoken text to every money field but not to weights or counts", () => {
    const out = vt.withSpoken({ total: 1479640, total_kg: 5000, count: 3, accounts: [{ name: "A", amount: 100000 }] }) as any;
    expect(out.total_words).toBe("14 lakh 79 hazar 640 rupay");
    expect(out.total_text).toBe("Rs 14,79,640");
    expect(out.total_kg_words).toBeUndefined();
    expect(out.count_words).toBeUndefined();
    expect(out.accounts[0].amount_words).toBe("1 lakh rupay");
  });
  it("receivable and payable reports carry a total over every account", () => {
    const r = vt.reportTool(getData(), { report: "receivables" }, TODAY) as any;
    expect(r).toHaveProperty("total");
  });
});

describe("Roman Urdu display", () => {
  it("turns Hindi script into Roman letters and leaves Latin text alone", () => {
    expect(rm.romanize("Hello ali traders 5000")).toBe("Hello ali traders 5000");
    expect(rm.romanize("अली")).toBe("ali");
    expect(rm.romanize("पांच हज़ार")).toBe("panch hazar");
    expect(rm.romanize("एंट्री")).toBe("entri");
    expect(rm.romanize("दिए")).toBe("diye");
    expect(rm.romanize("علی")).toBe("ali");
  });
});
