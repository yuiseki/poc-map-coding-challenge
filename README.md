# 🗺️ Map Coding Challenge

LeetCode ライクな UI で GIS アルゴリズムを学ぶコーディングチャレンジアプリです。  
コードを書くと地図がリアルタイムに反応し、テスト結果がアニメーションで表示されます。

## デモ

![Map Coding Challenge](https://github.com/yuiseki/poc-map-coding-challenge/raw/main/docs/screenshot.png)

## チャレンジ一覧

| # | タイトル | 難易度 | テーマ |
|---|----------|--------|--------|
| 01 | Points | Easy | GeoJSON Point Feature を作る |
| 02 | Lines | Easy | GeoJSON LineString Feature を作る |
| 03 | Polygons | Easy | bbox から GeoJSON Polygon Feature を作る |
| 04 | Nearest | Medium | 現在地から最寄り施設を探す（ユークリッド距離） |
| 05 | Filter | Medium | 属性条件 + bbox でフィーチャーをフィルタする |
| 06 | Bounding Box | Medium | 座標群を囲む最小矩形領域を求める |
| 07 | Great Circle Distance | Hard | Haversine 公式で大圏距離を計算する |
| 08 | Point in Polygon | Hard | レイキャスティング法で内外判定する |

## 機能

- **Monaco Editor** — VSCode と同じエディタ。JavaScript で解答を記述
- **ライブ型チェック** — 各チャレンジの型宣言を自動注入し、型エラーを即座に検出
- **テストアニメーション** — テストが1件ずつ順番に実行・表示される
- **地図連動** — テスト進行に合わせて MapLibre GL JS の地図がアニメーション
- **コード保存** — LocalStorage にコードを自動保存
- **console.log** — テスト実行中の `console.log` 出力をオーバーレイに表示

## 技術スタック

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [MapLibre GL JS](https://maplibre.org/) — ベクタータイル地図
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — コードエディタ
- 地図スタイル: [osm-fiord](https://z.yuiseki.net/static/maps/styles/osm-fiord.json)

## ローカルで動かす

```bash
npm install
npm start
# → http://localhost:5173
```
