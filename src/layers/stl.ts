import type { VectorSourceSpecification, LineLayerSpecification } from 'maplibre-gl';

export const layer_name_stl: string = 'stl';

export const stl_Source: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`http://r48-vgeohub01.zsniigg.local:7800/gdx2.stl/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const stl_Layer: LineLayerSpecification = {
  id: `gdx2.stl`,
  source: `gdx2.stl`,
  'source-layer': `gdx2.stl`,
  type: 'line',
  paint: { 'line-color': '#198EC8' },
};
