import type { Challenge } from './types';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, Point } from 'geojson';

function setupMap(map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, _revealedCount: number) {
  const targets: [number, number][] = [
    [139.7671, 35.6812], // 東京駅
    [135.4959, 34.7024], // 大阪駅
    [130.4183, 33.5902], // 博多駅
  ];

  let results: { coord: [number, number]; ok: boolean }[] = [];
  if (userFn) {
    results = targets.map((c) => {
      try {
        const f = userFn(c[0], c[1]) as Feature<Point> | null;
        const ok =
          f?.type === 'Feature' &&
          f.geometry?.type === 'Point' &&
          f.geometry.coordinates[0] === c[0] &&
          f.geometry.coordinates[1] === c[1];
        return { coord: c, ok: !!ok };
      } catch {
        return { coord: c, ok: false };
      }
    });
  }

  map.addSource('challenge-targets', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: targets.map((c, i) => ({
        type: 'Feature',
        properties: {
          label: ['東京駅', '大阪駅', '博多駅'][i],
          color: results.length === 0 ? '#f59e0b' : results[i].ok ? '#22c55e' : '#ef4444',
        },
        geometry: { type: 'Point', coordinates: c },
      })),
    },
  });
  map.addLayer({
    id: 'challenge-circles',
    type: 'circle',
    source: 'challenge-targets',
    paint: {
      'circle-radius': 10,
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
