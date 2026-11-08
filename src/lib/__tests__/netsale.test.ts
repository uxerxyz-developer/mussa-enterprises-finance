import { describe, it, expect } from "vitest";
import { signedForAccount, entryFunds, notBounced, type Entry } from "@/lib/db";
const base = { id: "x", date: "2026-10-19", amount: 600000, particulars: "", voucherNo: 1, createdAt: "" } as unknown as Entry;
describe("net sale", () => {
  it("does not change party balance", () => { expect(signedForAccount({ ...base, type: "sale", payMode: "net" })).toBe(0); });
  it("credit sale adds to balance", () => { expect(signedForAccount({ ...base, type: "sale", payMode: "credit" })).toBe(600000); });
  it("net purchase without a payment method moves no money", () => { expect(entryFunds({ ...base, type: "purchase", payMode: "net" }).reduce((t, f) => t + f.delta, 0)).toBe(0); });
  it("net purchase paid in cash takes it out of cash in hand", () => { expect(entryFunds({ ...base, type: "purchase", payMode: "net", method: "cash" })).toEqual([{ fund: "cash", delta: -600000 }]); });
  it("net purchase paid by cheque takes it out of that bank", () => { expect(entryFunds({ ...base, type: "purchase", payMode: "net", method: "cheque", bankId: "b1" })).toEqual([{ fund: "b1", delta: -600000 }]); });
  it("net sale paid online brings it into that bank", () => { expect(entryFunds({ ...base, type: "sale", payMode: "net", method: "online", bankId: "b1" })).toEqual([{ fund: "b1", delta: 600000 }]); });
  it("credit purchase moves no money", () => { expect(entryFunds({ ...base, type: "purchase", payMode: "credit", method: "cash" })).toEqual([]); });
  it("a bounced amount is not counted", () => { expect(notBounced({ chequeStatus: "bounced" })).toBe(false); expect(notBounced({ chequeStatus: "pending" })).toBe(true); });
});
