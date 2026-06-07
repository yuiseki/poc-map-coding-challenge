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

// Each entry corresponds to one test case (null = skip flyTo)
const SCENARIOS: ({ loc: [number, number]; label: string; facilities: Facility[]; expected: string } | null)[] = [
  { loc: [139.7530, 35.6867], label: '📍銀座付近',    facilities: FACILITIES,                                         expected: '東京タワー' },
  { loc: [139.7980, 35.7140], label: '📍浅草寺の隣',  facilities: FACILITIES,                                         expected: '浅草寺' },
  null, // single-facility edge case — no good map view
  { loc: [139.7720, 35.7150], label: '📍上野付近',    facilities: FACILITIES,                                         expected: '上野動物園' },
];

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  // Which scenario to display: show the most recently revealed one
  const scenarioIdx = Math.max(0, revealedCount - 1);
  const scenario = SCENARIOS[Math.min(scenarioIdx, SCENARIOS.length - 1)];
  if (!scenario) return;

  const { loc, label, facilities, expected } = scenario;

  // Run user function to find nearest
  let found: string | null = null;
  if (userFn) {
    try { found = userFn(loc, facilities) as string; } catch { /* ignore */ }
  }
  const correct = found === expected;

  // fitBounds to contain both current location and all facilities
  const allCoords: [number, number][] = [loc, ...facilities.map((f) => f.location)];
  const lons = allCoords.map((c) => c[0]);
  const lats = allCoords.map((c) => c[1]);
  if (revealedCount !== 0) map.fitBounds(
    [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
    { padding: { top: 60, bottom: 60, left: 60, right: 300 }, speed: 0.8, maxZoom: 14 }
  );

  // Facilities
  map.addSource('challenge-facilities', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: facilities.map((f) => {
        let color = '#94a3b8';   // gray = not yet run
        let radius = 7;
        if (userFn) {
          if (f.name === found) {
            color = correct ? '#22c55e' : '#ef4444';
            radius = 12;
          } else if (f.name === expected && !correct) {
            color = '#f59e0b'; // should have been this one
          }
        }
        return {
          type: 'Feature',
          properties: { name: f.name, color, radius },
          geometry: { type: 'Point', coordinates: f.location },
        };
      }),
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

  // Current location pin
  map.addSource('challenge-current', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: loc }, properties: { label } },
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
    layout: { 'text-field': ['get', 'label'], 'text-size': 13, 'text-offset': [0, 1.6], 'text-anchor': 'top' },
    paint: { 'text-color': '#ef4444', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  // Line to found nearest
  if (found) {
    const target = facilities.find((f) => f.name === found);
    if (target) {
      map.addSource('challenge-line', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [loc, target.location] }, properties: {} },
      });
      map.addLayer({
        id: 'challenge-line',
        type: 'line',
        source: 'challenge-line',
        paint: { 'line-color': correct ? '#22c55e' : '#ef4444', 'line-width': 2.5, 'line-dasharray': [4, 2] },
      });
    }
  }
}

export const day08: Challenge = {
  id: '08',
  title: 'Nearest Point',
  difficulty: 'Easy',
  description: `
<h2>Day 08: Nearest Point</h2>
<p>現在地から最も近い施設の <strong>name</strong> を返してください。</p>
<h3>距離の計算</h3>
<p>簡易計算として、ユークリッド距離（座標差の二乗和）で比較してかまいません。<br>
正確さよりも「一番近いものを正しく選ぶ」ことが目的です。</p>
<pre>// ⚠️ JavaScript で二乗は ^ ではなく ** または掛け算
const dx = lon2 - lon1;
const dy = lat2 - lat1;
const dist = dx * dx + dy * dy; // または dx**2 + dy**2</pre>
<p style="color:#ef4444;font-size:12px">⚠️ <code>^</code> は JavaScript ではビット XOR です。べき乗には <code>**</code> を使ってください。</p>
<h3>例</h3>
<pre>solve(
  [139.7530, 35.6867],  // 現在地（銀座付近）
  [
    { name: "東京タワー",   location: [139.7454, 35.6586] },
    { name: "スカイツリー", location: [139.8107, 35.7101] },
    ...
  ]
)
→ "東京タワー"</pre>
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
  typeDeclarations: `
interface Facility {
  name: string;
  location: [number, number]; // [longitude, latitude]
}
declare function solve(
  currentLocation: [number, number],
  facilities: Facility[]
): string;
`,
  tests: [
    {
      name: '銀座付近から最も近いのは東京タワー',
      run: (fn) => {
        const result = fn([139.7530, 35.6867], FACILITIES);
        if (result !== '東京タワー') throw new Error(`期待値: "東京タワー", 実際: "${result}"`);
      },
    },
    {
      name: '浅草寺の隣から最も近いのは浅草寺',
      run: (fn) => {
        const result = fn([139.7980, 35.7140], FACILITIES);
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
        const result = fn([139.7720, 35.7150], FACILITIES);
        if (result !== '上野動物園') throw new Error(`期待値: "上野動物園", 実際: "${result}"`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [139.77, 35.69], zoom: 12 },
};
