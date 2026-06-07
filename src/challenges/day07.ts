import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';

type BBox = { west: number; south: number; east: number; north: number };

const SCENARIOS: {
  label: string;
  points: [number, number][];
  expected: BBox;
  center: [number, number];
  zoom: number;
}[] = [
  {
    label: '日本主要都市',
    points: [
      [139.6917, 35.6895], // 東京
      [135.5023, 34.6937], // 大阪
      [130.4017, 33.5904], // 福岡
      [141.3544, 43.0642], // 札幌
    ],
    expected: { west: 130.4017, south: 33.5904, east: 141.3544, north: 43.0642 },
    center: [136, 38.5], zoom: 4,
  },
  {
    label: '1点（東京のみ）',
    points: [[139.6917, 35.6895]],
    expected: { west: 139.6917, south: 35.6895, east: 139.6917, north: 35.6895 },
    center: [139.6917, 35.6895], zoom: 8,
  },
  {
    label: '東京・大阪の2点',
    points: [[139.6917, 35.6895], [135.5023, 34.6937]],
    expected: { west: 135.5023, south: 34.6937, east: 139.6917, north: 35.6895 },
    center: [137.5, 35.2], zoom: 5,
  },
  {
    label: 'オーストラリア主要都市',
    points: [
      [151.2093, -33.8688], // シドニー
      [144.9631, -37.8136], // メルボルン
      [115.8605, -31.9505], // パース
    ],
    expected: { west: 115.8605, south: -37.8136, east: 151.2093, north: -31.9505 },
    center: [134, -34.5], zoom: 3,
  },
  {
    label: 'アメリカ主要都市',
    points: [
      [-74.006,    40.7128], // ニューヨーク
      [-87.6298,   41.8781], // シカゴ
      [-118.2437,  34.0522], // ロサンゼルス
    ],
    expected: { west: -118.2437, south: 34.0522, east: -74.006, north: 41.8781 },
    center: [-96, 38.5], zoom: 3,
  },
];

function bboxRing(b: BBox): [number, number][] {
  return [
    [b.west, b.south], [b.east, b.south],
    [b.east, b.north], [b.west, b.north], [b.west, b.south],
  ];
}

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const idx = Math.min(Math.max(0, revealedCount - 1), SCENARIOS.length - 1);
  const { label, points, expected, center, zoom } = SCENARIOS[idx];

  if (revealedCount !== 0) map.flyTo({ center, zoom, speed: 0.8 });

  let result: BBox | null = null;
  if (userFn) {
    try {
      const r = userFn(points) as BBox;
      if (typeof r?.west === 'number') result = r;
    } catch { /* ignore */ }
  }

  // Expected bbox (dashed yellow)
  map.addSource('challenge-expected', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [bboxRing(expected)] }, properties: {} },
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

  // User's result bbox (solid green if correct, red if wrong)
  if (result) {
    const ok = Math.abs(result.west - expected.west) < 0.0001 &&
               Math.abs(result.south - expected.south) < 0.0001 &&
               Math.abs(result.east - expected.east) < 0.0001 &&
               Math.abs(result.north - expected.north) < 0.0001;
    map.addSource('challenge-result', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [bboxRing(result)] }, properties: {} },
    });
    map.addLayer({
      id: 'challenge-result-fill',
      type: 'fill',
      source: 'challenge-result',
      paint: { 'fill-color': ok ? '#22c55e' : '#ef4444', 'fill-opacity': 0.18 },
    });
    map.addLayer({
      id: 'challenge-result-line',
      type: 'line',
      source: 'challenge-result',
      paint: { 'line-color': ok ? '#22c55e' : '#ef4444', 'line-width': 2.5 },
    });
  }

  // Input points
  map.addSource('challenge-points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: points.map((c) => ({
        type: 'Feature',
        properties: { label: `${c[0].toFixed(4)}, ${c[1].toFixed(4)}` },
        geometry: { type: 'Point', coordinates: c },
      })),
    },
  });
  map.addLayer({
    id: 'challenge-points',
    type: 'circle',
    source: 'challenge-points',
    paint: { 'circle-radius': 7, 'circle-color': '#4f8ef7', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
  });

  // Label
  map.addSource('challenge-label', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [expected.west, expected.north] },
      properties: { label },
    },
  });
  map.addLayer({
    id: 'challenge-label',
    type: 'symbol',
    source: 'challenge-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 13, 'text-anchor': 'bottom-left', 'text-offset': [0.5, 0] },
    paint: { 'text-color': '#f59e0b', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });
}

export const day07: Challenge = {
  id: '07',
  title: 'Bounding Box',
  difficulty: 'Easy',
  description: `
<h2>Day 06: Bounding Box</h2>
<p>座標の配列を受け取り、<strong>全点を囲む最小の矩形領域（バウンディングボックス）</strong>を返してください。</p>
<h3>出力形式</h3>
<pre>{ west: number, south: number, east: number, north: number }</pre>
<h3>bbox の意味</h3>
<ul>
  <li><code>west</code>: 最も西（経度の最小値）</li>
  <li><code>south</code>: 最も南（緯度の最小値）</li>
  <li><code>east</code>: 最も東（経度の最大値）</li>
  <li><code>north</code>: 最も北（緯度の最大値）</li>
</ul>
<h3>例</h3>
<pre>solve([
  [139.6917, 35.6895],  // 東京
  [130.4017, 33.5904],  // 福岡
  [141.3544, 43.0642],  // 札幌
])
→ { west: 130.4017, south: 33.5904, east: 141.3544, north: 43.0642 }</pre>
<h3>制約</h3>
<ul>
  <li>入力は <code>[longitude, latitude]</code> の配列（1件以上）</li>
  <li>座標は <code>[経度, 緯度]</code> の順（GeoJSON 準拠）</li>
  <li>経度が西半球（負の値）や緯度が南半球（負の値）の場合も考慮すること</li>
</ul>`,
  starterCode: `function solve(points) {
  // points: [longitude, latitude][]
  // 全点を囲む最小のbboxを返してください
  return { west: 0, south: 0, east: 0, north: 0 };
}`,
  functionName: 'solve',
  typeDeclarations: `
interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}
declare function solve(points: [number, number][]): BBox;
`,
  tests: [
    {
      name: '日本主要都市のバウンディングボックス',
      run: (fn) => {
        const points: [number, number][] = [
          [139.6917, 35.6895], [135.5023, 34.6937],
          [130.4017, 33.5904], [141.3544, 43.0642],
        ];
        const r = fn(points) as BBox;
        if (!r || typeof r.west !== 'number') throw new Error('{ west, south, east, north } を返してください');
        if (r.west !== 130.4017) throw new Error(`west: 期待 130.4017, 実際 ${r.west}`);
        if (r.south !== 33.5904) throw new Error(`south: 期待 33.5904, 実際 ${r.south}`);
        if (r.east !== 141.3544) throw new Error(`east: 期待 141.3544, 実際 ${r.east}`);
        if (r.north !== 43.0642) throw new Error(`north: 期待 43.0642, 実際 ${r.north}`);
      },
    },
    {
      name: '1点のbboxは全辺が同じ値',
      run: (fn) => {
        const r = fn([[139.6917, 35.6895]]) as BBox;
        if (r.west !== 139.6917 || r.east !== 139.6917) throw new Error('1点の場合 west === east');
        if (r.south !== 35.6895 || r.north !== 35.6895) throw new Error('1点の場合 south === north');
      },
    },
    {
      name: '2点のbbox',
      run: (fn) => {
        const r = fn([[139.6917, 35.6895], [135.5023, 34.6937]]) as BBox;
        if (r.west !== 135.5023) throw new Error(`west: 期待 135.5023, 実際 ${r.west}`);
        if (r.east !== 139.6917) throw new Error(`east: 期待 139.6917, 実際 ${r.east}`);
      },
    },
    {
      name: '南半球（負の緯度）に対応',
      run: (fn) => {
        const points: [number, number][] = [
          [151.2093, -33.8688], [144.9631, -37.8136], [115.8605, -31.9505],
        ];
        const r = fn(points) as BBox;
        if (r.south !== -37.8136) throw new Error(`south: 期待 -37.8136, 実際 ${r.south}`);
        if (r.north !== -31.9505) throw new Error(`north: 期待 -31.9505, 実際 ${r.north}`);
      },
    },
    {
      name: '西半球（負の経度）に対応',
      run: (fn) => {
        const points: [number, number][] = [
          [-74.006, 40.7128], [-87.6298, 41.8781], [-118.2437, 34.0522],
        ];
        const r = fn(points) as BBox;
        if (r.west !== -118.2437) throw new Error(`west: 期待 -118.2437, 実際 ${r.west}`);
        if (r.east !== -74.006) throw new Error(`east: 期待 -74.006, 実際 ${r.east}`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [136, 38.5], zoom: 4 },
};
