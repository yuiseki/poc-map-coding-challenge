import Editor, { loader } from '@monaco-editor/react';

// Load Monaco from CDN to avoid Vite worker config
loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' },
});

type Props = {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  isRunning: boolean;
};

export function EditorPanel({ value, onChange, onRun, isRunning }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#1e1e1e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        height: 40,
        background: 'var(--panel)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 12,
          padding: '3px 12px',
          background: '#1e1e1e',
          borderRadius: '4px 4px 0 0',
          color: 'var(--text)',
        }}>
          index.js
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={onRun}
            disabled={isRunning}
            style={{
              padding: '5px 16px',
              background: isRunning ? '#3a3a3a' : 'var(--accent)',
              color: isRunning ? 'var(--text-dim)' : '#000',
              border: 'none',
              borderRadius: 4,
              cursor: isRunning ? 'default' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              transition: 'opacity 0.15s',
            }}
          >
            {isRunning ? '実行中...' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={value}
          onChange={(v) => onChange(v ?? '')}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 },
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
