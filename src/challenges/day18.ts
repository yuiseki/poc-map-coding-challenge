import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { MAP_ANIM_DURATION_MS } from './constants';

const SCENARIOS: { ring: [number, number][]; label: string; center: [number, number]; zoom: number }[] = [
  { ring: [[0,0],[4,0],[4,2],[0,2]],        label: '4×2 の矩形 → [2, 1]',     center: [2,1],    zoom: 6 },
  { ring: [[0,0],[1,0],[1,1],[0,1]],        label: '1×1 の正方形 → [0.5, 0.5]', center: [0.5,0.5], zoom: 7 },
  { ring: [[0,0],[6,0],[0,4]],              label: '直角三角形 → [2, 4/3]',   center: [2,1.3],  zoom: 6 },
  { ring: [[0,0],[4,0],[4,2],[0,2],[0,0]],  label: '閉じたリング → [2, 1]',   center: [2,1],    zoom: 6 },
  {
    ring: [
      [139.10, 35.50], [139.50, 35.46], [139.92, 35.54],
      [139.92, 35.82], [139.45, 35.90], [139.10, 35.72],
    ],
    label: '東京都（概略）',
    center: [139.51, 35.68], zoom: 8,
  },
];

function polygonCentroid(ring: [number, number][]): [number, number] {
  // Shoelace-based area-weighted centroid (reference impl)
  const n = ring.length;
  const isClose = ring[0][0] === ring[n-1][0] && ring[0][1] === ring[n-1][1];
  const last = isClose ? n - 1 : n;

  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < last; i++) {
    const j = (i + 1) % last;
    const cross = ring[i][0] * ring[j][1] - ring[j][0] * ring[i][1];
    area += cross;
    cx += (ring[i][0] + ring[j][0]) * cross;
    cy += (ring[i][1] + ring[j][1]) * cross;
  }
  area /= 2;
  cx /= 6 * area;
  cy /= 6 * area;
  return [cx, cy];
}

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const idx = Math.min(Math.max(0, revealedCount - 1), SCENARIOS.length - 1);
  const { ring, label, center, zoom } = SCENARIOS[idx];

  map.flyTo({ center, zoom, duration: MAP_ANIM_DURATION_MS });

  const expected = polygonCentroid(ring);

  let result: [number, number] | null = null;
  let ok = false;
  if (userFn) {
    try {
      const r = userFn(ring) as [number, number];
      if (Array.isArray(r) && typeof r[0] === 'number' && typeof r[1] === 'number') {
        result = r;
        ok = Math.abs(r[0] - expected[0]) < 0.001 && Math.abs(r[1] - expected[1]) < 0.001;
      }
    } catch { /* ignore */ }
  }

  const polyColor = result !== null ? (ok ? '#22c55e' : '#ef4444') : '#f59e0b';

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
    paint: { 'fill-color': polyColor, 'fill-opacity': 0.15 },
  });
  map.addLayer({
    id: 'challenge-polygon-line',
    type: 'line',
    source: 'challenge-polygon',
    paint: { 'line-color': polyColor, 'line-width': 2.5 },
  });

  // Expected centroid (dashed cross hair, yellow)
  map.addSource('challenge-expected', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: expected }, properties: { label } },
  });
  map.addLayer({
    id: 'challenge-expected-point',
    type: 'circle',
    source: 'challenge-expected',
    paint: { 'circle-radius': 6, 'circle-color': '#f59e0b', 'circle-stroke-width': 2, 'circle-stroke-color': '#1a1d27' },
  });

  // User's centroid result
  if (result) {
    map.addSource('challenge-result', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: result }, properties: {} },
    });
    map.addLayer({
      id: 'challenge-result-point',
      type: 'circle',
      source: 'challenge-result',
      paint: {
        'circle-radius': 10,
        'circle-color': ok ? '#22c55e' : '#ef4444',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }

  // Label
  const labelText = result !== null
    ? `計算値: [${result[0].toFixed(3)}, ${result[1].toFixed(3)}]`
    : label;
  map.addSource('challenge-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: expected }, properties: { label: labelText } },
  });
  map.addLayer({
    id: 'challenge-label',
    type: 'symbol',
    source: 'challenge-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-offset': [0, 1.6], 'text-anchor': 'top' },
    paint: { 'text-color': result !== null ? polyColor : '#f59e0b', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });
}

export const day18: Challenge = {
  id: '18',
  title: 'Polygon Centroid',
  difficulty: 'Medium',
  description: `
<h2>Day 18: Polygon Centroid</h2>
<p>多角形の頂点配列を受け取り、<strong>重心（centroid）</strong>を <code>[x, y]</code> で返してください。</p>
<h3>重心の公式</h3>
<p>Shoelace 公式を使った面積加重重心です。まず各辺の「交差項」を計算します：</p>
<pre>cross = xᵢ × yᵢ₊₁ − xᵢ₊₁ × yᵢ

A  = ½ Σ cross   （符号付き面積）
Cx = (1 / 6A) × Σ (xᵢ + xᵢ₊₁) × cross
Cy = (1 / 6A) × Σ (yᵢ + yᵢ₊₁) × cross</pre>
<p style="color:#94a3b8;font-size:12px">💡 Day 17 の Shoelace と同じ <code>cross</code> を再利用できます<br>
💡 最後の添字は <code>(i+1) % n</code> で最初に戻る</p>
<h3>例</h3>
<pre>solve([[0,0],[4,0],[4,2],[0,2]])
// 4×2 の矩形 → 中心は [2, 1]
→ [2, 1]</pre>
<h3>制約</h3>
<ul>
  <li>頂点は 3 件以上</li>
  <li>閉じたリング（最初と最後が同じ座標）でも正しく動作すること</li>
  <li>誤差は <strong>±0.001</strong> 以内であること</li>
</ul>`,
  starterCode: `function solve(ring) {
  // ring: [number, number][]  (多角形の頂点配列)
  // 重心を [x, y] で返してください
  return [0, 0];
}`,
  functionName: 'solve',
  typeDeclarations: `
declare function solve(ring: [number, number][]): [number, number];
`,
  tests: [
    {
      name: '4×2 の矩形: centroid = [2, 1]',
      run: (fn) => {
        const r = fn([[0,0],[4,0],[4,2],[0,2]]) as [number, number];
        if (!Array.isArray(r)) throw new Error('[x, y] の配列を返してください');
        if (Math.abs(r[0] - 2) > 0.001 || Math.abs(r[1] - 1) > 0.001)
          throw new Error(`期待値: [2, 1], 実際: [${r[0]}, ${r[1]}]`);
      },
    },
    {
      name: '1×1 の正方形: centroid = [0.5, 0.5]',
      run: (fn) => {
        const r = fn([[0,0],[1,0],[1,1],[0,1]]) as [number, number];
        if (Math.abs(r[0] - 0.5) > 0.001 || Math.abs(r[1] - 0.5) > 0.001)
          throw new Error(`期待値: [0.5, 0.5], 実際: [${r[0]}, ${r[1]}]`);
      },
    },
    {
      name: '直角三角形: centroid = [2, 1.333...]',
      run: (fn) => {
        const r = fn([[0,0],[6,0],[0,4]]) as [number, number];
        if (Math.abs(r[0] - 2) > 0.001 || Math.abs(r[1] - 4/3) > 0.001)
          throw new Error(`期待値: [2, ${(4/3).toFixed(4)}], 実際: [${r[0]}, ${r[1]}]`);
      },
    },
    {
      name: '閉じたリングでも正しく動作する',
      run: (fn) => {
        const r = fn([[0,0],[4,0],[4,2],[0,2],[0,0]]) as [number, number];
        if (Math.abs(r[0] - 2) > 0.001 || Math.abs(r[1] - 1) > 0.001)
          throw new Error(`期待値: [2, 1], 実際: [${r[0]}, ${r[1]}]`);
      },
    },
    {
      name: '非対称な五角形',
      run: (fn) => {
        // Pentagon: [0,0],[4,0],[5,3],[2,5],[−1,3]
        const ring: [number, number][] = [[0,0],[4,0],[5,3],[2,5],[-1,3]];
        const r = fn(ring) as [number, number];
        const expected = polygonCentroid(ring);
        if (Math.abs(r[0] - expected[0]) > 0.001 || Math.abs(r[1] - expected[1]) > 0.001)
          throw new Error(`期待値: [${expected[0].toFixed(4)}, ${expected[1].toFixed(4)}], 実際: [${r[0]}, ${r[1]}]`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [2, 1], zoom: 6 },
};
