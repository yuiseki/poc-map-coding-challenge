# 02: Bounding Box (バウンディングボックス)

複数の地点を内包する最小の矩形領域（バウンディングボックス）を求めてください。

## 背景

地図アプリで「この都市群が全部見えるズームレベルに自動調整する」機能、  
あるいは空間インデックスの構築など、GIS の基礎として頻繁に使われる操作です。

## タスク

`[longitude, latitude]` の配列を受け取り、  
それら全てを囲む最小バウンディングボックスを返してください。

## 制約

- 入力配列は 1 件以上
- 出力は `{ west, south, east, north }` の形式
- 各値は入力座標の最小・最大値をそのまま使う（バッファ不要）

## 入出力例

```
points = [
  [139.6917, 35.6895],  // 東京
  [135.5023, 34.6937],  // 大阪
  [130.4017, 33.5904],  // 福岡
  [141.3544, 43.0642],  // 札幌
]
→ { west: 130.4017, south: 33.5904, east: 141.3544, north: 43.0642 }
```

## 関数シグネチャ

```typescript
export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export function boundingBox(points: [number, number][]): BBox
```
