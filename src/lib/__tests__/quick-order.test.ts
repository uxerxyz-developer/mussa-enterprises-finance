import { describe, it, expect } from "vitest";
import { moveToTarget } from "@/lib/quick-order";

describe("quick action reordering", () => {
  const base = ["a", "b", "c", "d"];
  it("every drag, in any direction, lands exactly on the target position", () => {
    for (let from = 0; from < base.length; from++) {
      for (let to = 0; to < base.length; to++) {
        if (from === to) continue;
        const out = moveToTarget(base, base[from]!, base[to]!);
        expect(out).toHaveLength(base.length);
        expect(new Set(out)).toEqual(new Set(base));
        expect(out.indexOf(base[from]!)).toBe(to);
      }
    }
  });
  it("moving to the next item to the right actually changes the order", () => {
    expect(moveToTarget(base, "a", "b")).toEqual(["b", "a", "c", "d"]);
  });
  it("moving to the next item to the left still works", () => {
    expect(moveToTarget(base, "b", "a")).toEqual(["b", "a", "c", "d"]);
  });
  it("an item that is not in the list is added before the target; no target appends", () => {
    expect(moveToTarget(["a", "b"], "x", "b")).toEqual(["a", "x", "b"]);
    expect(moveToTarget(["a", "b"], "x")).toEqual(["a", "b", "x"]);
  });
});
