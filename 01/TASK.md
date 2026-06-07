# 01: Great Circle Distance (大圏距離)

地球上の2点間の最短距離（大圏距離）を計算してください。

## 背景

飛行機の航路や船の航路は、地球が球体であるため「大圏（グレートサークル）」と呼ばれる  
球面上の最短経路を辿ります。この距離を **Haversine 公式** で求めます。

## タスク

経度・緯度で表された2点 `from` と `to` を受け取り、  
その間の距離を **キロメートル単位** で返してください。

## 制約

- 座標は `[longitude, latitude]` の形式（GeoJSON 準拠）
- `-180 ≤ longitude ≤ 180`、`-90 ≤ latitude ≤ 90`
- 地球の半径は `6371 km` を使用すること
- 誤差は **±1 km** 以内であること

## 入出力例

```
from = [139.6917, 35.6895]  // 東京
to   = [2.3522,  48.8566]  // パリ
→ 約 9715 km
```

```
from = [0, 0]
to   = [0, 0]
→ 0
```

## Haversine 公式（ヒント）

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

## 関数シグネチャ

```typescript
export function greatCircleDistance(
  from: [number, number],
  to: [number, number]
): number
```
