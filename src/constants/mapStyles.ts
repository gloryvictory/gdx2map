export const LIGHT_MAP_STYLE =
  'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json';
export const DARK_MAP_STYLE =
  'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
export const VOYAGER_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export function createXyzRasterStyle(tiles: string[], attribution?: string) {
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
      },
    },
    layers: [{ id: 'raster-tiles', type: 'raster', source: 'raster-tiles' }],
  } as const;
}

const GOOGLE_SUBS = ['mt0', 'mt1', 'mt2', 'mt3'];
const googleTiles = (lyrs: string) =>
  GOOGLE_SUBS.map(
    (s) => `https://${s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`,
  );

export const GOOGLE_ROAD_STYLE = createXyzRasterStyle(
  googleTiles('m'),
  '© Google',
);
export const GOOGLE_SATELLITE_STYLE = createXyzRasterStyle(
  googleTiles('s'),
  '© Google',
);
export const GOOGLE_HYBRID_STYLE = createXyzRasterStyle(
  googleTiles('y'),
  '© Google',
);
export const GOOGLE_TERRAIN_STYLE = createXyzRasterStyle(
  googleTiles('t'),
  '© Google',
);

export const BASEMAPS = [
  { key: 'light', label: 'Light (Positron)', url: LIGHT_MAP_STYLE },
  { key: 'dark', label: 'Dark Matter', url: DARK_MAP_STYLE },
  { key: 'voyager', label: 'Voyager', url: VOYAGER_MAP_STYLE },
  { key: 'g-road', label: 'Google Road', url: GOOGLE_ROAD_STYLE },
  { key: 'g-sat', label: 'Google Satellite', url: GOOGLE_SATELLITE_STYLE },
  { key: 'g-hybrid', label: 'Google Hybrid', url: GOOGLE_HYBRID_STYLE },
  { key: 'g-terrain', label: 'Google Terrain', url: GOOGLE_TERRAIN_STYLE },
] as const;

export type BasemapKey = (typeof BASEMAPS)[number]['key'];
