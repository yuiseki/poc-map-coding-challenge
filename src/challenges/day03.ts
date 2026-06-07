import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, Polygon } from 'geojson';

const BBOX = { west: 130, south: 31, east: 146, north: 45 }; // 日本全体の大まかなbbox

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, _revealedCount: number) {
  // Expected bbox outline (dashed)
  const expectedRing: [number, number][] = [
    [BBOX.west, BBOX.south], [BBOX.east, BBOX.south],
    [BBOX.east, BBOX.north], [BBOX.west, BBOX.north], [BBOX.west, BBOX.south],
  ];
  map.addSource('challenge-expected', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [expectedRing] }, properties: {} },
  });
  map.addLayer({
    id: 'challenge-expected-fill',
    type: 'fill',
    source: 'challenge-expected',
    paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.1 },
  });
  map.addLayer({
    id: 'challenge-expected-line',
    type: 'line',
    source: 'challenge-expected',
    paint: { 'line-color': '#f59e0b', 'line-width': 1.5, 'line-dasharray': [4, 3] },
  });

  if (userFn) {
    try {
      const r = userFn(BBOX.west, BBOX.south, BBOX.east, BBOX.north) as Feature<Polygon> | null;
      if (r?.geometry?.type === 'Polygon') {
        map.addSource('challenge-result', {
          type: 'geojson',
          data: { type: 'Feature', geometry: r.geometry, properties: {} },
        });
        map.addLayer({
          id: 'challenge-result-fill',
          type: 'fill',
          source: 'challenge-result',
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.2 },
        });
        map.addLayer({
          id: 'challenge-result-line',
          type: 'line',
          source: 'challenge-result',
          paint: { 'line-color': '#22c55e', 'line-width': 2.5 },
        });
      }
    } catch { /* ignore */ }
  }
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
