import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, LineString } from 'geojson';
import { MAP_ANIM_DURATION_MS } from './constants';

const ROUTE: [number, number][] = [
  [139.7671, 35.6812], // 東京
  [137.3831, 36.6953], // 長野
  [136.9066, 35.1802], // 名古屋
  [135.4959, 34.7024], // 大阪
];

const LABELS = ['東京', '長野', '名古屋', '大阪'];

// Per-test scenarios: which coords to draw and what camera bounds to use
const SCENARIOS: {
  coords: [number, number][];
  bounds: [[number, number], [number, number]];
  check: (r: Feature<LineString>, coords: [number, number][]) => boolean;
}[] = [
  {
    // Test 1: 2-point LineString (東京→大阪)
    coords: [[139.7671, 35.6812], [135.4959, 34.7024]],
    bounds: [[134, 34], [141, 36.5]],
    check: (r, c) => r?.type === 'Feature' && r.geometry?.type === 'LineString' &&
                     JSON.stringify(r.geometry.coordinates) === JSON.stringify(c),
  },
  {
    // Test 2: 4-point LineString (full ROUTE)
    coords: ROUTE,
    bounds: [[134, 34], [141, 37.5]],
    check: (r, _c) => r?.type === 'Feature' && r.geometry?.type === 'LineString' &&
                      r.geometry.coordinates.length === 4,
  },
  {
    // Test 3: coordinates match exactly
    coords: ROUTE,
    bounds: [[134, 34], [141, 37.5]],
    check: (r, c) => r?.type === 'Feature' && r.geometry?.type === 'LineString' &&
                     JSON.stringify(r.geometry.coordinates) === JSON.stringify(c),
  },
];

function tryLine(userFn: ((...args: unknown[]) => unknown), coords: [number, number][]): Feature<LineString> | null {
  try {
    const r = userFn(coords) as Feature<LineString> | null;
    if (r?.geometry?.type === 'LineString') return r;
  } catch { /* ignore */ }
  return null;
}

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const ran = isFinite(revealedCount) && revealedCount >= 0;
  const idx = Math.min(Math.max(0, (ran ? revealedCount : 0) - 1), SCENARIOS.length - 1);
  const scenario = ran ? SCENARIOS[idx] : SCENARIOS[SCENARIOS.length - 1];

  map.fitBounds(scenario.bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 }, duration: MAP_ANIM_DURATION_MS });

  // Try user's function for this scenario's coords
  let lineResult: Feature<LineString> | null = null;
  let ok = false;
  if (userFn) {
    lineResult = tryLine(userFn, scenario.coords);
    if (lineResult) ok = scenario.check(lineResult, scenario.coords);
  }

  const lineColor = !userFn ? '#4f8ef7' : ok ? '#22c55e' : '#ef4444';
  const pointColor = !userFn ? '#f59e0b' : ok ? '#22c55e' : '#ef4444';

  // Show which points are used in this scenario
  const usedIndices = scenario.coords === ROUTE
    ? [0, 1, 2, 3]
    : [0, 3]; // Tokyo + Osaka for 2-point test

  map.addSource('challenge-points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: ROUTE.map((c, i) => ({
        type: 'Feature',
        properties: {
          label: LABELS[i],
          color: usedIndices.includes(i) ? pointColor : '#3a3a5a',
          radius: usedIndices.includes(i) ? 8 : 5,
        },
        geometry: { type: 'Point', coordinates: c },
      })),
    },
  });
  map.addLayer({
    id: 'challenge-points',
    type: 'circle',
    source: 'challenge-points',
    paint: {
      'circle-radius': ['get', 'radius'],
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });
  map.addLayer({
    id: 'challenge-point-labels',
    type: 'symbol',
    source: 'challenge-points',
    layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-offset': [0, 1.4], 'text-anchor': 'top' },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  // Expected dotted guide line
  map.addSource('challenge-expected', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: scenario.coords }, properties: {} },
  });
  map.addLayer({
    id: 'challenge-expected',
    type: 'line',
    source: 'challenge-expected',
    paint: { 'line-color': '#f59e0b', 'line-width': 1.5, 'line-dasharray': [4, 3], 'line-opacity': 0.6 },
  });

  // User's result line
  if (lineResult) {
    map.addSource('challenge-line', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: lineResult.geometry.coordinates }, properties: {} },
    });
    map.addLayer({
      id: 'challenge-line',
      type: 'line',
      source: 'challenge-line',
      paint: { 'line-color': lineColor, 'line-width': 3.5 },
    });
  }
}

export const day02: Challenge = {
  id: '02',
  title: 'Lines',
  difficulty: 'Tutorial',
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
  typeDeclarations: `
declare function solve(
  coordinates: [number, number][]
): { type: "Feature"; geometry: { type: "LineString"; coordinates: [number, number][] }; properties: Record<string, unknown> } | null;
`,
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
