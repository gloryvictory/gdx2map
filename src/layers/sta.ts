import type { VectorSourceSpecification, FillLayerSpecification } from 'maplibre-gl';

export const layer_name_sta: string = 'sta';

export const sta_Source: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`http://r48-vgeohub01.zsniigg.local:7800/gdx2.sta/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const sta_Layer: FillLayerSpecification = {
  id: `gdx2.sta`,
  type: 'fill',
  source: `gdx2.sta`,
  'source-layer': `gdx2.sta`,
  paint: {
    'fill-color': '#EFCDB8',
    'fill-outline-color': '#CD9575',
    'fill-opacity': 0.6,
  },
};
