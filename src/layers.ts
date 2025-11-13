import type {
  VectorSourceSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import { TILE_SERVER_URL } from './config';

type LayerSpecWithSource =
  | FillLayerSpecification
  | LineLayerSpecification
  | CircleLayerSpecification
  | SymbolLayerSpecification;

interface LayerConfig {
  source: VectorSourceSpecification;
  layer: LayerSpecWithSource;
}

const DB_NAME = 'gdx2';

export const layer_name_field: string = 'field';
export const fieldSource: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`${TILE_SERVER_URL}/gdx2.${layer_name_field}/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const fieldLayer: FillLayerSpecification = {
  id: `${DB_NAME}.${layer_name_field}`,
  type: 'fill',
  source: `${DB_NAME}.${layer_name_field}`,
  'source-layer': `${DB_NAME}.${layer_name_field}`,
  paint: {
    'fill-color': '#693502',
    'fill-opacity': 0.2,
  },
};

export const layer_name_lu: string = 'lu';
export const luSource: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`${TILE_SERVER_URL}/gdx2.${layer_name_lu}/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const luLayer: FillLayerSpecification = {
  id: `${DB_NAME}.${layer_name_lu}`,
  type: 'fill',
  source: `${DB_NAME}.${layer_name_lu}`,
  'source-layer': `${DB_NAME}.${layer_name_lu}`,
  paint: {
    'fill-color': '#0a0171',
    'fill-opacity': 0.2,
  },
};

export const lu_labels_Layer: SymbolLayerSpecification = {
  id: 'lu-labels',
  type: 'symbol',
  source: `${DB_NAME}.${layer_name_lu}`,
  'source-layer': `${DB_NAME}.${layer_name_lu}`,
  layout: {
    'text-field': ['get', 'name_rus'],
    'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
    'text-radial-offset': 0.5,
    'text-justify': 'auto',
    'text-size': 12,
  },
  paint: {
    'text-color': '#000000',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1,
  },
  // Note: glyphs property should be set in the map style, not in the layer
};

export const layer_name_sta: string = 'sta';
export const sta_Source: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`${TILE_SERVER_URL}/gdx2.${layer_name_sta}/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const sta_Layer: FillLayerSpecification = {
  id: `${DB_NAME}.${layer_name_sta}`,
  type: 'fill',
  source: `${DB_NAME}.${layer_name_sta}`,
  'source-layer': `${DB_NAME}.${layer_name_sta}`,
  paint: {
    'fill-color': '#EFCDB8',
    'fill-outline-color': '#CD9575',
    'fill-opacity': 0.6,
  },
};

export const layer_name_stl: string = 'stl';
export const stl_Source: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`${TILE_SERVER_URL}/gdx2.${layer_name_stl}/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const stl_Layer: LineLayerSpecification = {
  id: `${DB_NAME}.${layer_name_stl}`,
  source: `${DB_NAME}.${layer_name_stl}`,
  'source-layer': `${DB_NAME}.${layer_name_stl}`,
  type: 'line',
  paint: { 'line-color': '#198EC8' },
};

export const layer_name_stp: string = 'stp';
export const stp_Source: VectorSourceSpecification = {
  type: 'vector',
  tiles: [`${TILE_SERVER_URL}/gdx2.${layer_name_stp}/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 22,
};

export const stp_Layer: CircleLayerSpecification = {
  id: `${DB_NAME}.${layer_name_stp}`,
  source: `${DB_NAME}.${layer_name_stp}`,
  'source-layer': `${DB_NAME}.${layer_name_stp}`,
  type: 'circle',
  paint: {
    'circle-color': 'blue',
    'circle-radius': 4,
  },
};

export const layersConfig: Record<string, LayerConfig> = {
  field: { source: fieldSource, layer: fieldLayer },
  lu: { source: luSource, layer: luLayer },
  // lu_labels: { source: luSource, layer: lu_labels_Layer }, // Removed due to glyphs requirement
  sta: { source: sta_Source, layer: sta_Layer },
  stl: { source: stl_Source, layer: stl_Layer },
  stp: { source: stp_Source, layer: stp_Layer },
};
