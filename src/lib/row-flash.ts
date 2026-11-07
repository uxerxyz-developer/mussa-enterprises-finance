import { useSyncExternalStore } from "react";

/** Tells list tables which entry was just saved so its row can flash briefly (display only). */
let id: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();

export function flashEntry(entryId: string) {
  id = entryId;
  subs.forEach((f) => f());
  clearTimeout(timer);
  timer = setTimeout(() => { id = null; subs.forEach((f) => f()); }, 1800);
}
export function useFlashId(): string | null {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => id, () => null);
}
