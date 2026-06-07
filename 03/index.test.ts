import { test } from "node:test";
import assert from "node:assert/strict";
import { pointInPolygon } from "./index.ts";

// 東京周辺の矩形ポリゴン
const tokyoBbox: [number, number][] = [
  [139.6, 35.6],
  [139.8, 35.6],
  [139.8, 35.8],
  [139.6, 35.8],
];

test("東京駅はポリゴン内側", () => {
  assert.strictEqual(pointInPolygon([139.7, 35.7], tokyoBbox), true);
});

test("大阪はポリゴン外側", () => {
  assert.strictEqual(pointInPolygon([135.5, 34.7], tokyoBbox), false);
});

test("ポリゴン右外側の点", () => {
  assert.strictEqual(pointInPolygon([140.0, 35.7], tokyoBbox), false);
});

test("ポリゴン左外側の点", () => {
  assert.strictEqual(pointInPolygon([139.4, 35.7], tokyoBbox), false);
});

test("ポリゴン上外側の点", () => {
  assert.strictEqual(pointInPolygon([139.7, 36.0], tokyoBbox), false);
});

test("ポリゴン下外側の点", () => {
  assert.strictEqual(pointInPolygon([139.7, 35.4], tokyoBbox), false);
});

// 三角形ポリゴン
const triangle: [number, number][] = [
  [0, 0],
  [10, 0],
  [5, 10],
];

test("三角形の内側", () => {
  assert.strictEqual(pointInPolygon([5, 3], triangle), true);
});

test("三角形の外側（右）", () => {
  assert.strictEqual(pointInPolygon([9, 5], triangle), false);
});

test("三角形の外側（左）", () => {
  assert.strictEqual(pointInPolygon([1, 5], triangle), false);
});

test("凸でない多角形（L字型）の内側", () => {
  const lShape: [number, number][] = [
    [0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4],
  ];
  assert.strictEqual(pointInPolygon([1, 1], lShape), true);
  assert.strictEqual(pointInPolygon([1, 3], lShape), true);
  assert.strictEqual(pointInPolygon([3, 3], lShape), false); // 欠けた部分
});

test("閉じたリング（最初と最後が同じ）でも動作する", () => {
  const closed: [number, number][] = [
    [0, 0], [10, 0], [10, 10], [0, 10], [0, 0],
  ];
  assert.strictEqual(pointInPolygon([5, 5], closed), true);
  assert.strictEqual(pointInPolygon([15, 5], closed), false);
});
