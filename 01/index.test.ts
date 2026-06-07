import { test } from "node:test";
import assert from "node:assert/strict";
import { greatCircleDistance } from "./index.ts";

const TOLERANCE = 1; // ±1 km

function approxEqual(actual: number, expected: number, tolerance = TOLERANCE) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${expected} ±${tolerance} km, got ${actual}`
  );
}

test("同じ地点の距離は 0", () => {
  assert.strictEqual(greatCircleDistance([0, 0], [0, 0]), 0);
  assert.strictEqual(greatCircleDistance([139.6917, 35.6895], [139.6917, 35.6895]), 0);
});

test("東京 → パリ: 約 9715 km", () => {
  const tokyo: [number, number] = [139.6917, 35.6895];
  const paris: [number, number] = [2.3522, 48.8566];
  approxEqual(greatCircleDistance(tokyo, paris), 9715);
});

test("東京 → ニューヨーク: 約 10838 km", () => {
  const tokyo: [number, number] = [139.6917, 35.6895];
  const newYork: [number, number] = [-74.006, 40.7128];
  approxEqual(greatCircleDistance(tokyo, newYork), 10838);
});

test("東京 → シドニー: 約 7823 km", () => {
  const tokyo: [number, number] = [139.6917, 35.6895];
  const sydney: [number, number] = [151.2093, -33.8688];
  approxEqual(greatCircleDistance(tokyo, sydney), 7823);
});

test("赤道上の経度 90° 差: 約 10018 km", () => {
  approxEqual(greatCircleDistance([0, 0], [90, 0]), 10018);
});

test("北極 → 南極: 約 20015 km", () => {
  approxEqual(greatCircleDistance([0, 90], [0, -90]), 20015);
});

test("ロンドン → ケープタウン: 約 9671 km", () => {
  const london: [number, number] = [-0.1276, 51.5074];
  const capeTown: [number, number] = [18.4241, -33.9249];
  approxEqual(greatCircleDistance(london, capeTown), 9671);
});

test("距離は対称（from ↔ to で同じ）", () => {
  const a: [number, number] = [139.6917, 35.6895];
  const b: [number, number] = [2.3522, 48.8566];
  const d1 = greatCircleDistance(a, b);
  const d2 = greatCircleDistance(b, a);
  approxEqual(d1, d2, 0.001);
});
