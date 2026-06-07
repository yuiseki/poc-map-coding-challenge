import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, Point } from 'geojson';

const TARGETS: { name: string; lon: number; lat: number }[] = [
  { name: '東京駅',  lon: 139.7671, lat: 35.6812 },
  { name: '大阪駅',  lon: 135.4959, lat: 34.7024 },
  { name: '博多駅',  lon: 130.4183, lat: 33.5902 },
  { name: '[0, 0]',  lon: 0,        lat: 0        },
];

function checkPoint(userFn: ((...args: unknown[]) => unknown), lon: number, lat: number): boolean {
  try {
    const f = userFn(lon, lat) as Feature<Point> | null;
    return (
      f?.type === 'Feature' &&
      f.geometry?.type === 'Point' &&
      f.geometry.coordinates[0] === lon &&
      f.geometry.coordinates[1] === lat
    );
  } catch { return false; }
}

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) {
  // How many tests have been revealed (finite number means Run was pressed)
  const ran = isFinite(revealedCount) && revealedCount > 0;
  const revealed = ran ? revealedCount : 0;

  // Per-target status: 'pending' | 'pass' | 'fail'
  const statuses = TARGETS.map((t, i) => {
    if (!ran || !userFn || i >= revealed) return 'pending';
    return checkPoint(userFn, t.lon, t.lat) ? 'pass' : 'fail';
  });

  const colorOf = (s: string) => s === 'pass' ? '#22c55e' : s === 'fail' ? '#ef4444' : '#f59e0b';
  const radiusOf = (s: string) => s === 'pending' ? 8 : 11;

  // Camera: fly to the most recently revealed target
  const focusIdx = Math.min(Math.max(0, revealed - 1), TARGETS.length - 1);
  const focus = TARGETS[focusIdx];

  if (!ran) {
    // Default: show Japan with first 3 targets
    map.fitBounds([[128, 32], [142, 42]], { padding: 60, speed: 2.0 });
  } else if (revealed >= 4) {
    // Show world view to include [0,0] and Japan
    map.fitBounds([[-15, -5], [145, 50]], { padding: 60, speed: 2.0 });
  } else {
    // Fly to each city in sequence — use speed so short hops finish well within REVEAL_DELAY_MS
    map.easeTo({ center: [focus.lon, focus.lat], zoom: 9, duration: 500 });
  }

  // Show targets revealed so far (+ all in default view)
  const visibleTargets = !ran ? TARGETS.slice(0, 3) : TARGETS.slice(0, Math.max(1, revealed));

  map.addSource('challenge-targets', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: visibleTargets.map((t, i) => ({
        type: 'Feature',
        properties: {
          label: t.name,
          color: colorOf(statuses[i]),
          radius: radiusOf(statuses[i]),
        },
        geometry: { type: 'Point', coordinates: [t.lon, t.lat] },
      })),
    },
  });
  map.addLayer({
    id: 'challenge-circles',
    type: 'circle',
    source: 'challenge-targets',
    paint: {
      'circle-radius': ['get', 'radius'],
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });
  map.addLayer({
    id: 'challenge-labels',
    type: 'symbol',
    source: 'challenge-targets',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 13,
      'text-offset': [0, 1.6],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#e2e8f0',
      'text-halo-color': '#1a1d27',
      'text-halo-width': 2,
    },
  });
}

export const day01: Challenge = {
  id: '01',
  title: 'Points',
  difficulty: 'Tutorial',
  description: `
<h2>Day 01: Points</h2>
<p>指定された経度・緯度の地点を <strong>GeoJSON Point Feature</strong> として返してください。</p>
<h3>GeoJSON Point の構造</h3>
<pre>{
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  properties: {}
}</pre>
<h3>例</h3>
<pre>solve(139.7671, 35.6812)
→ {
    type: "Feature",
    geometry: { type: "Point", coordinates: [139.7671, 35.6812] },
    properties: {}
  }</pre>
<h3>制約</h3>
<ul>
  <li>座標は <code>[longitude, latitude]</code> の順（GeoJSON 準拠）</li>
  <li><code>properties</code> は空オブジェクト <code>{}</code> で可</li>
</ul>`,
  starterCode: `function solve(longitude, latitude) {
  // GeoJSON Point Feature を返してください
  return null;
}`,
  functionName: 'solve',
  typeDeclarations: `
declare function solve(
  longitude: number,
  latitude: number
): { type: "Feature"; geometry: { type: "Point"; coordinates: [number, number] }; properties: Record<string, unknown> } | null;
`,
  tests: [
    {
      name: '東京駅を Point として返す',
      run: (fn) => {
        const r = fn(139.7671, 35.6812) as Feature<Point>;
        if (r?.type !== 'Feature') throw new Error('type が "Feature" ではありません');
        if (r.geometry?.type !== 'Point') throw new Error('geometry.type が "Point" ではありません');
        if (r.geometry.coordinates[0] !== 139.7671 || r.geometry.coordinates[1] !== 35.6812)
          throw new Error(`coordinates が不正: ${JSON.stringify(r.geometry.coordinates)}`);
      },
    },
    {
      name: '大阪駅を Point として返す',
      run: (fn) => {
        const r = fn(135.4959, 34.7024) as Feature<Point>;
        if (r?.type !== 'Feature') throw new Error('type が "Feature" ではありません');
        if (r.geometry?.type !== 'Point') throw new Error('geometry.type が "Point" ではありません');
        if (r.geometry.coordinates[0] !== 135.4959 || r.geometry.coordinates[1] !== 34.7024)
          throw new Error(`coordinates が不正`);
      },
    },
    {
      name: '博多駅を Point として返す',
      run: (fn) => {
        const r = fn(130.4183, 33.5902) as Feature<Point>;
        if (r?.type !== 'Feature') throw new Error('type が "Feature" ではありません');
        if (r.geometry?.type !== 'Point') throw new Error('geometry.type が "Point" ではありません');
        if (r.geometry.coordinates[0] !== 130.4183 || r.geometry.coordinates[1] !== 33.5902)
          throw new Error(`coordinates が不正`);
      },
    },
    {
      name: '任意座標でも動作する',
      run: (fn) => {
        const r = fn(0, 0) as Feature<Point>;
        if (r?.geometry?.coordinates[0] !== 0 || r.geometry.coordinates[1] !== 0)
          throw new Error(`[0,0] が正しく返されていません`);
      },
    },
  ],
  setupMap,
  mapOptions: { center: [136, 36], zoom: 5 },
};
