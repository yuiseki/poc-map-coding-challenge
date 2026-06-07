import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';

const TOLERANCE_KM = 50; // Haversine 正解で ±1km 以内だが、表示は ±50km で合否判定

const SCENARIOS: {
  from: [number, number];
  to: [number, number];
  fromLabel: string;
  toLabel: string;
  expectedKm: number;
}[] = [
  { from: [139.6917, 35.6895], to:  [139.6917, 35.6895], fromLabel: '東京',   toLabel: '東京（同一地点）', expectedKm: 0 },
  { from: [139.6917, 35.6895], to:  [  2.3522, 48.8566], fromLabel: '東京',   toLabel: 'パリ',             expectedKm: 9715 },
  { from: [139.6917, 35.6895], to:  [-74.0060, 40.7128], fromLabel: '東京',   toLabel: 'ニューヨーク',      expectedKm: 10838 },
  { from: [139.6917, 35.6895], to:  [151.2093,-33.8688], fromLabel: '東京',   toLabel: 'シドニー',          expectedKm: 7823 },
  { from: [  0,       90    ], to:  [  0,      -90    ], fromLabel: '北極点', toLabel: '南極点',            expectedKm: 20015 },
];

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  const idx = Math.min(Math.max(0, revealedCount - 1), SCENARIOS.length - 1);
  const { from, to, fromLabel, toLabel, expectedKm } = SCENARIOS[idx];

  const isSamePoint = from[0] === to[0] && from[1] === to[1];

  // Fit bounds to show both points
  if (!isSamePoint) {
    const lons = [from[0], to[0]];
    const lats = [from[1], to[1]];
    // Clamp poles for fitBounds
    const clampLat = (l: number) => Math.max(-85, Math.min(85, l));
    if (revealedCount !== 0) map.fitBounds(
      [[Math.min(...lons), clampLat(Math.min(...lats))], [Math.max(...lons), clampLat(Math.max(...lats))]],
      { padding: { top: 80, bottom: 80, left: 80, right: 320 }, speed: 2.0, maxZoom: 8 }
    );
  } else {
    if (revealedCount !== 0) map.easeTo({ center: from, zoom: 8, duration: 500 });
  }

  // Compute user's result
  let resultKm: number | null = null;
  let ok = false;
  if (userFn) {
    try {
      const r = userFn(from, to) as number;
      if (typeof r === 'number' && isFinite(r)) {
        resultKm = Math.round(r);
        ok = Math.abs(r - expectedKm) <= TOLERANCE_KM;
      }
    } catch { /* ignore */ }
  }

  // Points
  const features = isSamePoint
    ? [{ coords: from, label: fromLabel }]
    : [{ coords: from, label: fromLabel }, { coords: to, label: toLabel }];

  map.addSource('challenge-points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: features.map(({ coords, label }) => ({
        type: 'Feature',
        properties: { label },
        geometry: { type: 'Point', coordinates: coords },
      })),
    },
  });
  map.addLayer({
    id: 'challenge-points',
    type: 'circle',
    source: 'challenge-points',
    paint: {
      'circle-radius': 8,
      'circle-color': resultKm !== null ? (ok ? '#22c55e' : '#ef4444') : '#4f8ef7',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });
  map.addLayer({
    id: 'challenge-point-labels',
    type: 'symbol',
    source: 'challenge-points',
    layout: { 'text-field': ['get', 'label'], 'text-size': 13, 'text-offset': [0, 1.5], 'text-anchor': 'top' },
    paint: { 'text-color': '#e2e8f0', 'text-halo-color': '#1a1d27', 'text-halo-width': 2 },
  });

  // Line between points
  if (!isSamePoint) {
    map.addSource('challenge-line', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [from, to] }, properties: {} },
    });
    map.addLayer({
      id: 'challenge-line',
      type: 'line',
      source: 'challenge-line',
      paint: {
        'line-color': resultKm !== null ? (ok ? '#22c55e' : '#ef4444') : '#4f8ef7',
        'line-width': 2,
        'line-dasharray': [4, 3],
      },
    });
  }

  // Distance label
  const midLon = (from[0] + to[0]) / 2;
  const midLat = Math.max(-85, Math.min(85, (from[1] + to[1]) / 2));
  const distText = resultKm !== null
    ? `計算値: ${resultKm.toLocaleString()} km  /  期待値: ~${expectedKm.toLocaleString()} km`
    : `期待値: ~${expectedKm.toLocaleString()} km`;

  map.addSource('challenge-dist-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: [midLon, midLat] }, properties: { label: distText } },
  });
  map.addLayer({
    id: 'challenge-dist-label',
    type: 'symbol',
    source: 'challenge-dist-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-anchor': 'center' },
    paint: {
      'text-color': resultKm !== null ? (ok ? '#22c55e' : '#ef4444') : '#f59e0b',
      'text-halo-color': '#1a1d27',
      'text-halo-width': 2,
    },
  });
}

export const day21: Challenge = {
  id: '21',
  title: 'Great Circle Distance',
  difficulty: 'Hard',
  description: `
<h2>Day 21: Great Circle Distance</h2>
<p>地球上の2点間の最短距離（大圏距離）を<strong>キロメートル単位</strong>で返してください。</p>
<h3>Haversine 公式</h3>
<p>地球を半径 <code>R = 6371 km</code> の球体として扱います。</p>
<pre>a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c</pre>
<p style="color:#94a3b8;font-size:12px">💡 度数法 → ラジアン変換: <code>rad = deg × π / 180</code><br>
JS の三角関数: <code>Math.sin</code> / <code>Math.cos</code> / <code>Math.atan2</code> / <code>Math.sqrt</code></p>
<h3>例</h3>
<pre>solve([139.6917, 35.6895], [2.3522, 48.8566])
// 東京 → パリ
→ 約 9715 km</pre>
<h3>制約</h3>
<ul>
  <li>座標は <code>[longitude, latitude]</code> の順（GeoJSON 準拠）</li>
  <li>地球の半径は <code>6371 km</code> を使用すること</li>
  <li>同じ地点の場合は <code>0</code> を返す</li>
  <li>誤差は <strong>±50 km</strong> 以内であること</li>
</ul>`,
  starterCode: `function solve(from, to) {
  // from: [longitude, latitude]
  // to:   [longitude, latitude]
  // 2点間の大圏距離をキロメートルで返してください
  const R = 6371;
  return 0;
}`,
  functionName: 'solve',
  typeDeclarations: `
declare function solve(
  from: [number, number], // [longitude, latitude]
  to: [number, number]    // [longitude, latitude]
): number; // km
`,
  tests: [
    {
      name: '同じ地点の距離は 0',
      run: (fn) => {
        const r = fn([139.6917, 35.6895], [139.6917, 35.6895]) as number;
        if (typeof r !== 'number') throw new Error('数値を返してください');
        if (Math.abs(r) > 0.001) throw new Error(`期待値: 0, 実際: ${r}`);
      },
    },
    {
      name: '東京 → パリ: 約 9715 km',
      run: (fn) => {
        const r = fn([139.6917, 35.6895], [2.3522, 48.8566]) as number;
        if (Math.abs(r - 9715) > TOLERANCE_KM)
          throw new Error(`期待値: ~9715 km, 実際: ${Math.round(r)} km`);
      },
    },
    {
      name: '東京 → ニューヨーク: 約 10838 km',
      run: (fn) => {
        const r = fn([139.6917, 35.6895], [-74.006, 40.7128]) as number;
        if (Math.abs(r - 10838) > TOLERANCE_KM)
          throw new Error(`期待値: ~10838 km, 実際: ${Math.round(r)} km`);
      },
    },
    {
      name: '東京 → シドニー: 約 7823 km',
      run: (fn) => {
        const r = fn([139.6917, 35.6895], [151.2093, -33.8688]) as number;
        if (Math.abs(r - 7823) > TOLERANCE_KM)
          throw new Error(`期待値: ~7823 km, 実際: ${Math.round(r)} km`);
      },
    },
    {
      name: '北極 → 南極: 約 20015 km',
      run: (fn) => {
        const r = fn([0, 90], [0, -90]) as number;
        if (Math.abs(r - 20015) > TOLERANCE_KM)
          throw new Error(`期待値: ~20015 km, 実際: ${Math.round(r)} km`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [70, 40], zoom: 2 },
};
