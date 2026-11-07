import { describe, it, expect, beforeEach, vi } from "vitest";

const store: Record<string, string> = {};
vi.stubGlobal("sessionStorage", { clear: () => {} });
vi.stubGlobal("localStorage", { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { for (const k of Object.keys(store)) delete store[k]; } });

const db = await import("../db");
const { addAccount, addEntry, getData, accountBalance, balanceClass, partyTotals, fundBalance, CASH, resetAllData, workerMonth, workerLifetime, workerTotals, workerOutwardEntries, convertWorkerOutwardToAdvance } = db;

beforeEach(() => resetAllData());

const worker = () => addAccount({ name: "Ali Worker", type: "worker", phone: "", address: "", openingBalance: 0, fixedWages: 30000 });

describe("workers are never receivables", () => {
  it("advance, salary and issue payment all take 5,000 from cash and leave an advance, not a receivable", () => {
    for (const type of ["outward", "advance", "salary"] as const) {
      resetAllData();
      const w = worker();
      addEntry({ type, date: "2026-11-02", amount: 5000, accountId: w.id, method: "cash", particulars: "t" });
      expect(fundBalance(getData(), CASH)).toBe(-5000);
      expect(accountBalance(getData(), w.id)).toBe(5000);
      expect(balanceClass(w, 5000)).toBe("Worker Advance");
      const t = partyTotals(getData());
      expect(t.receivable).toBe(0);
      expect(t.workerAdvance).toBe(5000);
    }
  });
  it("a credit balance is salary payable and stays inside payables", () => {
    const w = addAccount({ name: "Bilal", type: "worker", phone: "", address: "", openingBalance: -7000, fixedWages: 20000 });
    expect(balanceClass(w, -7000)).toBe("Salary Payable");
    const t = partyTotals(getData());
    expect(t.salaryPayable).toBe(7000);
    expect(t.payable).toBe(7000);
    expect(t.receivable).toBe(0);
  });
  it("other parties are classified exactly as before", () => {
    const b = addAccount({ name: "Cust", type: "buyer", phone: "", address: "", openingBalance: 4000 });
    addAccount({ name: "Supp", type: "supplier", phone: "", address: "", openingBalance: -2500 });
    expect(balanceClass(b, 4000)).toBe("Receivable");
    const t = partyTotals(getData());
    expect(t.receivable).toBe(4000);
    expect(t.payable).toBe(2500);
  });
});

describe("worker month and running totals", () => {
  it("month figures reset by month, running totals do not", () => {
    const w = worker();
    addEntry({ type: "advance", date: "2026-10-20", amount: 4000, accountId: w.id, method: "cash", particulars: "a" });
    addEntry({ type: "advance", date: "2026-11-03", amount: 6000, accountId: w.id, method: "cash", particulars: "b" });
    addEntry({ type: "salary", date: "2026-11-05", amount: 10000, accountId: w.id, method: "cash", particulars: "s" });
    const nov = workerMonth(getData(), w.id, "2026-11");
    expect(nov).toEqual({ fixedWages: 30000, paidSalary: 10000, paidAdvance: 6000, remaining: 14000 });
    const oct = workerMonth(getData(), w.id, "2026-10");
    expect(oct.paidAdvance).toBe(4000);
    expect(oct.remaining).toBe(26000);
    const life = workerLifetime(getData(), w.id);
    expect(life).toEqual({ salaryPaid: 10000, advanceGiven: 10000, outstanding: 20000 });
    expect(workerTotals(getData(), "2026-11")).toEqual({ advanceOutstanding: 20000, salaryRemaining: 14000, count: 1 });
  });
});

describe("converting old worker payments", () => {
  it("changes only the type: balance and cash stay identical", () => {
    const w = worker();
    const cust = addAccount({ name: "Cust", type: "buyer", phone: "", address: "", openingBalance: 0 });
    addEntry({ type: "outward", date: "2026-11-02", amount: 3000, accountId: w.id, method: "cash", particulars: "old" });
    addEntry({ type: "outward", date: "2026-11-02", amount: 900, accountId: cust.id, method: "cash", particulars: "not a worker" });
    const balBefore = accountBalance(getData(), w.id), cashBefore = fundBalance(getData(), CASH);
    expect(workerOutwardEntries(getData())).toHaveLength(1);
    expect(convertWorkerOutwardToAdvance()).toBe(1);
    expect(accountBalance(getData(), w.id)).toBe(balBefore);
    expect(fundBalance(getData(), CASH)).toBe(cashBefore);
    expect(workerOutwardEntries(getData())).toHaveLength(0);
    expect(getData().entries.filter((e) => e.type === "outward")).toHaveLength(1);
    expect(workerMonth(getData(), w.id, "2026-11").paidAdvance).toBe(3000);
  });
});
