import { test } from "node:test";
import assert from "node:assert/strict";
import { boundingBox } from "./index.ts";

test("日本主要都市のバウンディングボックス", () => {
  const points: [number, number][] = [
    [139.6917, 35.6895], // 東京
    [135.5023, 34.6937], // 大阪
    [130.4017, 33.5904], // 福岡
    [141.3544, 43.0642], // 札幌
  ];
  const bbox = boundingBox(points);
  assert.strictEqual(bbox.west, 130.4017);
  assert.strictEqual(bbox.south, 33.5904);
  assert.strictEqual(bbox.east, 141.3544);
  assert.strictEqual(bbox.north, 43.0642);
});

test("1点のバウンディングボックスは全辺が同じ値", () => {
  const bbox = boundingBox([[139.6917, 35.6895]]);
  assert.strictEqual(bbox.west, 139.6917);
  assert.strictEqual(bbox.south, 35.6895);
  assert.strictEqual(bbox.east, 139.6917);
  assert.strictEqual(bbox.north, 35.6895);
});

test("2点のバウンディングボックス", () => {
  const bbox = boundingBox([[0, 0], [10, 20]]);
  assert.strictEqual(bbox.west, 0);
  assert.strictEqual(bbox.south, 0);
  assert.strictEqual(bbox.east, 10);
  assert.strictEqual(bbox.north, 20);
});

test("南半球の点を含む場合（負の緯度）", () => {
  const points: [number, number][] = [
    [151.2093, -33.8688], // シドニー
    [144.9631, -37.8136], // メルボルン
    [115.8605, -31.9505], // パース
  ];
  const bbox = boundingBox(points);
  assert.strictEqual(bbox.west, 115.8605);
  assert.strictEqual(bbox.south, -37.8136);
  assert.strictEqual(bbox.east, 151.2093);
  assert.strictEqual(bbox.north, -31.9505);
});

test("西半球の点（負の経度）", () => {
  const points: [number, number][] = [
    [-74.006, 40.7128],  // ニューヨーク
    [-87.6298, 41.8781], // シカゴ
    [-118.2437, 34.0522], // ロサンゼルス
  ];
  const bbox = boundingBox(points);
  assert.strictEqual(bbox.west, -118.2437);
  assert.strictEqual(bbox.east, -74.006);
  assert.strictEqual(bbox.north, 41.8781);
  assert.strictEqual(bbox.south, 34.0522);
});

test("赤道・本初子午線をまたぐ点群", () => {
  const bbox = boundingBox([[-10, -5], [10, 5]]);
  assert.strictEqual(bbox.west, -10);
  assert.strictEqual(bbox.south, -5);
  assert.strictEqual(bbox.east, 10);
  assert.strictEqual(bbox.north, 5);
});
