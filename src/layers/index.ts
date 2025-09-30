import type { VectorSourceSpecification, FillLayerSpecification, LineLayerSpecification, CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';

type LayerSpecWithSource =
  | FillLayerSpecification
  | LineLayerSpecification
  | CircleLayerSpecification
  | SymbolLayerSpecification;

interface LayerConfig {
  source: VectorSourceSpecification;
  layer: LayerSpecWithSource;
}

import { fieldSource, fieldLayer } from './field';
import { luSource, luLayer, lu_labels_Layer } from './lu';
import { sta_Source, sta_Layer } from './sta';
import { stl_Source, stl_Layer } from './stl';
import { stp_Source, stp_Layer } from './stp';

export const layersConfig: Record<string, LayerConfig> = {
  field: { source: fieldSource, layer: fieldLayer },
  lu: { source: luSource, layer: luLayer },
  lu_labels: { source: luSource, layer: lu_labels_Layer },
  sta: { source: sta_Source, layer: sta_Layer },
  stl: { source: stl_Source, layer: stl_Layer },
  stp: { source: stp_Source, layer: stp_Layer },
};
