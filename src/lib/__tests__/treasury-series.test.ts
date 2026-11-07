import { describe, it, expect } from "vitest";
import { activitySeries, balanceSeries, lastDays, shares, smoothPath } from "@/lib/treasury-series";

describe("treasury visuals helpers", () => {
  it("lastDays returns n consecutive days ending today, oldest first", () => {
    expect(lastDays(3, "2026-11-06")).toEqual(["2026-11-04", "2026-11-05", "2026-11-06"]);
    expect(lastDays(3, "2026-03-01")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
    expect(lastDays(1, "2026-11-06")).toEqual(["2026-11-06"]);
  });
  it("balanceSeries uses opening before the first row and the running balance after", () => {
    const fund = { opening: 100, rows: [{ e: { date: "2026-11-05" }, bal: 150 }, { e: { date: "2026-11-06" }, bal: 120 }] };
    expect(balanceSeries([fund], ["2026-11-04", "2026-11-05", "2026-11-06"])).toEqual([100, 150, 120]);
  });
  it("balanceSeries adds several funds together", () => {
    const a = { opening: 10, rows: [] };
    const b = { opening: 5, rows: [{ e: { date: "2026-11-06" }, bal: 25 }] };
    expect(balanceSeries([a, b], ["2026-11-05", "2026-11-06"])).toEqual([15, 35]);
  });
  it("shares ignores negatives and sums to 1", () => {
    expect(shares([30, 10, -5])).toEqual([0.75, 0.25, 0]);
    expect(shares([0, -1])).toEqual([]);
    expect(shares([])).toEqual([]);
  });
  it("activitySeries starts at the opening balance and keeps only real changes", () => {
    const f = { opening: 100, rows: [
      { e: { date: "2026-11-01" }, bal: 100 },
      { e: { date: "2026-11-02" }, bal: 150 },
      { e: { date: "2026-11-03" }, bal: 150 },
      { e: { date: "2026-11-04" }, bal: 90 },
      { e: { date: "2026-12-01" }, bal: 500 },
    ] };
    expect(activitySeries([f], "2026-11-06")).toEqual([100, 150, 90]);
    expect(activitySeries([f], "2026-11-06", 2)).toEqual([150, 90]);
    expect(activitySeries([{ opening: 5, rows: [] }], "2026-11-06")).toEqual([5]);
  });
  it("smoothPath: too few points gives nothing, flat points right, rising points up", () => {
    expect(smoothPath([1], 38, 22)).toEqual({ d: "", end: null });
    const flat = smoothPath([5, 5, 5], 38, 22);
    expect(flat.d.startsWith("M3.0 11.0 C")).toBe(true);
    expect(flat.end).toEqual({ x: 35, y: 11, angle: 0 });
    expect(smoothPath([1, 2, 3], 38, 22).end!.angle).toBeLessThan(0);
    expect(smoothPath([3, 2, 1], 38, 22).end!.angle).toBeGreaterThan(0);
  });
});
