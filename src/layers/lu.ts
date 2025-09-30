import type { VectorSourceSpecification, FillLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';

export const layer_name_lu: string = 'lu';

export const luSource: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`http://r48-vgeohub01.zsniigg.local:7800/gdx2.lu/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const luLayer: FillLayerSpecification = {
  id: `gdx2.lu`,
  type: 'fill',
  source: `gdx2.lu`,
  'source-layer': `gdx2.lu`,
  paint: {
    'fill-color': '#0a0171',
    'fill-opacity': 0.2,
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
