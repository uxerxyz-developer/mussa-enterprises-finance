/**
 * The one search box in the top bar. On the Accounts, Vouchers, Entries and Expenses pages it filters that page's list;
 * everywhere else (including the Dashboard) it keeps its normal job of finding an account and opening its ledger.
 */
import { useSyncExternalStore } from "react";

let text = "";
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export const setPageSearch = (v: string) => { if (v === text) return; text = v; listeners.forEach((fn) => fn()); };
export const usePageSearch = (): string => useSyncExternalStore(subscribe, () => text, () => "");

/** Pages whose list the top bar filters, with the hint shown in the box. */
export const PAGE_SEARCH: Record<string, string> = {
  "/accounts": "Search accounts, ID or type…",
  "/vouchers": "Search voucher no., party or details…",
  "/entries": "Search name, ID, voucher, cheque, particulars…",
  "/expenses": "Search expenses, category, party or details…",
};
