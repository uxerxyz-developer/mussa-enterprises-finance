import { describe, it, expect } from "vitest";
import { quickKinds, quickMinHeight, quickRowWeights, HERO_FR } from "@/lib/quick-layout";

describe("quick actions hero layout", () => {
  it("first two are heroes, the rest are tiles", () => {
    expect(quickKinds(4)).toEqual(["hero", "hero", "tile", "tile"]);
    expect(quickKinds(6)).toEqual(["hero", "hero", "tile", "tile", "tile", "tile"]);
  });
  it("an odd leftover tile becomes a hero (last button)", () => {
    expect(quickKinds(5)).toEqual(["hero", "hero", "tile", "tile", "hero"]);
    expect(quickKinds(7)).toEqual(["hero", "hero", "tile", "tile", "tile", "tile", "hero"]);
    expect(quickKinds(3)).toEqual(["hero", "hero", "hero"]);
  });
  it("one or two actions are all heroes", () => {
    expect(quickKinds(1)).toEqual(["hero"]);
    expect(quickKinds(2)).toEqual(["hero", "hero"]);
  });
  it("tiles always pair up, so every grid row is full", () => {
    for (let n = 1; n <= 7; n++) {
      const kinds = quickKinds(n);
      const tiles = kinds.filter((k) => k === "tile").length;
      expect(tiles % 2).toBe(0);
      expect(quickRowWeights(kinds)).toHaveLength(kinds.filter((k) => k === "hero").length + tiles / 2);
    }
  });
  it("row weights and minimum height", () => {
    expect(quickRowWeights(quickKinds(4))).toEqual([HERO_FR, HERO_FR, 1]);
    expect(quickMinHeight(quickKinds(4), 8)).toBe(60 + 60 + 52 + 16);
    expect(quickMinHeight(quickKinds(6), 8)).toBeGreaterThan(quickMinHeight(quickKinds(4), 8));
  });
});
