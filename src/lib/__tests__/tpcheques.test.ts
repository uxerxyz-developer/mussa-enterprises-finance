import { describe, it, expect } from "vitest";
import { signedForAccount, entryFunds, chequeVault, liveEntries, type Entry, type Data } from "@/lib/db";
const base = { date: "2026-11-11", particulars: "", createdAt: "" } as const;
const chq = (id: string, amount: number) => ({ id, chequeNo: "1", bank: "HBL", date: "2026-11-11", amount });
describe("third-party cheques", () => {
  const recv = { ...base, id: "r", voucherNo: 1, type: "inward", accountId: "A", amount: 300000, tpCheques: [chq("c1", 200000), chq("c2", 100000)], tpAmount: 300000 } as Entry;
  const pay = { ...base, id: "p", voucherNo: 2, type: "outward", accountId: "B", amount: 350000, method: "online", bankId: "hbl", forwardIds: ["c1"], tpAmount: 200000 } as Entry;
  it("received cheques reduce party balance by full amount", () => expect(signedForAccount(recv)).toBe(-300000));
  it("received cheques do not touch own funds", () => expect(entryFunds(recv)).toEqual([]));
  it("mixed payment moves only the own bank portion", () => expect(entryFunds(pay)).toEqual([{ fund: "hbl", delta: -150000 }]));
  it("mixed payment reduces vendor payable by full amount", () => expect(signedForAccount(pay)).toBe(350000));
  it("forwarded cheque leaves the vault; drafts hold it", () => {
    const d = { entries: [recv, pay] } as unknown as Data;
    expect(chequeVault(d).map((c) => c.status)).toEqual(["forwarded", "in_hand"]);
    const d2 = { entries: [recv, { ...pay, draft: true }] } as unknown as Data;
    expect(chequeVault(d2)[0]!.status).toBe("held");
    expect(liveEntries(d2).length).toBe(1);
  });
});
