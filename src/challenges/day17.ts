import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { MAP_ANIM_DURATION_MS } from './constants';

// Simplified Tokyo Metropolis outline (rough polygon for demo)
const TOKYO_RING: [number, number][] = [
  [139.10, 35.50], [139.50, 35.46], [139.92, 35.54],
  [139.92, 35.82], [139.45, 35.90], [139.10, 35.72],
];

// Scenarios per test reveal (show different polygons)
const SCENARIOS: { ring: [number, number][]; label: string; center: [number, number]; zoom: number }[] = [
  { ring: [[0,0],[4,0],[4,3],[0,3]],     label: '4×3 の矩形 (area=12)',      center: [2,1.5],  zoom: 6 },
  { ring: [[0,0],[1,0],[1,1],[0,1]],     label: '1×1 の正方形 (area=1)',     center: [0.5,0.5],zoom: 7 },
  { ring: [[0,0],[4,0],[0,3]],           label: '直角三角形 (area=6)',        center: [1.5,1],  zoom: 6 },
  { ring: [[0,0],[4,0],[4,3],[0,3],[0,0]], label: '閉じた矩形 (area=12)',      center: [2,1.5],  zoom: 6 },
  { ring: TOKYO_RING,                    label: '東京都（概略）',              center: [139.5, 35.68], zoom: 8 },
];

function shoelaceArea(ring: [number, number][]): number {
  let sum = 0;
  const n = ring.length;
  // If ring is closed (first === last), exclude last point in iteration
  const last = (ring[0][0] === ring[n-1][0] && ring[0][1] === ring[n-1][1]) ? n - 1 : n;
  for (let i = 0; i < last; i++) {
    const j = (i + 1) % last;
    sum += ring[i][0] * ring[j][1];
    sum -= ring[j][0] * ring[i][1];
  }
  return Math.abs(sum) / 2;
}

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const idx = Math.min(Math.max(0, revealedCount - 1), SCENARIOS.length - 1);
  const { ring, label, center, zoom } = SCENARIOS[idx];

  map.flyTo({ center, zoom, duration: MAP_ANIM_DURATION_MS });

  const expected = shoelaceArea(ring);

  let result: number | null = null;
  let ok = false;
  if (userFn) {
    try {
      const r = userFn(ring) as number;
      if (typeof r === 'number' && isFinite(r)) {
        result = r;
        ok = Math.abs(r - expected) < 0.0001;
      }
    } catch { /* ignore */ }
  }

  const color = result !== null ? (ok ? '#22c55e' : '#ef4444') : '#f59e0b';

  // Close the ring for display
  const displayRing = [...ring];
  if (displayRing[0][0] !== displayRing[displayRing.length-1][0] ||
      displayRing[0][1] !== displayRing[displayRing.length-1][1]) {
    displayRing.push(displayRing[0]);
  }

  map.addSource('challenge-polygon', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [displayRing] }, properties: {} },
  });
  map.addLayer({
    id: 'challenge-polygon-fill',
    type: 'fill',
    source: 'challenge-polygon',
    paint: { 'fill-color': color, 'fill-opacity': 0.2 },
  });
  map.addLayer({
    id: 'challenge-polygon-line',
    type: 'line',
    source: 'challenge-polygon',
    paint: { 'line-color': color, 'line-width': 2.5 },
  });

  // Area label at centroid approximation (simple average)
  const n = ring.length;
  const cx = ring.reduce((s, p) => s + p[0], 0) / n;
  const cy = ring.reduce((s, p) => s + p[1], 0) / n;
  const areaText = result !== null
    ? `計算値: ${result.toFixed(4)}  /  期待値: ${expected.toFixed(4)}`
    : `${label}`;

  map.addSource('challenge-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: [cx, cy] }, properties: { label: areaText } },
  });
  map.addLayer({
    id: 'challenge-label',
    type: 'symbol',
    source: 'challenge-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 13, 'text-anchor': 'center' },
    paint: { 'text-color': color, 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });
}

export const day17: Challenge = {
  id: '17',
  title: 'Polygon Area',
  difficulty: 'Medium',
  description: `
<h2>Day 17: Polygon Area</h2>
<p>多角形の頂点配列を受け取り、<strong>面積</strong>を返してください。</p>
<h3>Shoelace 公式（ガウスの面積公式）</h3>
<pre>A = ½ |Σ (xᵢ × yᵢ₊₁ − xᵢ₊₁ × yᵢ)|</pre>
<p>各辺について <code>xᵢ × yᵢ₊₁ − xᵢ₊₁ × yᵢ</code> を計算して合計し、<br>
絶対値の半分が面積です。</p>
<p style="color:#94a3b8;font-size:12px">💡 最後のインデックスの「次」は最初の頂点に戻る（<code>(i+1) % n</code>）<br>
💡 <code>Math.abs()</code> で符号を取り除く</p>
<h3>例</h3>
<pre>solve([[0,0],[4,0],[4,3],[0,3]])
// 4×3 の矩形
→ 12</pre>
<h3>制約</h3>
<ul>
  <li>頂点は 3 件以上</li>
  <li>閉じたリング（最初と最後が同じ座標）でも正しく動作すること</li>
  <li>時計回り・反時計回りどちらも正の面積を返すこと</li>
</ul>`,
  starterCode: `function solve(ring) {
  // ring: [number, number][]  (多角形の頂点配列)
  // Shoelace 公式で面積を返してください
  return 0;
}`,
  functionName: 'solve',
  typeDeclarations: `
declare function solve(ring: [number, number][]): number;
`,
  tests: [
    {
      name: '4×3 の矩形: area = 12',
      run: (fn) => {
        const r = fn([[0,0],[4,0],[4,3],[0,3]]) as number;
        if (typeof r !== 'number') throw new Error('数値を返してください');
        if (Math.abs(r - 12) > 0.0001) throw new Error(`期待値: 12, 実際: ${r}`);
      },
    },
    {
      name: '1×1 の正方形: area = 1',
      run: (fn) => {
        const r = fn([[0,0],[1,0],[1,1],[0,1]]) as number;
        if (Math.abs(r - 1) > 0.0001) throw new Error(`期待値: 1, 実際: ${r}`);
      },
    },
    {
      name: '直角三角形 (底辺4, 高さ3): area = 6',
      run: (fn) => {
        const r = fn([[0,0],[4,0],[0,3]]) as number;
        if (Math.abs(r - 6) > 0.0001) throw new Error(`期待値: 6, 実際: ${r}`);
      },
    },
    {
      name: '閉じたリング（最初と最後が同じ）でも正しく動作する',
      run: (fn) => {
        const r = fn([[0,0],[4,0],[4,3],[0,3],[0,0]]) as number;
        if (Math.abs(r - 12) > 0.0001) throw new Error(`期待値: 12, 実際: ${r}`);
      },
    },
    {
      name: '時計回りでも正の面積を返す',
      run: (fn) => {
        // 逆順（時計回り）の矩形
        const r = fn([[0,0],[0,3],[4,3],[4,0]]) as number;
        if (Math.abs(r - 12) > 0.0001) throw new Error(`期待値: 12, 実際: ${r}`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [2, 1.5], zoom: 6 },
};
