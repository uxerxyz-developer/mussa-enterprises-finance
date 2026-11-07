/**
 * The spoken greeting is recorded once (the first time the model says it) and kept in the browser's IndexedDB,
 * so every later tap on the mic plays it instantly while the connection is still being made.
 */
export interface CachedGreeting { mime: string; chunks: string[] }
const DB = "voice-cache", STORE = "greeting";

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function loadGreeting(key: string): Promise<CachedGreeting | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const r = db.transaction(STORE).objectStore(STORE).get(key);
      r.onsuccess = () => {
        const v = r.result as CachedGreeting | undefined;
        resolve(v && Array.isArray(v.chunks) && v.chunks.length && typeof v.mime === "string" ? v : null);
      };
      r.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function saveGreeting(key: string, g: CachedGreeting): Promise<void> {
  const db = await open();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(g, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch { resolve(); }
  });
}
