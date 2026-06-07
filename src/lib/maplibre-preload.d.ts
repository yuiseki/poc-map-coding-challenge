import type { Map } from 'maplibre-gl';

interface MaplibrePreloadOptions {
  progressCallback?: (info: unknown) => void;
  async?: boolean;
  burstLimit?: number;
  useTile?: boolean;
}

export declare class MaplibrePreload {
  constructor(map: Map, options?: MaplibrePreloadOptions);
}
