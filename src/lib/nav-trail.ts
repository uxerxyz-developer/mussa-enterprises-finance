import { useSyncExternalStore } from "react";

/**
 * In-app "path" (breadcrumb trail) used by the Back button.
 * - Dashboard is the root: arriving there clears the trail.
 * - Opening a top-level page (sidebar / bottom bar / any page link) restarts the trail at that page.
 * - Opening a detail page (ledger, voucher, bank) adds one step.
 * Back goes exactly one step up the trail and never past the Dashboard.
 */
const KEY = "nav_trail";
const DETAIL = ["/ledger/", "/voucher/", "/bank/"];

export const isDetailPath = (p: string) => DETAIL.some((d) => p.startsWith(d));

/** Pure: next trail after navigating to `pathname`. */
export function nextTrail(trail: string[], pathname: string): string[] {
  if (pathname === "/") return [];
  if (!isDetailPath(pathname)) return [pathname];
  const i = trail.indexOf(pathname);
  if (i >= 0) return trail.slice(0, i + 1);
  return [...trail, pathname];
}

let trail: string[] = [];
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(KEY) || "[]");
    if (Array.isArray(raw)) trail = raw.filter((x): x is string => typeof x === "string" && x.startsWith("/")).slice(0, 12);
  } catch { /* ignore */ }
}

export function syncTrail(pathname: string) {
  load();
  const next = nextTrail(trail, pathname);
  if (next.length === trail.length && next.every((x, i) => x === trail[i])) return;
  trail = next;
  try { window.sessionStorage.setItem(KEY, JSON.stringify(trail)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

export function useTrail(): string[] {
  return useSyncExternalStore((f) => { load(); subs.add(f); return () => { subs.delete(f); }; }, () => { load(); return trail; }, () => EMPTY);
}
const EMPTY: string[] = [];

/** Where Back leads from the current page: one step up the trail, else the Dashboard. */
export function parentOf(pathname: string): string {
  load();
  const i = trail.indexOf(pathname);
  if (i > 0) return trail[i - 1] ?? "/";
  return "/";
}
