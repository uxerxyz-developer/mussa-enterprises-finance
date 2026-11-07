/** Display-only helpers for the party ledger (no accounting logic: Debit / Credit / balance come from db.ts untouched). */
import type { Entry } from "./db";

export type DetailPart = { text: string; strike?: boolean; bold?: boolean };

/** Same rule as signedForAccount in db.ts: a bounced cheque settles nothing. */
export const isBounced = (e: Pick<Entry, "chequeStatus">) => e.chequeStatus === "bounced";
const isTrade = (e: Pick<Entry, "type">) => e.type === "sale" || e.type === "purchase";
/** Net sale / purchase: paid on the spot, so it leaves the party balance unchanged (Debit and Credit stay empty). */
export const isNet = (e: Pick<Entry, "type" | "payMode">) => isTrade(e) && e.payMode === "net";
const kind = (e: Pick<Entry, "type">) => (e.type === "purchase" ? "Purchase" : "Sale");

/** Entries whose amount is in neither Debit nor Credit: shown as a note so the amount is never lost. */
export function amountNote(e: Pick<Entry, "type" | "payMode" | "chequeStatus">, amount: string): DetailPart[] {
  if (isBounced(e)) return [{ text: amount, strike: true }, { text: "BOUNCED", bold: true }];
  if (isNet(e)) return [{ text: `Net ${kind(e)}` }, { text: amount }];
  return [];
}

/**
 * Payment line for the printed statement (replaces the old Method / Chq column).
 * Credit / Net / Advance for trade entries, method with cheque or reference number, bank name, and for the two
 * zero-effect cases the amount. Pending / Cleared are never mentioned; only BOUNCED is.
 */
export function payParts(e: Pick<Entry, "type" | "payMode" | "chequeStatus" | "method" | "chequeNo" | "reference">, o: { bank: string; amount: string; method: string }): DetailPart[] {
  const parts: DetailPart[] = [];
  if (isTrade(e) && e.payMode) parts.push({ text: `${e.payMode === "net" ? "Net" : e.payMode === "advance" ? "Advance" : "Credit"} ${kind(e)}` });
  if (e.method) {
    const no = e.method === "cheque" ? e.chequeNo?.trim() : e.method === "online" ? e.reference?.trim() : "";
    parts.push({ text: e.method === "cheque" ? `Cheque${no ? ` #${no}` : ""}` : `${o.method}${no ? ` · Ref ${no}` : ""}` });
    if (e.method !== "cash" && o.bank) parts.push({ text: o.bank });
  }
  if (isBounced(e)) parts.push({ text: o.amount, strike: true }, { text: "BOUNCED", bold: true });
  else if (isNet(e)) parts.push({ text: o.amount });
  return parts;
}
