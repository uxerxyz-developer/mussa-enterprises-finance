import { describe, it, expect } from "vitest";
import { amountNote, isBounced, isNet, payParts } from "@/lib/ledger-display";

const join = (p: { text: string }[]) => p.map((x) => x.text).join(" · ");

describe("ledger display helpers", () => {
  it("bounced cheque keeps its amount (struck) and says BOUNCED, without Pending / Cleared wording", () => {
    const e = { type: "inward", method: "cheque", chequeNo: "78231", chequeStatus: "bounced" } as const;
    const parts = payParts(e, { bank: "Bank Alfalah", amount: "Rs 2,50,720", method: "Cheque" });
    expect(join(parts)).toBe("Cheque #78231 · Bank Alfalah · Rs 2,50,720 · BOUNCED");
    expect(parts[2]).toEqual({ text: "Rs 2,50,720", strike: true });
    expect(isBounced(e)).toBe(true);
  });
  it("cleared and pending cheques show number and bank only", () => {
    for (const chequeStatus of ["cleared", "pending", undefined] as const) {
      const parts = payParts({ type: "inward", method: "cheque", chequeNo: "9", chequeStatus }, { bank: "HBL", amount: "Rs 1", method: "Cheque" });
      expect(join(parts)).toBe("Cheque #9 · HBL");
    }
  });
  it("cash and online payments", () => {
    expect(join(payParts({ type: "outward", method: "cash" }, { bank: "", amount: "Rs 1", method: "Cash" }))).toBe("Cash");
    expect(join(payParts({ type: "outward", method: "online", reference: "R5" }, { bank: "Meezan", amount: "Rs 1", method: "Online Transfer" }))).toBe("Online Transfer · Ref R5 · Meezan");
  });
  it("net sale shows its amount, credit sale does not", () => {
    const net = { type: "sale", payMode: "net", method: "cash" } as const;
    expect(join(payParts(net, { bank: "", amount: "Rs 38,66,252", method: "Cash" }))).toBe("Net Sale · Cash · Rs 38,66,252");
    expect(isNet(net)).toBe(true);
    expect(join(payParts({ type: "purchase", payMode: "credit" }, { bank: "", amount: "Rs 5", method: "" }))).toBe("Credit Purchase");
    expect(isNet({ type: "inward", payMode: "net" })).toBe(false);
  });
  it("amountNote only for zero-effect entries", () => {
    expect(amountNote({ type: "sale", payMode: "credit" }, "Rs 5")).toEqual([]);
    expect(join(amountNote({ type: "sale", payMode: "net" }, "Rs 7"))).toBe("Net Sale · Rs 7");
    expect(join(amountNote({ type: "inward", chequeStatus: "bounced" }, "Rs 9"))).toBe("Rs 9 · BOUNCED");
  });
});
