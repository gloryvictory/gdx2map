import type { VectorSourceSpecification, CircleLayerSpecification } from 'maplibre-gl';

export const layer_name_stp: string = 'stp';

export const stp_Source: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`http://r48-vgeohub01.zsniigg.local:7800/gdx2.stp/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const stp_Layer: CircleLayerSpecification = {
  id: `gdx2.stp`,
  source: `gdx2.stp`,
  'source-layer': `gdx2.stp`,
  type: 'circle',
  paint: {
    'circle-color': 'blue',
    'circle-radius': 4,
  },
};
