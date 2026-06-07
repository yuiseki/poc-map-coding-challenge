import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, Polygon } from 'geojson';
import { MAP_ANIM_DURATION_MS } from './constants';

// 5 regions, one per test — map flies around the world
const SCENARIOS: {
  label: string;
  west: number; south: number; east: number; north: number;
  camera: [[number, number], [number, number]];
}[] = [
  { label: '日本',        west: 130, south: 31, east: 146, north: 45,  camera: [[128, 29], [148, 47]] },
  { label: '西ヨーロッパ', west: -10, south: 35, east:  40, north: 72,  camera: [[-14, 33], [44, 74]] },
  { label: 'オーストラリア', west: 113, south: -44, east: 154, north: -10, camera: [[110, -47], [157, -7]] },
  { label: '北アメリカ',   west: -130, south: 24, east: -60, north: 50,  camera: [[-135, 21], [-55, 53]] },
  { label: '赤道付近',     west:   0, south:  0, east:   1, north:  1,  camera: [[-1, -1], [2, 2]] },
];

function checkPolygon(
  userFn: ((...args: unknown[]) => unknown),
  w: number, s: number, e: number, n: number
): { poly: Feature<Polygon> | null; ok: boolean } {
  try {
    const r = userFn(w, s, e, n) as Feature<Polygon> | null;
    if (!r) return { poly: null, ok: false };
    const ring = r?.geometry?.coordinates?.[0];
    const str = JSON.stringify(ring ?? []);
    const hasAllCorners =
      (str.includes(`[${w},${s}]`) || str.includes(`[${w}, ${s}]`)) &&
      (str.includes(`[${e},${s}]`) || str.includes(`[${e}, ${s}]`)) &&
      (str.includes(`[${e},${n}]`) || str.includes(`[${e}, ${n}]`)) &&
      (str.includes(`[${w},${n}]`) || str.includes(`[${w}, ${n}]`));
    const ok =
      r.type === 'Feature' &&
      r.geometry?.type === 'Polygon' &&
      ring?.length === 5 &&
      hasAllCorners;
    return { poly: r.geometry?.type === 'Polygon' ? r : null, ok };
  } catch { return { poly: null, ok: false }; }
}

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const ran = isFinite(revealedCount) && revealedCount >= 0;
  const idx = Math.min(Math.max(0, (ran ? revealedCount : 0) - 1), SCENARIOS.length - 1);
  const scene = SCENARIOS[idx];

  map.fitBounds(scene.camera, { padding: 60, duration: MAP_ANIM_DURATION_MS });

  const { west: w, south: s, east: e, north: n } = scene;
  const expectedRing: [number, number][] = [[w,s],[e,s],[e,n],[w,n],[w,s]];

  // Expected outline (dashed yellow)
  map.addSource('challenge-expected', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [expectedRing] }, properties: {} },
  });
  map.addLayer({
    id: 'challenge-expected-fill',
    type: 'fill',
    source: 'challenge-expected',
    paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.08 },
  });
  map.addLayer({
    id: 'challenge-expected-line',
    type: 'line',
    source: 'challenge-expected',
    paint: { 'line-color': '#f59e0b', 'line-width': 1.5, 'line-dasharray': [4, 3] },
  });

  // Label
  map.addSource('challenge-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: [w, n] }, properties: { label: scene.label } },
  });
  map.addLayer({
    id: 'challenge-label',
    type: 'symbol',
    source: 'challenge-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 13, 'text-anchor': 'bottom-left', 'text-offset': [0.3, 0] },
    paint: { 'text-color': '#f59e0b', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  if (!userFn) return;
  const { poly, ok } = checkPolygon(userFn, w, s, e, n);
  if (!poly) return;

  map.addSource('challenge-result', {
    type: 'geojson',
    data: { type: 'Feature', geometry: poly.geometry, properties: {} },
  });
  map.addLayer({
    id: 'challenge-result-fill',
    type: 'fill',
    source: 'challenge-result',
    paint: { 'fill-color': ok ? '#22c55e' : '#ef4444', 'fill-opacity': 0.2 },
  });
  map.addLayer({
    id: 'challenge-result-line',
    type: 'line',
    source: 'challenge-result',
    paint: { 'line-color': ok ? '#22c55e' : '#ef4444', 'line-width': 2.5 },
  });
}

export const day03: Challenge = {
  id: '03',
  title: 'Polygons',
  difficulty: 'Tutorial',
  description: `
<h2>Day 03: Polygons</h2>
<p>バウンディングボックス（bbox）を受け取り、<strong>GeoJSON Polygon Feature</strong>（矩形）を返してください。</p>
<h3>GeoJSON Polygon の構造</h3>
<pre>{
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[ /* 5頂点の閉じたリング */ ]]
  },
  properties: {}
}</pre>
<h3>bbox → Polygon の変換</h3>
<pre>左下 → 右下 → 右上 → 左上 → 左下（最初に戻る）
[west,south] → [east,south] → [east,north]
→ [west,north] → [west,south]</pre>
<h3>例</h3>
<pre>solve(130, 31, 146, 45) // west, south, east, north
→ Polygon with coordinates:
  [[130,31],[146,31],[146,45],[130,45],[130,31]]</pre>
<h3>制約</h3>
<ul>
  <li>外環（outer ring）は <strong>5頂点</strong>（最初と最後が同じ閉じたリング）</li>
  <li>頂点の順序は反時計回りでも時計回りでも可</li>
</ul>`,
  starterCode: `function solve(west, south, east, north) {
  // bboxからGeoJSON Polygon Featureを返してください
  return null;
}`,
  functionName: 'solve',
  typeDeclarations: `
declare function solve(
  west: number,
  south: number,
  east: number,
  north: number
): { type: "Feature"; geometry: { type: "Polygon"; coordinates: [number, number][][] }; properties: Record<string, unknown> } | null;
`,
  tests: [
    {
      name: 'type が "Feature"',
      run: (fn) => {
        const r = fn(130, 31, 146, 45) as Feature<Polygon>;
        if (r?.type !== 'Feature') throw new Error('type が "Feature" ではありません');
      },
    },
    {
      name: 'geometry.type が "Polygon"',
      run: (fn) => {
        const r = fn(130, 31, 146, 45) as Feature<Polygon>;
        if (r?.geometry?.type !== 'Polygon') throw new Error('geometry.type が "Polygon" ではありません');
      },
    },
    {
      name: '外環が 5 頂点の閉じたリング',
      run: (fn) => {
        const r = fn(130, 31, 146, 45) as Feature<Polygon>;
        const ring = r?.geometry?.coordinates?.[0];
        if (!ring || ring.length !== 5) throw new Error(`外環の頂点数が ${ring?.length} です（期待値: 5）`);
        if (JSON.stringify(ring[0]) !== JSON.stringify(ring[4]))
          throw new Error('最初と最後の頂点が一致していません（閉じたリングではありません）');
      },
    },
    {
      name: '4コーナーがすべて含まれている',
      run: (fn) => {
        const r = fn(130, 31, 146, 45) as Feature<Polygon>;
        const ring = r.geometry.coordinates[0];
        const str = JSON.stringify(ring);
        if (!str.includes('[130,31]') && !str.includes('[130, 31]')) throw new Error('左下 [130,31] がありません');
        if (!str.includes('[146,31]') && !str.includes('[146, 31]')) throw new Error('右下 [146,31] がありません');
        if (!str.includes('[146,45]') && !str.includes('[146, 45]')) throw new Error('右上 [146,45] がありません');
        if (!str.includes('[130,45]') && !str.includes('[130, 45]')) throw new Error('左上 [130,45] がありません');
      },
    },
    {
      name: '小さいbboxでも動作する',
      run: (fn) => {
        const r = fn(0, 0, 1, 1) as Feature<Polygon>;
        if (r?.geometry?.type !== 'Polygon') throw new Error('Polygon ではありません');
        if (r.geometry.coordinates[0].length !== 5) throw new Error('5頂点ではありません');
      },
    },
  ],
  setupMap,
  mapOptions: { center: [138, 38], zoom: 4 },
};
