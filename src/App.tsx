import { useState, useRef, useCallback } from 'react';
import { challenges } from './challenges';
import type { TestResult } from './challenges/types';
import { REVEAL_DELAY_MS } from './challenges/constants';
import { Sidebar } from './components/Sidebar';
import { ProblemPanel } from './components/ProblemPanel';
import { EditorPanel } from './components/EditorPanel';
import { MapPanel } from './components/MapPanel';

type CodeMap = Record<string, string>;

const LS_KEY = 'map-coding-challenge:codes';

function loadCodes(): CodeMap {
  const defaults = Object.fromEntries(challenges.map((c) => [c.id, c.starterCode]));
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<CodeMap>;
    const merged = { ...defaults };
    for (const id of Object.keys(defaults)) {
      if (saved[id]) merged[id] = saved[id]!;
    }
    return merged;
  } catch {
    return defaults;
  }
}

function saveCodes(codes: CodeMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(codes));
}

export function App() {
  const [currentId, setCurrentId] = useState(challenges[0].id);
  const [codes, setCodes] = useState<CodeMap>(loadCodes);
  const [allResults, setAllResults] = useState<Record<string, TestResult[]>>({});
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState(Infinity);
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
    setRevealedCount(0);

    setTimeout(() => {
      const code = codeRef.current[currentId] ?? '';

      // Capture console.log during execution
      const logs: string[] = [];
      const origLog = console.log;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log = (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
        origLog(...args);
      };

      let fn: ((...args: unknown[]) => unknown) | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        fn = new Function(code + `\nreturn ${challenge.functionName};`)() as (...args: unknown[]) => unknown;
      } catch (e) {
        console.log = origLog;
        const msg = e instanceof Error ? e.message : String(e);
        const errorResults = challenge.tests.map((t) => ({ name: t.name, pass: false, error: `SyntaxError: ${msg}` }));
        setConsoleLogs([`SyntaxError: ${msg}`]);
        setAllResults((prev) => ({ ...prev, [currentId]: errorResults }));
        setIsRunning(false);
        setRevealedCount(0);
        animateReveal(errorResults.length);
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

      console.log = origLog;
      setConsoleLogs(logs);
      setAllResults((prev) => ({ ...prev, [currentId]: results }));
      setRunId((n) => n + 1);
      setIsRunning(false);
      animateReveal(results.length);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, challenge]);

  function animateReveal(total: number) {
    for (let i = 0; i < total; i++) {
      setTimeout(() => setRevealedCount(i + 1), (i + 1) * REVEAL_DELAY_MS);
    }
  }

  const handleSelectChallenge = (id: string) => {
    setCurrentId(id);
    setRevealedCount(Infinity);
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
              onChange={(v) => setCodes((prev) => {
                const next = { ...prev, [currentId]: v };
                saveCodes(next);
                return next;
              })}
              onRun={handleRun}
              isRunning={isRunning}
            />
          </div>
          <div style={{ flex: '0 0 50%', display: 'flex', overflow: 'hidden' }}>
            <MapPanel
              challenge={challenge}
              testResults={allResults[currentId] ?? null}
              consoleLogs={consoleLogs}
              revealedCount={revealedCount}
              runId={runId}
              getUserFn={getUserFn}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
