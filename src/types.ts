// Shared project types

import type { MapGeoJSONFeature } from 'maplibre-gl';

// Base map styles and entries
export interface MapStyleSource {
  readonly type: string;
  readonly tiles?: readonly string[];
  readonly tileSize?: number;
  readonly attribution?: string;
  readonly [key: string]: unknown;
}

export interface MapStyleLayer {
  readonly id: string;
  readonly type: string;
  readonly source: string;
  readonly paint?: Readonly<Record<string, unknown>>;
  readonly layout?: Readonly<Record<string, unknown>>;
  readonly filter?: unknown;
}

export interface MapStyle {
  readonly version: number;
  readonly sources: Readonly<Record<string, Readonly<MapStyleSource>>>;
  readonly layers: ReadonlyArray<Readonly<MapStyleLayer>>;
  readonly glyphs?: string;
}

export interface BasemapEntry {
  key: string;
  label: string;
  url: string | MapStyle | null;
}

// Services.json typings
export type TmsType = 'xyz' | 'quadkey';

export interface TmsLevel {
  min: number;
  max: number;
}

export interface TmsEntry {
  name: string;
  title?: string;
  description?: string;
  type: TmsType;
  url: string;
  level?: TmsLevel;
  liveTime?: number;
  cs?: string;
}

export interface ServiceCategory {
  name: string;
  image?: string;
  tms?: TmsEntry[];
}

export interface ServiceCatalog {
  services?: {
    category?: ServiceCategory[];
  };
}

// Tiles layer model fetched from backend
export interface Layer {
  name: string;
  title: string;
  description: string;
  type: string;
  url: string;
  level: { min: number; max: number };
}

// Feature/attributes data models
export interface ReportRow {
  avts?: string;
  name_otch?: string;
  org_isp?: string;
  god_nach?: number | string;
  god_end?: number | string;
  method?: string;
  nom_1000?: string;
  scale?: string | number;
  tgf?: string;
  in_n_rosg?: string;
  in_n_tgf?: string;
  n_uk_rosg?: string;
  n_uk_tgf?: string;
  web_uk_id?: string | number;
  vid_iz?: string;
  id?: string | number;
  name_otch1?: string;
  // Allow unknown extra properties from server
  [key: string]: unknown;
}

export type GeometryKind = 'points' | 'lines' | 'polygons';

export interface SelectedAttributeRow {
  data: ReportRow;
  type: GeometryKind;
}

export interface FilteredFeature {
  row: ReportRow;
  type: GeometryKind;
}

export type Feature = MapGeoJSONFeature;

export interface LngLat {
  lng: number;
  lat: number;
}

export type BBox = [[number, number], [number, number]];
export type BBoxPx = [number, number, number, number];


