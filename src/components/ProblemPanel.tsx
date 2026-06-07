import type { Challenge } from '../challenges/types';

type Props = { challenge: Challenge };

const diffColor: Record<string, string> = {
  Easy: 'var(--easy)',
  Medium: 'var(--medium)',
  Hard: 'var(--hard)',
};

export function ProblemPanel({ challenge }: Props) {
  return (
    <div style={{
      width: 380,
      background: 'var(--panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Description</span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
        <span style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          color: diffColor[challenge.difficulty],
          background: `${diffColor[challenge.difficulty]}22`,
          padding: '2px 8px',
          borderRadius: 4,
          marginBottom: 12,
        }}>
          {challenge.difficulty}
        </span>

        <div
          className="problem-content"
          dangerouslySetInnerHTML={{ __html: challenge.description }}
          style={{ lineHeight: 1.75, color: 'var(--text)' }}
        />
      </div>

      <style>{`
        .problem-content h2 { font-size: 17px; font-weight: 700; margin-bottom: 10px; }
        .problem-content h3 { font-size: 13px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; margin: 18px 0 8px; }
        .problem-content p  { font-size: 13px; color: var(--text-dim); margin-bottom: 10px; line-height: 1.75; }
        .problem-content ul, .problem-content ol { padding-left: 20px; margin-bottom: 10px; }
        .problem-content li { font-size: 13px; color: var(--text-dim); line-height: 1.75; }
        .problem-content pre {
          background: #0f0f0f;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px 14px;
          font-family: var(--mono);
          font-size: 12px;
          color: #c9d1d9;
          line-height: 1.6;
          margin: 8px 0 12px;
          overflow-x: auto;
        }
        .problem-content code {
          font-family: var(--mono);
          font-size: 12px;
          background: #0f0f0f;
          padding: 1px 5px;
          border-radius: 3px;
          color: var(--accent);
        }
        .problem-content strong { color: var(--text); }
      `}</style>
    </div>
  );
}
