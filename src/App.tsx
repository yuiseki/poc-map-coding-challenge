import { useState, useRef, useCallback } from 'react';
import { challenges } from './challenges';
import type { TestResult } from './challenges/types';
import { Sidebar } from './components/Sidebar';
import { ProblemPanel } from './components/ProblemPanel';
import { EditorPanel } from './components/EditorPanel';
import { MapPanel } from './components/MapPanel';

type CodeMap = Record<string, string>;

export function App() {
  const [currentId, setCurrentId] = useState(challenges[0].id);
  const [codes, setCodes] = useState<CodeMap>(() =>
    Object.fromEntries(challenges.map((c) => [c.id, c.starterCode]))
  );
  const [allResults, setAllResults] = useState<Record<string, TestResult[]>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState(0);
  const codeRef = useRef(codes);
  codeRef.current = codes;

  const challenge = challenges.find((c) => c.id === currentId)!;

  const getUserFn = useCallback(() => {
    const code = codeRef.current[currentId] ?? '';
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      return new Function(code + `\nreturn ${challenge.functionName};`)() as (...args: unknown[]) => unknown;
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, challenge.functionName]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const code = codeRef.current[currentId] ?? '';
      let fn: ((...args: unknown[]) => unknown) | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        fn = new Function(code + `\nreturn ${challenge.functionName};`)() as (...args: unknown[]) => unknown;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setAllResults((prev) => ({
          ...prev,
          [currentId]: challenge.tests.map((t) => ({ name: t.name, pass: false, error: `SyntaxError: ${msg}` })),
        }));
        setIsRunning(false);
        return;
      }

      const results: TestResult[] = challenge.tests.map((t) => {
        try {
          t.run(fn!);
          return { name: t.name, pass: true, error: null };
        } catch (e) {
          return { name: t.name, pass: false, error: e instanceof Error ? e.message : String(e) };
        }
      });

      setAllResults((prev) => ({ ...prev, [currentId]: results }));
      setRunId((n) => n + 1);
      setIsRunning(false);
    }, 0);
  }, [currentId, challenge]);

  const handleSelectChallenge = (id: string) => {
    setCurrentId(id);
    setRunId((n) => n + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top bar */}
      <div style={{
        height: 48,
        background: 'var(--panel)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
        zIndex: 20,
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>🗺️ Map Coding Challenge</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Day {challenge.id}: {challenge.title}
        </span>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          challenges={challenges}
          currentId={currentId}
          results={allResults}
          onSelect={handleSelectChallenge}
        />

        <ProblemPanel challenge={challenge} />

        {/* Right: Editor (top) + Map (bottom) */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
            <EditorPanel
              value={codes[currentId] ?? ''}
              onChange={(v) => setCodes((prev) => ({ ...prev, [currentId]: v }))}
              onRun={handleRun}
              isRunning={isRunning}
            />
          </div>
          <div style={{ flex: '0 0 50%', display: 'flex', overflow: 'hidden' }}>
            <MapPanel
              challenge={challenge}
              testResults={allResults[currentId] ?? null}
              runId={runId}
              getUserFn={getUserFn}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
