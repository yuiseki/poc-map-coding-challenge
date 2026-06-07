import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, Point } from 'geojson';

type ShopFeature = Feature<Point, { name: string; category: string }>;

const SHOPS: ShopFeature[] = [
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.70, 35.69] }, properties: { name: '新宿のカフェ',       category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.72, 35.68] }, properties: { name: '渋谷のカフェ',       category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.74, 35.67] }, properties: { name: '品川のカフェ',       category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.75, 35.71] }, properties: { name: '表参道のカフェ',     category: 'cafe' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.71, 35.70] }, properties: { name: '代々木のレストラン', category: 'restaurant' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [139.73, 35.69] }, properties: { name: '原宿のレストラン',   category: 'restaurant' } },
];

const SCENARIOS: { category: string }[] = [
  { category: 'cafe' },
  { category: 'restaurant' },
  { category: 'hotel' },
  { category: 'cafe' },
  { category: 'restaurant' },
];

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const idx = Math.min(Math.max(0, revealedCount - 1), SCENARIOS.length - 1);
  const { category } = SCENARIOS[idx];

  let matched: Set<string> = new Set();
  if (userFn) {
    try {
      const result = userFn(SHOPS, 'category', category) as ShopFeature[];
      if (Array.isArray(result)) matched = new Set(result.map((f) => f.properties?.name));
    } catch { /* ignore */ }
  }

  if (revealedCount !== 0) map.easeTo({ center: [139.725, 35.69], zoom: 12, duration: 500 });

  map.addSource('challenge-shops', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: SHOPS.map((s) => {
        const matchesCat = s.properties.category === category;
        let color = '#94a3b8';
        let radius = 7;
        if (userFn) {
          if (matched.has(s.properties.name)) {
            color = '#22c55e'; radius = 10;
          } else if (matchesCat) {
            color = '#ef4444';
          } else {
            color = '#3a3a5a';
          }
        } else if (matchesCat) {
          color = '#f59e0b';
        }
        return { ...s, properties: { ...s.properties, color, radius } };
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

  map.addSource('challenge-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: [139.695, 35.715] }, properties: { label: `category: "${category}"` } },
  });
  map.addLayer({
    id: 'challenge-category-label',
    type: 'symbol',
    source: 'challenge-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 13, 'text-anchor': 'bottom-left' },
    paint: { 'text-color': '#f59e0b', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });
}

export const day06: Challenge = {
  id: '06',
  title: 'Filter by Property',
  difficulty: 'Easy',
  description: `
<h2>Day 06: Filter by Property</h2>
<p>GeoJSON Feature の配列から、<strong>指定したプロパティの値が一致するもの</strong>だけを返してください。</p>
<h3>条件</h3>
<pre>feature.properties[property] === value</pre>
<h3>例</h3>
<pre>solve(features, "category", "cafe")
→ category が "cafe" の Feature だけの配列</pre>
<h3>制約</h3>
<ul>
  <li>Feature の geometry は必ず <code>Point</code></li>
  <li>マッチしない場合は空配列 <code>[]</code> を返す</li>
  <li>元の配列は変更しない</li>
</ul>`,
  starterCode: `function solve(features, property, value) {
  // features: GeoJSON Point Feature[]
  // property: string  (フィルタするプロパティ名)
  // value: string     (一致すべき値)
  // 条件を満たす Feature だけを返してください
  return [];
}`,
  functionName: 'solve',
  typeDeclarations: `
interface PointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: { [key: string]: string };
}
declare function solve(
  features: PointFeature[],
  property: string,
  value: string
): PointFeature[];
`,
  tests: [
    {
      name: 'category="cafe" の Feature を返す',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'cafe') as ShopFeature[];
        if (!Array.isArray(result)) throw new Error('配列を返してください');
        const names = result.map((f) => f.properties.name).sort();
        const expected = ['新宿のカフェ', '渋谷のカフェ', '品川のカフェ', '表参道のカフェ'].sort();
        if (JSON.stringify(names) !== JSON.stringify(expected))
          throw new Error(`期待値: ${JSON.stringify(expected)}\n実際: ${JSON.stringify(names)}`);
      },
    },
    {
      name: 'category="restaurant" の Feature を返す',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'restaurant') as ShopFeature[];
        if (!Array.isArray(result)) throw new Error('配列を返してください');
        const names = result.map((f) => f.properties.name).sort();
        const expected = ['代々木のレストラン', '原宿のレストラン'].sort();
        if (JSON.stringify(names) !== JSON.stringify(expected))
          throw new Error(`期待値: ${JSON.stringify(expected)}\n実際: ${JSON.stringify(names)}`);
      },
    },
    {
      name: 'マッチなしの場合は空配列',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'hotel') as unknown[];
        if (!Array.isArray(result) || result.length !== 0)
          throw new Error(`空配列を期待しましたが length=${(result as unknown[])?.length}`);
      },
    },
    {
      name: 'cafe のみ返す（restaurant は含まない）',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'cafe') as ShopFeature[];
        const cats = result.map((f) => f.properties.category);
        if (cats.some((c) => c !== 'cafe'))
          throw new Error('cafe 以外の Feature が含まれています');
      },
    },
    {
      name: 'restaurant のみ返す（cafe は含まない）',
      run: (fn) => {
        const result = fn(SHOPS, 'category', 'restaurant') as ShopFeature[];
        const cats = result.map((f) => f.properties.category);
        if (cats.some((c) => c !== 'restaurant'))
          throw new Error('restaurant 以外の Feature が含まれています');
      },
    },
  ],
  setupMap,
  mapOptions: { center: [139.725, 35.69], zoom: 12 },
};
