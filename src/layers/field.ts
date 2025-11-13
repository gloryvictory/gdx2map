import type { VectorSourceSpecification, FillLayerSpecification } from 'maplibre-gl';
import { TILE_SERVER_URL } from '../config';

export const layer_name_field: string = 'field';

export const fieldSource: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`${TILE_SERVER_URL}/gdx2.field/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const fieldLayer: FillLayerSpecification = {
  id: `gdx2.field`,
  type: 'fill',
  source: `gdx2.field`,
  'source-layer': `gdx2.field`,
  paint: {
    'fill-color': '#693502',
    'fill-opacity': 0.2,
  },
};
