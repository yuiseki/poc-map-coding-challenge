import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';

// Demo route for map visualization (東海道・山陽ルート)
const DEMO_ROUTE: { name: string; coord: [number, number] }[] = [
  { name: '東京',  coord: [139.6917, 35.6895] },
  { name: '名古屋', coord: [136.9066, 35.1802] },
  { name: '大阪',  coord: [135.5023, 34.6937] },
  { name: '広島',  coord: [132.4596, 34.3853] },
  { name: '博多',  coord: [130.4183, 33.5902] },
];

// Test data: simple integer coordinates so expected values are obvious
// Each scenario matches one test
const SCENARIOS: { coords: [number, number][]; label: string }[] = [
  { coords: [[0, 0], [3, 0]],                    label: '2点の直線 (length=3)' },
  { coords: [[0, 0], [3, 0], [3, 4]],            label: '折れ線 (3+4=7)' },
  { coords: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], label: '閉じた正方形 (4辺=4)' },
  { coords: [[5, 5]],                             label: '1点 (length=0)' },
  { coords: DEMO_ROUTE.map((p) => p.coord),       label: '東京→博多 (5点)' },
];

function euclidean(a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function expectedLength(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += euclidean(coords[i - 1], coords[i]);
  return total;
}

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const idx = Math.min(Math.max(0, revealedCount - 1), SCENARIOS.length - 1);

  // Always show the geographic Japan route on the map
  if (revealedCount !== 0) map.fitBounds(
    [[129.5, 33.0], [140.5, 36.5]],
    { padding: { top: 60, bottom: 60, left: 60, right: 280 }, speed: 0.8 }
  );

  const coords = DEMO_ROUTE.map((p) => p.coord);
  const expected = expectedLength(coords);

  let result: number | null = null;
  let ok = false;
  if (userFn) {
    try {
      const r = userFn(coords) as number;
      if (typeof r === 'number' && isFinite(r)) {
        result = r;
        ok = Math.abs(r - expected) < 0.001;
      }
    } catch { /* ignore */ }
  }

  const lineColor = result !== null ? (ok ? '#22c55e' : '#ef4444') : '#4f8ef7';

  // Route line
  map.addSource('challenge-line', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
  });
  map.addLayer({
    id: 'challenge-line',
    type: 'line',
    source: 'challenge-line',
    paint: { 'line-color': lineColor, 'line-width': 3 },
  });

  // Station points
  map.addSource('challenge-points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: DEMO_ROUTE.map(({ name, coord }) => ({
        type: 'Feature',
        properties: { name },
        geometry: { type: 'Point', coordinates: coord },
      })),
    },
  });
  map.addLayer({
    id: 'challenge-points',
    type: 'circle',
    source: 'challenge-points',
    paint: { 'circle-radius': 7, 'circle-color': lineColor, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
  });
  map.addLayer({
    id: 'challenge-point-labels',
    type: 'symbol',
    source: 'challenge-points',
    layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.4], 'text-anchor': 'top' },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  // Distance label
  const scenario = SCENARIOS[idx];
  const distText = result !== null
    ? `計算値: ${result.toFixed(4)}  /  テスト: ${scenario.label}`
    : `テスト: ${scenario.label}`;
  map.addSource('challenge-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: [130.4, 36.2] }, properties: { label: distText } },
  });
  map.addLayer({
    id: 'challenge-label',
    type: 'symbol',
    source: 'challenge-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-anchor': 'top-left' },
    paint: { 'text-color': result !== null ? lineColor : '#f59e0b', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });
}

export const day10: Challenge = {
  id: '10',
  title: 'Line Length',
  difficulty: 'Medium',
  description: `
<h2>Day 10: Line Length</h2>
<p>座標の配列（ポリライン）を受け取り、<strong>全セグメントの合計長</strong>を返してください。</p>
<h3>距離の計算</h3>
<p>各セグメント（隣り合う2点間）のユークリッド距離を合計します。</p>
<pre>d = √( (x2−x1)² + (y2−y1)² )</pre>
<p style="color:#94a3b8;font-size:12px">💡 JS のべき乗: <code>dx ** 2</code> または <code>dx * dx</code>　/ 平方根: <code>Math.sqrt()</code></p>
<h3>例</h3>
<pre>solve([[0,0], [3,0], [3,4]])
// 最初のセグメント: √(3²+0²) = 3
// 次のセグメント:   √(0²+4²) = 4
→ 7</pre>
<h3>制約</h3>
<ul>
  <li>入力は 1 件以上の座標配列</li>
  <li>1点のみの場合は <code>0</code> を返す</li>
  <li>隣り合う2点が同じ座標でも正しく動作すること</li>
</ul>`,
  starterCode: `function solve(coordinates) {
  // coordinates: [number, number][]
  // 全セグメントの合計長を返してください
  return 0;
}`,
  functionName: 'solve',
  typeDeclarations: `
declare function solve(coordinates: [number, number][]): number;
`,
  tests: [
    {
      name: '2点の直線: length = 3',
      run: (fn) => {
        const r = fn([[0, 0], [3, 0]]) as number;
        if (typeof r !== 'number') throw new Error('数値を返してください');
        if (Math.abs(r - 3) > 0.001) throw new Error(`期待値: 3, 実際: ${r}`);
      },
    },
    {
      name: '折れ線（L字）: 3 + 4 = 7',
      run: (fn) => {
        const r = fn([[0, 0], [3, 0], [3, 4]]) as number;
        if (Math.abs(r - 7) > 0.001) throw new Error(`期待値: 7, 実際: ${r}`);
      },
    },
    {
      name: '閉じた正方形: 辺 × 4 = 4',
      run: (fn) => {
        const r = fn([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]) as number;
        if (Math.abs(r - 4) > 0.001) throw new Error(`期待値: 4, 実際: ${r}`);
      },
    },
    {
      name: '1点のみ: length = 0',
      run: (fn) => {
        const r = fn([[5, 5]]) as number;
        if (Math.abs(r - 0) > 0.001) throw new Error(`期待値: 0, 実際: ${r}`);
      },
    },
    {
      name: '斜め線: √2 × 3 ≈ 4.243',
      run: (fn) => {
        const r = fn([[0, 0], [1, 1], [2, 0], [3, 1]]) as number;
        const expected = 3 * Math.sqrt(2);
        if (Math.abs(r - expected) > 0.001) throw new Error(`期待値: ${expected.toFixed(4)}, 実際: ${r}`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [135, 34.8], zoom: 5 },
};
