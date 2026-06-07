import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, Point } from 'geojson';

type ShopFeature = Feature<Point, { name: string; category: string }>;

const SHOPS: ShopFeature[] = [
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.70, 35.69] }, properties: { name: '新宿のカフェ',   category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.72, 35.68] }, properties: { name: '渋谷のカフェ',   category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.74, 35.67] }, properties: { name: '品川のカフェ',   category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.71, 35.70] }, properties: { name: '代々木のレストラン', category: 'restaurant' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.73, 35.69] }, properties: { name: '原宿のレストラン', category: 'restaurant' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.75, 35.71] }, properties: { name: '表参道のカフェ', category: 'cafe' } },
];

// 新宿〜渋谷エリアのbbox
const BBOX: [number, number, number, number] = [139.68, 35.67, 139.73, 35.71];

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null) {
  let matched: Set<string> = new Set();
  if (userFn) {
    try {
      const result = userFn(SHOPS, 'category', 'cafe', BBOX) as ShopFeature[];
      if (Array.isArray(result)) {
        matched = new Set(result.map((f) => f.properties?.name));
      }
    } catch { /* ignore */ }
  }

  // bbox rectangle
  const ring: [number, number][] = [
    [BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]], [BBOX[0], BBOX[1]],
  ];
  map.addSource('challenge-bbox', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} },
  });
  map.addLayer({ id: 'challenge-bbox-fill', type: 'fill', source: 'challenge-bbox', paint: { 'fill-color': '#4f8ef7', 'fill-opacity': 0.08 } });
  map.addLayer({ id: 'challenge-bbox-line', type: 'line', source: 'challenge-bbox', paint: { 'line-color': '#4f8ef7', 'line-width': 1.5, 'line-dasharray': [4, 2] } });

  // Shops
  map.addSource('challenge-shops', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: SHOPS.map((s) => {
        const isMatched = matched.size > 0 && matched.has(s.properties.name);
        const isPending = matched.size === 0;
        return {
          ...s,
          properties: {
            ...s.properties,
            color: isPending ? '#94a3b8' : isMatched ? '#22c55e' : '#ef4444',
            radius: isMatched ? 9 : 6,
          },
        };
      }),
    },
  });
  map.addLayer({
    id: 'challenge-shops',
    type: 'circle',
    source: 'challenge-shops',
    paint: { 'circle-radius': ['get', 'radius'], 'circle-color': ['get', 'color'], 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
  });
  map.addLayer({
    id: 'challenge-shop-labels',
    type: 'symbol',
    source: 'challenge-shops',
    layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-offset': [0, 1.4], 'text-anchor': 'top' },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
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
  <li>Feature の geometry は必ず <code>Point</code>（緯度経度1点）</li>
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
