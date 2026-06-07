import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, LineString } from 'geojson';

const ROUTE: [number, number][] = [
  [139.7671, 35.6812], // 東京
  [137.3831, 36.6953], // 長野
  [136.9066, 35.1802], // 名古屋
  [135.4959, 34.7024], // 大阪
];

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null) {
  let lineCoords: [number, number][] | null = null;
  if (userFn) {
    try {
      const r = userFn(ROUTE) as Feature<LineString> | null;
      if (r?.geometry?.type === 'LineString') {
        lineCoords = r.geometry.coordinates as [number, number][];
      }
    } catch { /* ignore */ }
  }

  // Input points
  map.addSource('challenge-points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: ROUTE.map((c, i) => ({
        type: 'Feature',
        properties: { label: ['東京', '長野', '名古屋', '大阪'][i] },
        geometry: { type: 'Point', coordinates: c },
      })),
    },
  });
  map.addLayer({
    id: 'challenge-points',
    type: 'circle',
    source: 'challenge-points',
    paint: { 'circle-radius': 7, 'circle-color': '#f59e0b', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
  });
  map.addLayer({
    id: 'challenge-point-labels',
    type: 'symbol',
    source: 'challenge-points',
    layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-offset': [0, 1.4], 'text-anchor': 'top' },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  // Result line
  if (lineCoords) {
    map.addSource('challenge-line', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: lineCoords }, properties: {} },
    });
    map.addLayer({
      id: 'challenge-line',
      type: 'line',
      source: 'challenge-line',
      paint: { 'line-color': '#22c55e', 'line-width': 3 },
    });
  }
}

export const day02: Challenge = {
  id: '02',
  title: 'Lines',
  difficulty: 'Easy',
  description: `
<h2>Day 02: Lines</h2>
<p>座標の配列を受け取り、<strong>GeoJSON LineString Feature</strong> を返してください。</p>
<h3>GeoJSON LineString の構造</h3>
<pre>{
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: [[lon, lat], [lon, lat], ...]
  },
  properties: {}
}</pre>
<h3>例</h3>
<pre>solve([[139.7671, 35.6812], [135.4959, 34.7024]])
→ {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [[139.7671, 35.6812], [135.4959, 34.7024]]
    },
    properties: {}
  }</pre>
<h3>制約</h3>
<ul>
  <li>入力は <code>[longitude, latitude]</code> の配列（2件以上）</li>
  <li>入力座標をそのまま <code>coordinates</code> に設定する</li>
</ul>`,
  starterCode: `function solve(coordinates) {
  // GeoJSON LineString Feature を返してください
  // coordinates: [longitude, latitude][] (配列)
  return null;
}`,
  functionName: 'solve',
  tests: [
    {
      name: '2点の LineString',
      run: (fn) => {
        const coords: [number, number][] = [[139.7671, 35.6812], [135.4959, 34.7024]];
        const r = fn(coords) as Feature<LineString>;
        if (r?.type !== 'Feature') throw new Error('type が "Feature" ではありません');
        if (r.geometry?.type !== 'LineString') throw new Error('geometry.type が "LineString" ではありません');
        if (JSON.stringify(r.geometry.coordinates) !== JSON.stringify(coords))
          throw new Error('coordinates が一致しません');
      },
    },
    {
      name: '4点の LineString',
      run: (fn) => {
        const r = fn(ROUTE) as Feature<LineString>;
        if (r?.geometry?.type !== 'LineString') throw new Error('geometry.type が "LineString" ではありません');
        if (r.geometry.coordinates.length !== 4) throw new Error(`length が ${r.geometry.coordinates.length} です（期待値: 4）`);
      },
    },
    {
      name: '座標が正しく保存されている',
      run: (fn) => {
        const r = fn(ROUTE) as Feature<LineString>;
        if (JSON.stringify(r.geometry.coordinates) !== JSON.stringify(ROUTE))
          throw new Error('coordinates が入力と一致しません');
      },
    },
  ],
  setupMap,
  mapOptions: { center: [137, 36], zoom: 5 },
};
