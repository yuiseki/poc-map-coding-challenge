import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, Point } from 'geojson';

type ShopFeature = Feature<Point, { name: string; category: string }>;

const SHOPS: ShopFeature[] = [
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.70, 35.69] }, properties: { name: '新宿のカフェ',      category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.72, 35.68] }, properties: { name: '渋谷のカフェ',      category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.74, 35.67] }, properties: { name: '品川のカフェ',      category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.71, 35.70] }, properties: { name: '代々木のレストラン', category: 'restaurant' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.73, 35.69] }, properties: { name: '原宿のレストラン',   category: 'restaurant' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.75, 35.71] }, properties: { name: '表参道のカフェ',    category: 'cafe' } },
];

const BBOX: [number, number, number, number] = [139.68, 35.67, 139.73, 35.71];

// Per-test filter scenarios for map animation
const SCENARIOS: { category: string; label: string }[] = [
  { category: 'cafe',       label: 'cafe を bbox 内でフィルタ' },
  { category: 'cafe',       label: 'bbox 外の cafe は除外' },
  { category: 'cafe',       label: 'restaurant は除外' },
  { category: 'restaurant', label: 'restaurant を bbox 内でフィルタ' },
  { category: 'hotel',      label: 'hotel → 空配列' },
];

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const scenarioIdx = Math.max(0, revealedCount - 1);
  const scenario = SCENARIOS[Math.min(scenarioIdx, SCENARIOS.length - 1)];
  const { category } = scenario;

  // Run user's filter for this scenario's category
  let matched: Set<string> = new Set();
  if (userFn) {
    try {
      const result = userFn(SHOPS, 'category', category, BBOX) as ShopFeature[];
      if (Array.isArray(result)) matched = new Set(result.map((f) => f.properties?.name));
    } catch { /* ignore */ }
  }

  // Fly to area
  map.flyTo({ center: [139.715, 35.69], zoom: 12.5, speed: 1.0 });

  // bbox rectangle
  const ring: [number, number][] = [
    [BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]], [BBOX[0], BBOX[1]],
  ];
  map.addSource('challenge-bbox', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} },
  });
  map.addLayer({ id: 'challenge-bbox-fill', type: 'fill', source: 'challenge-bbox',
    paint: { 'fill-color': '#4f8ef7', 'fill-opacity': 0.08 } });
  map.addLayer({ id: 'challenge-bbox-line', type: 'line', source: 'challenge-bbox',
    paint: { 'line-color': '#4f8ef7', 'line-width': 2, 'line-dasharray': [4, 2] } });

  // Shops
  map.addSource('challenge-shops', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: SHOPS.map((s) => {
        const lon = (s.geometry as Point).coordinates[0];
        const lat = (s.geometry as Point).coordinates[1];
        const inBbox = lon >= BBOX[0] && lon <= BBOX[2] && lat >= BBOX[1] && lat <= BBOX[3];
        const matchesCat = s.properties.category === category;

        let color = '#94a3b8';  // default gray
        let radius = 7;

        if (userFn) {
          if (matched.has(s.properties.name)) {
            color = '#22c55e'; radius = 10; // matched ✅
          } else if (matchesCat && inBbox) {
            color = '#ef4444'; // should match but didn't
          } else {
            color = '#3a3a5a'; // correctly excluded
          }
        } else if (matchesCat && inBbox) {
          color = '#f59e0b'; // expected to match
        }

        return {
          ...s,
          properties: { ...s.properties, color, radius },
        };
      }),
    },
  });
  map.addLayer({
    id: 'challenge-shops',
    type: 'circle',
    source: 'challenge-shops',
    paint: { 'circle-radius': ['get', 'radius'], 'circle-color': ['get', 'color'],
             'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
  });
  map.addLayer({
    id: 'challenge-shop-labels',
    type: 'symbol',
    source: 'challenge-shops',
    layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-offset': [0, 1.4], 'text-anchor': 'top' },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  // Category label overlay
  map.addSource('challenge-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: [BBOX[0] + 0.001, BBOX[3] - 0.003] }, properties: { label: `category: "${category}"` } },
  });
  map.addLayer({
    id: 'challenge-category-label',
    type: 'symbol',
    source: 'challenge-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 13, 'text-anchor': 'bottom-left' },
    paint: { 'text-color': '#f59e0b', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });
}

export const day05: Challenge = {
  id: '05',
  title: 'Filter',
  difficulty: 'Medium',
  description: `
<h2>Day 05: Filter</h2>
<p>GeoJSON Feature の配列を受け取り、<strong>属性条件</strong>と<strong>bbox 条件</strong>の両方を満たすものだけを返してください。</p>
<h3>条件</h3>
<ol>
  <li><code>feature.properties[property] === value</code></li>
  <li>Feature の座標が bbox の内側にある<br>
    <code>west ≤ lon ≤ east</code> かつ <code>south ≤ lat ≤ north</code></li>
</ol>
<h3>例</h3>
<pre>solve(features, "category", "cafe", [139.68, 35.67, 139.73, 35.71])
// bbox: [west, south, east, north]
→ category が "cafe" で、かつ bbox 内にある Feature だけの配列</pre>
<h3>制約</h3>
<ul>
  <li>Feature の geometry は必ず <code>Point</code></li>
  <li>bbox は <code>[west, south, east, north]</code> の順</li>
  <li>マッチしない場合は空配列 <code>[]</code> を返す</li>
</ul>`,
  starterCode: `function solve(features, property, value, bbox) {
  // features: GeoJSON Point Feature[]
  // property: string  (フィルタするプロパティ名)
  // value: string     (一致すべき値)
  // bbox: [west, south, east, north]
  // 条件を満たす Feature だけを返してください
  return [];
}`,
  functionName: 'solve',
  typeDeclarations: `
interface PointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: { [key: string]: string };
}
declare function solve(
  features: PointFeature[],
  property: string,
  value: string,
  bbox: [number, number, number, number] // [west, south, east, north]
): PointFeature[];
`,
  tests: [
    {
      name: 'category="cafe" かつ bbox 内のものを返す',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'cafe', BBOX) as ShopFeature[];
        if (!Array.isArray(result)) throw new Error('配列を返してください');
        const names = result.map((f) => f.properties.name).sort();
        const expected = ['新宿のカフェ', '渋谷のカフェ'].sort();
        if (JSON.stringify(names) !== JSON.stringify(expected))
          throw new Error(`期待値: ${JSON.stringify(expected)}, 実際: ${JSON.stringify(names)}`);
      },
    },
    {
      name: 'bbox 外の cafe は含まない',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'cafe', BBOX) as ShopFeature[];
        const names = result.map((f) => f.properties.name);
        if (names.includes('品川のカフェ')) throw new Error('"品川のカフェ" は bbox 外なので含まれてはいけません');
        if (names.includes('表参道のカフェ')) throw new Error('"表参道のカフェ" は bbox 外なので含まれてはいけません');
      },
    },
    {
      name: 'category が一致しないものは除外',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'cafe', BBOX) as ShopFeature[];
        const cats = result.map((f) => f.properties.category);
        if (cats.some((c) => c !== 'cafe')) throw new Error('restaurant が含まれています');
      },
    },
    {
      name: 'restaurant でフィルタする場合',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'restaurant', BBOX) as ShopFeature[];
        if (!Array.isArray(result)) throw new Error('配列を返してください');
        const names = result.map((f) => f.properties.name);
        if (!names.includes('代々木のレストラン')) throw new Error('"代々木のレストラン" が含まれていません');
        if (!names.includes('原宿のレストラン')) throw new Error('"原宿のレストラン" が含まれていません');
      },
    },
    {
      name: 'マッチなしの場合は空配列',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'hotel', BBOX) as unknown[];
        if (!Array.isArray(result) || result.length !== 0)
          throw new Error(`空配列を期待しましたが length=${result?.length}`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [139.715, 35.69], zoom: 12 },
};
