import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';

type Facility = { name: string; location: [number, number] };

const FACILITIES: Facility[] = [
  { name: '東京タワー',   location: [139.7454, 35.6586] },
  { name: 'スカイツリー', location: [139.8107, 35.7101] },
  { name: '新宿御苑',     location: [139.7100, 35.6851] },
  { name: '上野動物園',   location: [139.7714, 35.7148] },
  { name: '浅草寺',       location: [139.7966, 35.7147] },
];

const CURRENT_LOCATION: [number, number] = [139.7530, 35.6867]; // 銀座付近

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null) {
  let nearestName: string | null = null;
  if (userFn) {
    try { nearestName = userFn(CURRENT_LOCATION, FACILITIES) as string; } catch { /* ignore */ }
  }

  // Facilities
  map.addSource('challenge-facilities', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: FACILITIES.map((f) => ({
        type: 'Feature',
        properties: {
          name: f.name,
          color: nearestName === f.name ? '#22c55e' : '#4f8ef7',
          radius: nearestName === f.name ? 10 : 7,
        },
        geometry: { type: 'Point', coordinates: f.location },
      })),
    },
  });
  map.addLayer({
    id: 'challenge-facilities',
    type: 'circle',
    source: 'challenge-facilities',
    paint: {
      'circle-radius': ['get', 'radius'],
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });
  map.addLayer({
    id: 'challenge-facility-labels',
    type: 'symbol',
    source: 'challenge-facilities',
    layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.5], 'text-anchor': 'top' },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  // Current location
  map.addSource('challenge-current', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: CURRENT_LOCATION }, properties: { label: '現在地' } },
  });
  map.addLayer({
    id: 'challenge-current',
    type: 'circle',
    source: 'challenge-current',
    paint: { 'circle-radius': 10, 'circle-color': '#ef4444', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' },
  });
  map.addLayer({
    id: 'challenge-current-label',
    type: 'symbol',
    source: 'challenge-current',
    layout: { 'text-field': '📍現在地', 'text-size': 13, 'text-offset': [0, 1.6], 'text-anchor': 'top' },
    paint: { 'text-color': '#ef4444', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  // Line to nearest
  if (nearestName) {
    const nearest = FACILITIES.find((f) => f.name === nearestName);
    if (nearest) {
      map.addSource('challenge-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [CURRENT_LOCATION, nearest.location] },
          properties: {},
        },
      });
      map.addLayer({
        id: 'challenge-line',
        type: 'line',
        source: 'challenge-line',
        paint: { 'line-color': '#22c55e', 'line-width': 2, 'line-dasharray': [4, 2] },
      });
    }
  }
}

export const day04: Challenge = {
  id: '04',
  title: 'Nearest',
  difficulty: 'Easy',
  description: `
<h2>Day 04: Nearest</h2>
<p>現在地から最も近い施設の <strong>name</strong> を返してください。</p>
<h3>距離の計算</h3>
<p>簡易計算として、ユークリッド距離（座標差の二乗和）で比較してかまいません。<br>
正確さよりも「一番近いものを正しく選ぶ」ことが目的です。</p>
<pre>dist = (lon2-lon1)² + (lat2-lat1)²</pre>
<h3>例</h3>
<pre>solve(
  [139.7530, 35.6867],  // 現在地（銀座付近）
  [
    { name: "東京タワー",   location: [139.7454, 35.6586] },
    { name: "スカイツリー", location: [139.8107, 35.7101] },
    ...
  ]
)
→ "東京タワー"  // 最も近い施設の name</pre>
<h3>制約</h3>
<ul>
  <li>施設は必ず 1 件以上</li>
  <li>戻り値は施設の <code>name</code>（文字列）</li>
</ul>`,
  starterCode: `function solve(currentLocation, facilities) {
  // currentLocation: [longitude, latitude]
  // facilities: [{ name: string, location: [longitude, latitude] }]
  // 最も近い施設の name を返してください
  return null;
}`,
  functionName: 'solve',
  tests: [
    {
      name: '銀座付近から最も近いのは東京タワー',
      run: (fn) => {
        const result = fn(CURRENT_LOCATION, FACILITIES);
        if (result !== '東京タワー') throw new Error(`期待値: "東京タワー", 実際: "${result}"`);
      },
    },
    {
      name: '浅草寺の隣から最も近いのは浅草寺',
      run: (fn) => {
        const near: [number, number] = [139.7980, 35.7140];
        const result = fn(near, FACILITIES);
        if (result !== '浅草寺') throw new Error(`期待値: "浅草寺", 実際: "${result}"`);
      },
    },
    {
      name: '施設が 1 件の場合はその施設を返す',
      run: (fn) => {
        const single = [{ name: 'テスト施設', location: [135.0, 35.0] as [number, number] }];
        const result = fn([139.0, 36.0], single);
        if (result !== 'テスト施設') throw new Error(`期待値: "テスト施設", 実際: "${result}"`);
      },
    },
    {
      name: '上野動物園の隣から最も近いのは上野動物園',
      run: (fn) => {
        const near: [number, number] = [139.7720, 35.7150];
        const result = fn(near, FACILITIES);
        if (result !== '上野動物園') throw new Error(`期待値: "上野動物園", 実際: "${result}"`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [139.77, 35.69], zoom: 12 },
};
