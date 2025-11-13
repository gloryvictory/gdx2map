import type { VectorSourceSpecification, LineLayerSpecification } from 'maplibre-gl';
import { TILE_SERVER_URL } from '../config';

export const layer_name_stl: string = 'stl';

export const stl_Source: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`${TILE_SERVER_URL}/gdx2.stl/{z}/{x}/{y}.pbf`],
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
