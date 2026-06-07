import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';

// Tokyo bounding box polygon
const TOKYO_BBOX: [number, number][] = [
  [139.6, 35.6], [139.8, 35.6], [139.8, 35.8], [139.6, 35.8],
];

// Triangle (mapped to actual geographic coordinates near null island for display)
// Using lat/lon as abstract 2D coordinates — they display near equator/meridian
const TRIANGLE: [number, number][] = [[0, 0], [10, 0], [5, 10]];

// L-shape polygon
const L_SHAPE: [number, number][] = [
  [0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4],
];

const SCENARIOS: {
  point: [number, number];
  polygon: [number, number][];
  expected: boolean;
  label: string;
  center: [number, number];
  zoom: number;
}[] = [
  { point: [139.7, 35.7], polygon: TOKYO_BBOX, expected: true,  label: '東京駅 → bbox 内側',   center: [139.7, 35.7], zoom: 9 },
  { point: [135.5, 34.7], polygon: TOKYO_BBOX, expected: false, label: '大阪 → bbox 外側',     center: [137.5, 35.2], zoom: 6 },
  { point: [5, 3],        polygon: TRIANGLE,   expected: true,  label: '三角形の内側',          center: [5, 4.5],      zoom: 4 },
  { point: [9, 5],        polygon: TRIANGLE,   expected: false, label: '三角形の外側（右）',    center: [5, 4.5],      zoom: 4 },
  { point: [1, 3],        polygon: L_SHAPE,    expected: true,  label: 'L字型の内側',           center: [2, 2],        zoom: 4 },
];

function toGeoJsonRing(poly: [number, number][]): [number, number][] {
  const ring = [...poly];
  // Ensure closed
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0]);
  }
  return ring;
}

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const idx = Math.min(Math.max(0, revealedCount - 1), SCENARIOS.length - 1);
  const { point, polygon, expected, label, center, zoom } = SCENARIOS[idx];

  if (revealedCount !== 0) map.easeTo({ center, zoom, duration: 500 });

  // Compute user's result
  let result: boolean | null = null;
  let ok = false;
  if (userFn) {
    try {
      const r = userFn(point, polygon);
      if (typeof r === 'boolean') {
        result = r;
        ok = r === expected;
      }
    } catch { /* ignore */ }
  }

  const fillColor = result !== null ? (ok ? '#22c55e' : '#ef4444') : '#f59e0b';
  const lineColor = result !== null ? (ok ? '#22c55e' : '#ef4444') : '#f59e0b';
  const pointColor = result !== null ? (ok ? '#22c55e' : '#ef4444') : '#4f8ef7';

  // Polygon
  map.addSource('challenge-polygon', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [toGeoJsonRing(polygon)] },
      properties: {},
    },
  });
  map.addLayer({
    id: 'challenge-polygon-fill',
    type: 'fill',
    source: 'challenge-polygon',
    paint: { 'fill-color': fillColor, 'fill-opacity': 0.15 },
  });
  map.addLayer({
    id: 'challenge-polygon-line',
    type: 'line',
    source: 'challenge-polygon',
    paint: { 'line-color': lineColor, 'line-width': 2.5 },
  });

  // Test point
  const resultText = result !== null
    ? `${result ? 'true ✓' : 'false ✗'}  (期待: ${expected ? 'true' : 'false'})`
    : `期待: ${expected ? 'true' : 'false'}`;

  map.addSource('challenge-point', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: point },
      properties: { label: `${label}\n${resultText}` },
    },
  });
  map.addLayer({
    id: 'challenge-point',
    type: 'circle',
    source: 'challenge-point',
    paint: { 'circle-radius': 10, 'circle-color': pointColor, 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' },
  });
  map.addLayer({
    id: 'challenge-point-label',
    type: 'symbol',
    source: 'challenge-point',
    layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-offset': [0, 1.6], 'text-anchor': 'top' },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });
}

export const day22: Challenge = {
  id: '22',
  title: 'Point in Polygon',
  difficulty: 'Hard',
  description: `
<h2>Day 22: Point in Polygon</h2>
<p>ある点が多角形の<strong>内側にあるかどうか</strong>を判定してください。</p>
<h3>レイキャスティング法</h3>
<p>点から右方向へ水平レイを飛ばし、ポリゴンの辺と交差する回数を数えます。<br>
交差回数が<strong>奇数 → 内側</strong>、<strong>偶数 → 外側</strong>です。</p>
<pre>for 各辺 (頂点 i と 頂点 j のペア):
  レイがこの辺と交差するか？
    → Y 座標が点を挟んでいる かつ
       交差点の X 座標が点より右にある
  交差するたびに inside を反転（true ↔ false）
return inside</pre>
<p style="color:#94a3b8;font-size:12px">💡 辺のループ: <code>i = 0..n-1</code>、<code>j</code> は <code>i</code> の一つ前の頂点（最後の辺は頂点 n-1 と頂点 0 をつなぐ）</p>
<h3>例</h3>
<pre>solve([139.7, 35.7], [[139.6,35.6],[139.8,35.6],[139.8,35.8],[139.6,35.8]])
→ true（東京周辺の矩形の内側）</pre>
<h3>制約</h3>
<ul>
  <li>polygon は頂点の配列（閉じていても閉じていなくても可）</li>
  <li>自己交差しない単純な多角形</li>
  <li>境界上の点はテストに含まれない</li>
</ul>`,
  starterCode: `function solve(point, polygon) {
  // point: [longitude, latitude]
  // polygon: [number, number][]  (頂点の配列)
  // 内側なら true、外側なら false を返してください
  return false;
}`,
  functionName: 'solve',
  typeDeclarations: `
declare function solve(
  point: [number, number],    // [longitude, latitude]
  polygon: [number, number][] // 頂点の配列
): boolean;
`,
  tests: [
    {
      name: '東京駅は東京bbox内側 → true',
      run: (fn) => {
        const r = fn([139.7, 35.7], TOKYO_BBOX);
        if (r !== true) throw new Error(`期待値: true, 実際: ${r}`);
      },
    },
    {
      name: '大阪は東京bbox外側 → false',
      run: (fn) => {
        const r = fn([135.5, 34.7], TOKYO_BBOX);
        if (r !== false) throw new Error(`期待値: false, 実際: ${r}`);
      },
    },
    {
      name: '三角形の内側 → true',
      run: (fn) => {
        const r = fn([5, 3], TRIANGLE);
        if (r !== true) throw new Error(`期待値: true, 実際: ${r}`);
      },
    },
    {
      name: '三角形の外側（右） → false',
      run: (fn) => {
        const r = fn([9, 5], TRIANGLE);
        if (r !== false) throw new Error(`期待値: false, 実際: ${r}`);
      },
    },
    {
      name: 'L字型ポリゴンの内側 → true',
      run: (fn) => {
        const r = fn([1, 3], L_SHAPE);
        if (r !== true) throw new Error(`期待値: true, 実際: ${r}`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [139.7, 35.7], zoom: 9 },
};
