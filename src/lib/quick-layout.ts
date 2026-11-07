/** Layout rules for the Quick Actions card (presentation only). */
export type QuickKind = "hero" | "tile";

/** Hero rows are a little taller than tile rows. */
export const HERO_FR = 1.35;
const HERO_MIN = 60;
const TILE_MIN = 52;

/** The first two actions are full-width heroes; if an odd tile would be left alone at the end, it becomes a hero too. */
export function quickKinds(n: number): QuickKind[] {
  const kinds: QuickKind[] = Array.from({ length: n }, (_, i) => (i < 2 ? "hero" : "tile"));
  if (n > 2 && (n - 2) % 2 === 1) kinds[n - 1] = "hero";
  return kinds;
}

/** One weight per grid row: every hero has its own row, tiles share a row in pairs. */
export function quickRowWeights(kinds: QuickKind[]): number[] {
  const weights: number[] = [];
  for (let i = 0; i < kinds.length; i++) {
    if (kinds[i] === "hero") weights.push(HERO_FR);
    else { weights.push(1); i++; }
  }
  return weights;
}

/** Smallest grid height (px) at which the hero layout stays readable; below it the compact grid is used. */
export function quickMinHeight(kinds: QuickKind[], gap: number): number {
  const weights = quickRowWeights(kinds);
  const rows = weights.reduce((t, w) => t + (w === HERO_FR ? HERO_MIN : TILE_MIN), 0);
  return rows + Math.max(0, weights.length - 1) * gap;
}
