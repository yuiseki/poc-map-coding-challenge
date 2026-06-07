import type { Map as MaplibreMap } from 'maplibre-gl';

export type Difficulty = 'Tutorial' | 'Easy' | 'Medium' | 'Hard';

export type TestCase = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (fn: (...args: any[]) => any) => void;
};

export type TestResult = {
  name: string;
  pass: boolean;
  error: string | null;
};

export type Challenge = {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string; // HTML string
  starterCode: string;
  functionName: string;
  /** TypeScript declarations injected into Monaco for live type checking */
  typeDeclarations: string;
  tests: TestCase[];
  setupMap: (map: MaplibreMap, userFn: ((...args: unknown[]) => unknown) | null, revealedCount: number) => void;
  mapOptions: { center: [number, number]; zoom: number };
};
