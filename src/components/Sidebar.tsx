import type { Challenge, TestResult } from '../challenges/types';

type Props = {
  challenges: Challenge[];
  currentId: string;
  results: Record<string, TestResult[]>;
  onSelect: (id: string) => void;
};

const diffColor: Record<string, string> = {
  Easy: 'var(--easy)',
  Medium: 'var(--medium)',
  Hard: 'var(--hard)',
};

export function Sidebar({ challenges, currentId, results, onSelect }: Props) {
  return (
    <aside style={{
      width: 240,
      background: 'var(--panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--accent)',
        letterSpacing: '0.05em',
        flexShrink: 0,
      }}>
        🗺️ Map Coding Challenge
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {challenges.map((c) => {
          const res = results[c.id];
          const pass = res?.filter((r) => r.pass).length ?? 0;
          const total = res?.length ?? 0;
          const active = c.id === currentId;

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                background: active ? 'var(--panel2)' : 'transparent',
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>
                Day {c.id}
              </div>
              <div style={{ fontWeight: active ? 600 : 400, marginBottom: 4 }}>
                {c.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: diffColor[c.difficulty], fontWeight: 600 }}>
                  {c.difficulty}
                </span>
                {res && (
                  <span style={{
                    fontSize: 11,
                    color: pass === total ? 'var(--green)' : 'var(--text-dim)',
                  }}>
                    {pass === total ? '✅' : `${pass}/${total}`}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
