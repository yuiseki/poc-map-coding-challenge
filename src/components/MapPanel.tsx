import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Challenge, TestResult } from '../challenges/types';

// Register pmtiles protocol once
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile.bind(protocol));

const MAP_STYLE = 'https://z.yuiseki.net/static/maps/styles/osm-fiord.json';

type Props = {
  challenge: Challenge;
  testResults: TestResult[] | null;
  runId: number; // increment to re-run map setup
  getUserFn: () => ((...args: unknown[]) => unknown) | null;
};

function removeLayers(map: maplibregl.Map) {
  const style = map.getStyle();
  const layerIds = (style.layers ?? []).map((l) => l.id).filter((id) => id.startsWith('challenge-'));
  layerIds.forEach((id) => map.removeLayer(id));
  Object.keys(style.sources ?? {}).filter((id) => id.startsWith('challenge-')).forEach((id) => map.removeSource(id));
}

export function MapPanel({ challenge, testResults, runId, getUserFn }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const runIdRef = useRef(runId);

  // Initialize map when challenge changes
  useEffect(() => {
    if (!containerRef.current) return;
    mapRef.current?.remove();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: challenge.mapOptions.center,
      zoom: challenge.mapOptions.zoom,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on('load', () => {
      removeLayers(map);
      challenge.setupMap(map, getUserFn());
    });

    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);

  // Re-run map setup when runId changes (without re-initializing the map)
  useEffect(() => {
    if (runIdRef.current === runId) return;
    runIdRef.current = runId;
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    removeLayers(map);
    challenge.setupMap(map, getUserFn());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const pass = testResults?.filter((r) => r.pass).length ?? 0;
  const total = testResults?.length ?? 0;

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Test results overlay */}
      {testResults && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(26,26,26,0.92)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 14px',
          maxWidth: 260,
          maxHeight: '60%',
          overflowY: 'auto',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 8,
            color: pass === total ? 'var(--green)' : 'var(--accent)',
          }}>
            {pass === total ? '✅ All Passed!' : `${pass} / ${total} Passed`}
          </div>
          {testResults.map((r, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              padding: '4px 0',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ flexShrink: 0, fontSize: 12 }}>{r.pass ? '✅' : '❌'}</span>
              <div>
                <div style={{ fontSize: 11, color: r.pass ? 'var(--text)' : 'var(--red)' }}>{r.name}</div>
                {r.error && (
                  <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                    {r.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
