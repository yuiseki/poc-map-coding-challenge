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
  consoleLogs: string[];
  revealedCount: number;
  runId: number;
  getUserFn: () => ((...args: unknown[]) => unknown) | null;
};

function removeLayers(map: maplibregl.Map) {
  const style = map.getStyle();
  const layerIds = (style.layers ?? []).map((l) => l.id).filter((id) => id.startsWith('challenge-'));
  layerIds.forEach((id) => map.removeLayer(id));
  Object.keys(style.sources ?? {}).filter((id) => id.startsWith('challenge-')).forEach((id) => map.removeSource(id));
}

export function MapPanel({ challenge, testResults, consoleLogs, revealedCount, runId, getUserFn }: Props) {
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
      challenge.setupMap(map, getUserFn(), revealedCount);
    });

    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);

  // Re-run map setup when runId or revealedCount changes
  useEffect(() => {
    const countChanged = runIdRef.current !== runId;
    runIdRef.current = runId;
    if (!countChanged && revealedCount === Infinity) return;
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    removeLayers(map);
    challenge.setupMap(map, getUserFn(), revealedCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, revealedCount]);

  const visible = testResults ? testResults.slice(0, revealedCount) : [];
  const pass = visible.filter((r) => r.pass).length;
  const total = testResults?.length ?? 0;
  const allRevealed = revealedCount >= total;
  // The test currently being "executed" (next to reveal)
  const runningIndex = testResults && !allRevealed ? revealedCount : null;

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
          width: 270,
          maxHeight: 'calc(100% - 20px)',
          overflowY: 'auto',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}>
          {/* Console logs */}
          {consoleLogs.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Console
              </div>
              <div style={{
                background: '#0f0f0f',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '6px 8px',
                maxHeight: 120,
                overflowY: 'auto',
              }}>
                {consoleLogs.map((log, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: '#a8d8a8',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test summary — only shown after all revealed */}
          {allRevealed && (
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 8,
              color: pass === total ? 'var(--green)' : 'var(--accent)',
              animation: 'testReveal 0.25s ease',
            }}>
              {pass === total ? '✅ All Passed!' : `${pass} / ${total} Passed`}
            </div>
          )}

          {/* Revealed test items */}
          {visible.map((r, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              padding: '4px 0',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              animation: 'testReveal 0.2s ease',
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

          {/* Currently running test */}
          {runningIndex !== null && testResults && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 0',
              borderTop: visible.length > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ flexShrink: 0, fontSize: 12, animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⏳</span>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {testResults[runningIndex].name}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
