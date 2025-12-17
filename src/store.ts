import { create } from 'zustand';
import type { Layer, Feature, LngLat, ReportRow, FilteredFeature, SelectedAttributeRow } from './types';

interface MapState {
  // Configuration and data
  basemapKey: string;
  layers: Layer[];
  visibleLayers: Set<string>;
  
  // Feature data
  hoveredFeatures: Feature[];
  clickedFeatures: Feature[];
  luFeatures: Feature[];
  displayLuFeatures: Feature[];
  selectedLu: Feature | null;
  luPolygonFeature: Feature | null;
  marker: LngLat | null;
  markerLuName: string | null;
  selectedFeature: Feature | null;
  hoveredFeature: Feature | null;
  
  // Attribute data
  attributesPointsData: ReportRow[];
  attributesLinesData: ReportRow[];
  attributesPolygonsData: ReportRow[];
  selectedAttributeRow: SelectedAttributeRow | null;
  
  // UI states
  showBaseMaps: boolean;
  showLayers: boolean;
  showLegend: boolean;
  showAttributes: boolean;
  showLuSelect: boolean;
  showFeatureTable: boolean;
  activeInfoMode: 'points' | 'lines' | 'polygons' | null;
  showMarkerInfo: boolean;
  showMarkerAttributes: boolean;
  activeTool: 'info' | 'hover-info' | 'attributes' | 'rectangle' | 'lu-select' | null;
  theme: 'light' | 'dark';
  mouseCoords: LngLat | null;
  coordSystem: 'EPSG:4326' | 'EPSG:3857';
  currentZoom: number;
  showRectangleSelection: boolean;
  showBboxDialog: boolean;
  showReportCardDialog: boolean;
  isLuSearching: boolean;
  
  // Highlight states
  highlightedPoints: Set<string>;
  highlightedLines: Set<string>;
  highlightedPolygons: Set<string>;
  
  // Filtering
  isFiltering: boolean;
  filteredFeature: FilteredFeature | null;
  
  // Loading states
  isMapRedrawing: boolean;
  
  // Report card data
  reportCardData: {row: any, type: 'points' | 'lines' | 'polygons'} | null;
  
  // Bounding box data
  bboxData: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  } | null;
  
  // Original LU features
  originalLuFeatures: Feature[];
  
  // Actions
  setBasemapKey: (key: string) => void;
  setLayers: (layers: Layer[]) => void;
  setVisibleLayers: (visibleLayers: Set<string>) => void;
  toggleLayer: (layerName: string) => void;
  setHoveredFeatures: (features: Feature[]) => void;
  setClickedFeatures: (features: Feature[]) => void;
  setLuFeatures: (features: Feature[]) => void;
  setDisplayLuFeatures: (features: Feature[]) => void;
  setSelectedLu: (lu: Feature | null) => void;
  setLuPolygonFeature: (feature: Feature | null) => void;
  setMarker: (marker: LngLat | null) => void;
  setMarkerLuName: (name: string | null) => void;
  setSelectedFeature: (feature: Feature | null) => void;
  setHoveredFeature: (feature: Feature | null) => void;
  setAttributesPointsData: (data: ReportRow[]) => void;
  setAttributesLinesData: (data: ReportRow[]) => void;
  setAttributesPolygonsData: (data: ReportRow[]) => void;
  setSelectedAttributeRow: (row: SelectedAttributeRow | null) => void;
  setShowBaseMaps: (show: boolean) => void;
  setShowLayers: (show: boolean) => void;
  setShowLegend: (show: boolean) => void;
  setShowAttributes: (show: boolean) => void;
  setShowLuSelect: (show: boolean) => void;
  setShowFeatureTable: (show: boolean) => void;
  setActiveInfoMode: (mode: 'points' | 'lines' | 'polygons' | null) => void;
  setShowMarkerInfo: (show: boolean) => void;
  setShowMarkerAttributes: (show: boolean) => void;
  setActiveTool: (tool: 'info' | 'hover-info' | 'attributes' | 'rectangle' | 'lu-select' | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setMouseCoords: (coords: LngLat | null) => void;
  setCoordSystem: (system: 'EPSG:4326' | 'EPSG:3857') => void;
  setCurrentZoom: (zoom: number) => void;
  setShowRectangleSelection: (show: boolean) => void;
  setShowBboxDialog: (show: boolean) => void;
  setShowReportCardDialog: (show: boolean) => void;
  setIsLuSearching: (searching: boolean) => void;
  setHighlightedPoints: (ids: Set<string>) => void;
  setHighlightedLines: (ids: Set<string>) => void;
  setHighlightedPolygons: (ids: Set<string>) => void;
  toggleHighlightPoints: () => void;
  toggleHighlightLines: () => void;
  toggleHighlightPolygons: () => void;
  setIsFiltering: (filtering: boolean) => void;
  setFilteredFeature: (feature: FilteredFeature | null) => void;
  setIsMapRedrawing: (redrawing: boolean) => void;
  setReportCardData: (data: {row: any, type: 'points' | 'lines' | 'polygons'} | null) => void;
  setBboxData: (data: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  } | null) => void;
  setOriginalLuFeatures: (features: Feature[]) => void;
  clearSelectedFeatures: () => void;
  clearMapSelections: () => void;
  updateAttributesData: (features: Feature[]) => void;
  handleFilterToFeature: (
    row: ReportRow,
    type: 'points' | 'lines' | 'polygons',
  ) => void;
  handleClearFilter: (type: 'points' | 'lines' | 'polygons') => void;
  handleAttributeRowSelect: (
    row: ReportRow,
    type: 'points' | 'lines' | 'polygons',
  ) => void;
  handleLuSelect: (lu: Feature | null, showInfo?: boolean) => void;
  handleLayerToggle: (layerName: string, checked: boolean) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  basemapKey: 'osm',
  layers: [],
  visibleLayers: new Set(),
  hoveredFeatures: [],
  clickedFeatures: [],
  luFeatures: [],
  displayLuFeatures: [],
  selectedLu: null,
  luPolygonFeature: null,
  marker: null,
  markerLuName: null,
  selectedFeature: null,
  hoveredFeature: null,
  attributesPointsData: [],
  attributesLinesData: [],
  attributesPolygonsData: [],
  selectedAttributeRow: null,
  showBaseMaps: false,
  showLayers: false,
  showLegend: false,
  showAttributes: false,
  showLuSelect: false,
  showFeatureTable: false,
  activeInfoMode: null,
  showMarkerInfo: false,
  showMarkerAttributes: false,
  activeTool: null,
  theme: 'light',
  mouseCoords: null,
  coordSystem: 'EPSG:4326',
  currentZoom: 2,
  showRectangleSelection: false,
  showBboxDialog: false,
  showReportCardDialog: false,
  isLuSearching: false,
  highlightedPoints: new Set(),
  highlightedLines: new Set(),
  highlightedPolygons: new Set(),
  isFiltering: false,
  filteredFeature: null,
  isMapRedrawing: false,
  reportCardData: null,
  bboxData: null,
  originalLuFeatures: [],
  
  // Actions
  setBasemapKey: (key) => set({ basemapKey: key }),
  setLayers: (layers) => set({ layers }),
  setVisibleLayers: (visibleLayers) => set({ visibleLayers }),
  toggleLayer: (layerName) => set((state) => {
    const newSet = new Set(state.visibleLayers);
    if (newSet.has(layerName)) {
      newSet.delete(layerName);
    } else {
      newSet.add(layerName);
    }
    return { visibleLayers: newSet };
  }),
  setHoveredFeatures: (features) => set({ hoveredFeatures: features }),
  setClickedFeatures: (features) => set({ clickedFeatures: features }),
  setLuFeatures: (features) => set({ luFeatures: features }),
  setDisplayLuFeatures: (features) => set({ displayLuFeatures: features }),
  setSelectedLu: (lu) => set({ selectedLu: lu }),
  setLuPolygonFeature: (feature) => set({ luPolygonFeature: feature }),
  setMarker: (marker) => set({ marker }),
  setMarkerLuName: (name) => set({ markerLuName: name }),
  setSelectedFeature: (feature) => set({ selectedFeature: feature }),
  setHoveredFeature: (feature) => set({ hoveredFeature: feature }),
  setAttributesPointsData: (data) => set({ attributesPointsData: data }),
  setAttributesLinesData: (data) => set({ attributesLinesData: data }),
  setAttributesPolygonsData: (data) => set({ attributesPolygonsData: data }),
  setSelectedAttributeRow: (row) => set({ selectedAttributeRow: row }),
  setShowBaseMaps: (show) => set({ showBaseMaps: show }),
  setShowLayers: (show) => set({ showLayers: show }),
  setShowLegend: (show) => set({ showLegend: show }),
  setShowAttributes: (show) => set({ showAttributes: show }),
  setShowLuSelect: (show) => set({ showLuSelect: show }),
  setShowFeatureTable: (show) => set({ showFeatureTable: show }),
  setActiveInfoMode: (mode) => set({ activeInfoMode: mode }),
  setShowMarkerInfo: (show) => set({ showMarkerInfo: show }),
  setShowMarkerAttributes: (show) => set({ showMarkerAttributes: show }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setTheme: (theme) => set({ theme }),
  setMouseCoords: (coords) => set({ mouseCoords: coords }),
  setCoordSystem: (system) => set({ coordSystem: system }),
  setCurrentZoom: (zoom) => set({ currentZoom: zoom }),
  setShowRectangleSelection: (show) => set({ showRectangleSelection: show }),
  setShowBboxDialog: (show) => set({ showBboxDialog: show }),
  setShowReportCardDialog: (show) => set({ showReportCardDialog: show }),
  setIsLuSearching: (searching) => set({ isLuSearching: searching }),
  setHighlightedPoints: (ids) => set({ highlightedPoints: ids }),
  setHighlightedLines: (ids) => set({ highlightedLines: ids }),
  setHighlightedPolygons: (ids) => set({ highlightedPolygons: ids }),
  toggleHighlightPoints: () => set((state) => {
    if (state.highlightedPoints.size > 0) {
      return { highlightedPoints: new Set() };
    } else {
      const ids = new Set<string>(
        state.attributesPointsData
          .map((item) => item.id)
          .filter((v): v is string | number => v != null)
          .map((v) => v.toString()),
      );
      return { highlightedPoints: ids };
    }
  }),
  toggleHighlightLines: () => set((state) => {
    if (state.highlightedLines.size > 0) {
      return { highlightedLines: new Set() };
    } else {
      const ids = new Set<string>(
        state.attributesLinesData
          .map((item) => item.id)
          .filter((v): v is string | number => v != null)
          .map((v) => v.toString()),
      );
      return { highlightedLines: ids };
    }
  }),
  toggleHighlightPolygons: () => set((state) => {
    if (state.highlightedPolygons.size > 0) {
      return { highlightedPolygons: new Set() };
    } else {
      const ids = new Set<string>(
        state.attributesPolygonsData
          .map((item) => item.id)
          .filter((v): v is string | number => v != null)
          .map((v) => v.toString()),
      );
      return { highlightedPolygons: ids };
    }
  }),
  setIsFiltering: (filtering) => set({ isFiltering: filtering }),
  setFilteredFeature: (feature) => set({ filteredFeature: feature }),
  setIsMapRedrawing: (redrawing) => set({ isMapRedrawing: redrawing }),
  setReportCardData: (data) => set({ reportCardData: data }),
  setBboxData: (data) => set({ bboxData: data }),
  setOriginalLuFeatures: (features) => set({ originalLuFeatures: features }),
  
  // Complex actions
  clearSelectedFeatures: () => set({
    selectedFeature: null,
    hoveredFeature: null,
    selectedAttributeRow: null,
    highlightedPoints: new Set(),
    highlightedLines: new Set(),
    highlightedPolygons: new Set(),
  }),
  
  clearMapSelections: () => set({
    selectedFeature: null,
    hoveredFeature: null,
    highlightedPoints: new Set(),
    highlightedLines: new Set(),
    highlightedPolygons: new Set(),
  }),
  
  updateAttributesData: (features) => {
    const points: ReportRow[] = [];
    const lines: ReportRow[] = [];
    const polygons: ReportRow[] = [];

    features.forEach((feature) => {
      const type = feature.layer.id.split(".")[1];
      if (type === "stp") {
        points.push(feature.properties);
      } else if (type === "stl") {
        lines.push(feature.properties);
      } else if (type === "sta") {
        polygons.push(feature.properties);
      }
    });

    set({
      attributesPointsData: points,
      attributesLinesData: lines,
      attributesPolygonsData: polygons
    });
  },
  
  handleFilterToFeature: (row, type) => {
    set({ isFiltering: true, filteredFeature: { row, type } });
    
    // Ensure layer is visible
    const layerName = type === 'points' ? 'stp' : type === 'lines' ? 'stl' : 'sta';
    const state = get();
    const newVisibleLayers = new Set(state.visibleLayers);
    newVisibleLayers.add(layerName);
    
    set({ visibleLayers: newVisibleLayers });
  },
  
  handleClearFilter: (type) => {
    set({ 
      isFiltering: false, 
      filteredFeature: null 
    });
    
    // Restore all layers
    const allLayers = ["field", "lu", "sta", "stl", "stp"];
    set({ visibleLayers: new Set(allLayers) });
  },
  
  handleAttributeRowSelect: (row, type) => {
    const state = get();
    if (
      state.selectedAttributeRow &&
      state.selectedAttributeRow.data.id === row.id &&
      state.selectedAttributeRow.type === type
    ) {
      // Deselect if clicking the same row
      set({ 
        selectedAttributeRow: null,
        selectedFeature: null 
      });
    } else {
      set({ 
        selectedAttributeRow: { data: row, type },
        selectedFeature: null 
      });
      
      // Ensure layer is visible for highlighting
      const layerName = type === 'points' ? 'stp' : type === 'lines' ? 'stl' : 'sta';
      const newVisibleLayers = new Set(state.visibleLayers);
      newVisibleLayers.add(layerName);
      
      set({ visibleLayers: newVisibleLayers });
    }
  },
  
  handleLuSelect: (lu, showInfo = true) => {
    if (lu) {
      const state = get();
      // Check if this is a marker placement action (same LU selected)
      if (state.selectedLu && state.selectedLu.properties.id === lu.properties.id) {
        // Place marker at the center of the LU
        const geometry = lu.geometry;
        let centerLngLat: LngLat | null = null;
        
        // Calculate center based on geometry type
        if (geometry.type === 'Point') {
          centerLngLat = { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
        } else {
          // For polygons and other geometries, calculate bbox and use center
          const bboxCalc = (feature: any) => {
            // Simple bbox calculation - in real implementation would use Turf.js
            if (geometry.type === 'Polygon') {
              const coords = geometry.coordinates[0];
              let minLng = Infinity, maxLng = -Infinity;
              let minLat = Infinity, maxLat = -Infinity;
              
              coords.forEach(([lng, lat]) => {
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
              });
              
              return [minLng, minLat, maxLng, maxLat];
            }
            return [0, 0, 0, 0]; // fallback
          };
          
          const [minLng, minLat, maxLng, maxLat] = bboxCalc({ type: 'Feature', properties: {}, geometry });
          centerLngLat = {
            lng: (minLng + maxLng) / 2,
            lat: (minLat + maxLat) / 2
          };
        }
        
        if (centerLngLat) {
          set({ 
            marker: centerLngLat,
            markerLuName: lu.properties.name_rus || lu.properties.name || `Участок ${lu.properties.id}`,
            // Only show marker info if explicitly requested (default is true)
            showMarkerInfo: showInfo,
            activeTool: showInfo ? 'info' : null
          });
        }
      } else {
        // Different LU selected - reset marker and set new LU
        set({
          marker: null,
          selectedLu: lu,
          selectedAttributeRow: null,
          // Clear previous attribute data before loading new data
          attributesPolygonsData: [],
          attributesLinesData: [],
          attributesPointsData: [],
        });
      }
    } else {
      // Deselect LU
      set({
        selectedLu: null,
        marker: null,
        markerLuName: null,
        attributesPolygonsData: [],
        attributesLinesData: [],
        attributesPointsData: [],
        luPolygonFeature: null,
      });
    }
  },
  
  handleLayerToggle: (layerName, checked) => set((state) => {
    const newSet = new Set(state.visibleLayers);
    if (checked) {
      newSet.add(layerName);
    } else {
      newSet.delete(layerName);
    }
    return { visibleLayers: newSet };
  }),
}));
