import type { VectorSourceSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { TILE_SERVER_URL } from '../config';

export const layer_name_lu: string = 'lu';

export const luSource: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`${TILE_SERVER_URL}/gdx2.lu/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const luLayer: LineLayerSpecification = {
  id: `gdx2.lu`,
  type: 'line',
  source: `gdx2.lu`,
  'source-layer': `gdx2.lu`,
  paint: {
    'line-color': '#0a0171',
    'line-width': 2,
  },
};

export const lu_labels_Layer: SymbolLayerSpecification = {
  id: 'lu-labels',
  type: 'symbol',
  source: `gdx2.lu`,
  'source-layer': `gdx2.lu`,
  layout: {
    'text-field': ['get', 'name_rus'],
    'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
    'text-radial-offset': 0.5,
    'text-justify': 'auto',
  },
};
