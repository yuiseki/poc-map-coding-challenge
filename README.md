# 🗺️ Map Coding Challenge

GIS アルゴリズムをブラウザで解くコーディングチャレンジアプリです。  
LeetCode ライクな UI でコードを書くと、**地図がリアルタイムにアニメーション**して結果を教えてくれます。

**▶ Play: https://yuiseki.github.io/poc-map-coding-challenge/**

## どんな感じ？

- **Tutorial → Easy → Medium → Hard** の難易度でチャレンジが増えていきます
- コードを書いて Run すると、テストが1件ずつアニメーションしながら実行されます
- テストの進行に合わせて地図が動きます — 都市を飛び回ったり、世界を横断したり
- 全テスト Pass すると地図が緑になってとても嬉しい気持ちになります
- 解いたチャレンジは LocalStorage に保存され、リロード後も ✅ が残ります

## 技術スタック

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [MapLibre GL JS](https://maplibre.org/) — ベクタータイル地図
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — VSCode と同じエディタ、ライブ型チェック付き

## ローカルで動かす

```bash
npm install
npm start   # → http://localhost:5173
```
