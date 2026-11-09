/**
 * Spelling-tolerant matching for spoken (Roman Urdu) names: "alfateh", "alfatah" and "Al Fateh" all find
 * "Al Fateh Steel Industries". Pure functions, no browser APIs.
 */
import { romanize } from "./romanize";

const STOP = new Set(["al", "e", "ul", "ud", "ka", "ki", "ke", "and", "the"]);

/** Lower-case, letters and digits only, a few Roman-Urdu spelling folds. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ph/g, "f").replace(/q/g, "k").replace(/w/g, "v").replace(/ee/g, "i").replace(/oo/g, "u").replace(/aa/g, "a")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Consonant skeleton of one word: vowels, y and silent h dropped, repeats collapsed. */
export function skeleton(word: string): string {
  const w = fold(word).replace(/ /g, "");
  if (!w) return "";
  const first = /[aeiou]/.test(w[0] ?? "") ? "a" : w[0] ?? "";
  const rest = w.slice(1).replace(/[aeiouyh]/g, "").replace(/(.)\1+/g, "$1");
  return first + rest;
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n] ?? 0;
}

function wordSim(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length >= 2 && b.length >= 2 && skeleton(a) === skeleton(b)) return 0.93;
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  if (s.length >= 3 && l.startsWith(s)) return 0.86;
  if (s.length >= 3 && skeleton(l).startsWith(skeleton(s)) && skeleton(s).length >= 3) return 0.8;
  return Math.max(0, 1 - lev(a, b) / Math.max(a.length, b.length));
}

const words = (s: string) => fold(s).split(" ").filter(Boolean);
const meaningful = (ws: string[]) => { const m = ws.filter((w) => !STOP.has(w)); return m.length ? m : ws; };

/** 0..1 similarity between what was said and a stored name. */
export function nameScore(query: string, name: string): number {
  if (/[\u0600-\u06FF]/.test(query)) query = romanize(query); // a name heard in Urdu script is matched in Roman letters
  const qw = words(query), cw = words(name);
  const q = meaningful(qw), c = meaningful(cw);
  if (!q.length || !c.length) return 0;
  // Whole-string comparison, with and without the little words ("al"): handles joined speech such as "alfateh".
  const pairs: Array<[string, string]> = [[q.join(""), c.join("")], [qw.join(""), cw.join("")]];
  let best = 0;
  for (const [qs, cs] of pairs) {
    if (qs.length < 3) continue;
    if (qs === cs) best = Math.max(best, 1);
    else if (skeleton(qs) === skeleton(cs)) best = Math.max(best, 0.95);
    else if (qs.length >= 4 && cs.startsWith(qs)) best = Math.max(best, 0.86);
    else if (qs.length >= 4 && skeleton(qs).length >= 3 && skeleton(cs).startsWith(skeleton(qs))) best = Math.max(best, 0.84);
  }
  // Word by word: every spoken word should find a word of the stored name.
  const used = new Set<number>();
  let sum = 0, minSim = 1;
  for (const w0 of q) {
    const w = w0.length >= 5 && w0.startsWith("al") ? w0.slice(2) : w0;
    let bi = -1, bs = 0;
    c.forEach((x, i) => { if (used.has(i)) return; const sc = wordSim(w, x); if (sc > bs) { bs = sc; bi = i; } });
    if (bi >= 0) used.add(bi);
    sum += bs;
    minSim = Math.min(minSim, bs);
  }
  // When several words were said, a word that matches nothing should sink the match ("ali raza" is not "Ali Traders").
  const coverage = q.length > 1 && minSim < 0.6 ? (sum / q.length) * 0.78 : sum / q.length;
  const extra = Math.min(0.1, Math.max(0, c.length - q.length) * 0.02);
  return Math.max(best - extra, coverage - extra);
}

export interface Ranked<T> { item: T; score: number }
export type MatchStatus = "exact" | "clear" | "ambiguous" | "none";
export interface MatchResult<T> { status: MatchStatus; best?: T; candidates: Ranked<T>[] }

/** Rank `items` by how well `getName(item)` matches `query`; decide whether to pick one or ask the user. */
export function matchNames<T>(query: string, items: T[], getName: (t: T) => string, min = 0.62): MatchResult<T> {
  const ranked = items.map((item) => ({ item, score: nameScore(query, getName(item)) })).filter((r) => r.score >= min).sort((a, b) => b.score - a.score);
  const top = ranked[0], second = ranked[1];
  if (!top) return { status: "none", candidates: [] };
  const exactName = fold(query).replace(/ /g, "") === fold(getName(top.item)).replace(/ /g, "");
  if (exactName && (!second || second.score < 0.999)) return { status: "exact", best: top.item, candidates: ranked.slice(0, 3) };
  if (top.score >= 0.8 && (!second || second.score < top.score - 0.12)) return { status: "clear", best: top.item, candidates: ranked.slice(0, 3) };
  return { status: "ambiguous", candidates: ranked.slice(0, 3) };
}
