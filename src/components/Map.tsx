import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibre from 'maplibre-gl';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import ReactMapGL, {
  type MapRef,
  Marker,
  NavigationControl,
  type ViewState,
} from 'react-map-gl/maplibre';
import { layersConfig } from '../layers';
type Layer = {
  name: string;
  title: string;
  description: string;
  type: string;
  url: string;
  level: { min: number; max: number };
};

export const MapView = forwardRef<any, {
  styleUrl: string | object | null;
  visibleLayers: Set<string>;
  layers: Layer[];
  onFeaturesHover: (features: any[]) => void;
  enableHover: boolean;
  infoMode: 'points' | 'lines' | 'polygons' | null;
  onClick: (features: any[], lngLat: {lng: number, lat: number}) => void;
  marker: {lng: number, lat: number} | null;
  onMouseMoveCoords: (coords: {lng: number, lat: number} | null) => void;
  highlightedPoints: Set<string>;
  highlightedLines: Set<string>;
  highlightedPolygons: Set<string>;
  onZoomChange: (zoom: number) => void;
  selectedFeature: any;
  hoveredFeature: any;
  selectedAttributeRow: any;
}>(({
  styleUrl,
  visibleLayers,
  layers,
  onFeaturesHover,
  enableHover,
  infoMode,
  onClick,
  marker,
  onMouseMoveCoords,
  highlightedPoints,
  highlightedLines,
  highlightedPolygons,
  onZoomChange,
  selectedFeature,
  hoveredFeature,
  selectedAttributeRow
}, ref) => {
  const targetLayerNames = ['stp', 'stl', 'sta'];
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current?.getMap()
  }));
  const [viewState, setViewState] = useState<any>({
    longitude: 77,
    latitude: 76,
    zoom: 2,
    bearing: 0,
    pitch: 0,
  });

  const onMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
    onZoomChange(evt.viewState.zoom);
  }, [onZoomChange]);

  const onMouseMove = useCallback((evt: any) => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Update mouse coordinates
    onMouseMoveCoords({ lng: evt.lngLat.lng, lat: evt.lngLat.lat });

    let filteredTargetNames = targetLayerNames;
    if (infoMode === 'points') {
      filteredTargetNames = ['stp'];
    } else if (infoMode === 'lines') {
      filteredTargetNames = ['stl'];
    } else if (infoMode === 'polygons') {
      filteredTargetNames = ['sta'];
    }

    const visibleTargetLayers = filteredTargetNames
      .filter(name => visibleLayers.has(name))
      .map(name => `gdx2.${name}`);

    if (visibleTargetLayers.length === 0) {
      if (enableHover) onFeaturesHover([]);
      map.getCanvas().style.cursor = '';
      return;
    }

    const features = map.queryRenderedFeatures(evt.point, {
      layers: visibleTargetLayers,
    });
    if (enableHover) onFeaturesHover(features);

    // Change cursor to pointer if features are found
    map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
  }, [mapLoaded, onFeaturesHover, visibleLayers, enableHover, infoMode, onMouseMoveCoords]);

  const onMapClick = useCallback((evt: any) => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const visibleTargetLayers = targetLayerNames
      .filter(name => visibleLayers.has(name))
      .map(name => `gdx2.${name}`);

    const features = map.queryRenderedFeatures(evt.point, {
      layers: visibleTargetLayers,
    });
    onClick(features, { lng: evt.lngLat.lng, lat: evt.lngLat.lat });
  }, [mapLoaded, visibleLayers, onClick]);

  const updateLayers = useCallback(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    console.log('Adding layers', visibleLayers);

    const allLayers = layers;

    allLayers.forEach(layer => {
      const config = layersConfig[layer.name];
      if (!config) return;

      const sourceId = config.layer.source as string;
      const layerId = config.layer.id;
      const highlightLayerId = `${layerId}-highlight`;

      if (visibleLayers.has(layer.name)) {
        // Add source if not exists
        if (!map.getSource(sourceId)) {
          console.log('Adding source', sourceId);
          map.addSource(sourceId, config.source);
        }
        // Add layer if not exists
        if (!map.getLayer(layerId)) {
          console.log('Adding layer', layerId);
          map.addLayer(config.layer);
          map.triggerRepaint();
        }
        // For lu, also add labels
        if (layer.name === 'lu') {
          const labelsConfig = layersConfig.lu_labels;
          const labelsId = labelsConfig.layer.id;
          if (!map.getLayer(labelsId)) {
            console.log('Adding layer', labelsId);
            map.addLayer(labelsConfig.layer);
            map.triggerRepaint();
          }
        }

        // Add highlight layer if there are highlighted features
        let highlightedIds: string[] = [];
        if (layer.name === 'stp' && highlightedPoints.size > 0) {
          highlightedIds = Array.from(highlightedPoints);
        } else if (layer.name === 'stl' && highlightedLines.size > 0) {
          highlightedIds = Array.from(highlightedLines);
        } else if (layer.name === 'sta' && highlightedPolygons.size > 0) {
          highlightedIds = Array.from(highlightedPolygons);
        }

        if (highlightedIds.length > 0) {
          if (!map.getLayer(highlightLayerId)) {
            const highlightLayer = { ...config.layer };
            highlightLayer.id = highlightLayerId;
            highlightLayer.filter = ['in', 'id', ...highlightedIds.map(id => parseInt(id))];
            // Modify style for highlight
            if (highlightLayer.type === 'circle') {
              highlightLayer.paint = {
                ...highlightLayer.paint,
                'circle-color': 'red',
                'circle-radius': 6,
              };
            } else if (highlightLayer.type === 'line') {
              highlightLayer.paint = {
                ...highlightLayer.paint,
                'line-color': 'red',
                'line-width': 3,
              };
            } else if (highlightLayer.type === 'fill') {
              highlightLayer.paint = {
                ...highlightLayer.paint,
                'fill-color': 'red',
                'fill-opacity': 0.8,
              };
            }
            map.addLayer(highlightLayer, layerId); // Add above the main layer
            map.triggerRepaint();
          }
        } else {
          // Remove highlight layer if no highlights
          if (map.getLayer(highlightLayerId)) {
            map.removeLayer(highlightLayerId);
          }
        }
      } else {
        // Remove layer if exists
        if (map.getLayer(layerId)) {
          console.log('Removing layer', layerId);
          map.removeLayer(layerId);
        }
        // Remove highlight layer
        if (map.getLayer(highlightLayerId)) {
          map.removeLayer(highlightLayerId);
        }
        // For lu, remove labels too
        if (layer.name === 'lu') {
          const labelsConfig = layersConfig.lu_labels;
          const labelsId = labelsConfig.layer.id;
          if (map.getLayer(labelsId)) {
            console.log('Removing layer', labelsId);
            map.removeLayer(labelsId);
          }
        }
        // Remove source if exists (only if no other layers use it)
        if (map.getSource(sourceId)) {
          // Check if any layers use this source
          const layersUsingSource = Object.values(layersConfig).filter(c => c.layer.source === sourceId);
          const activeLayers = layersUsingSource.filter(c => map.getLayer(c.layer.id));
          if (activeLayers.length === 0) {
            map.removeSource(sourceId);
          }
        }
      }
    });
  }, [mapLoaded, visibleLayers, layers, highlightedPoints, highlightedLines, highlightedPolygons]);

  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Add selected feature highlight layer
    const selectedLayerId = 'selected-feature-highlight';
    if (selectedFeature) {
      if (!map.getLayer(selectedLayerId)) {
        const layerType = selectedFeature.layer.id.split('.')[1];
        const config = layersConfig[layerType];
        if (config) {
          const selectedLayer = { ...config.layer };
          selectedLayer.id = selectedLayerId;
          selectedLayer.filter = ['==', 'id', selectedFeature.properties.id];
          // Modify style for selection
          if (selectedLayer.type === 'circle') {
            selectedLayer.paint = {
              ...selectedLayer.paint,
              'circle-color': 'yellow',
              'circle-radius': 8,
              'circle-stroke-color': 'black',
              'circle-stroke-width': 2,
            };
          } else if (selectedLayer.type === 'line') {
            selectedLayer.paint = {
              ...selectedLayer.paint,
              'line-color': 'yellow',
              'line-width': 5,
            };
          } else if (selectedLayer.type === 'fill') {
            selectedLayer.paint = {
              ...selectedLayer.paint,
              'fill-color': 'yellow',
              'fill-opacity': 0.9,
            };
          }
          map.addLayer(selectedLayer); // Add above all layers
          map.triggerRepaint();
        }
      }
    } else {
      if (map.getLayer(selectedLayerId)) {
        map.removeLayer(selectedLayerId);
      }
    }
  }, [selectedFeature, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Add hover highlight layer
    const hoverLayerId = 'hover-feature-highlight';
    if (hoveredFeature) {
      if (!map.getLayer(hoverLayerId)) {
        const layerType = hoveredFeature.layer.id.split('.')[1];
        const config = layersConfig[layerType];
        if (config) {
          const hoverLayer = { ...config.layer };
          hoverLayer.id = hoverLayerId;
          hoverLayer.filter = ['==', 'id', hoveredFeature.properties.id];
          // Modify style for hover
          if (hoverLayer.type === 'circle') {
            hoverLayer.paint = {
              ...hoverLayer.paint,
              'circle-color': 'orange',
              'circle-radius': 7,
            };
          } else if (hoverLayer.type === 'line') {
            hoverLayer.paint = {
              ...hoverLayer.paint,
              'line-color': 'orange',
              'line-width': 4,
            };
          } else if (hoverLayer.type === 'fill') {
            hoverLayer.paint = {
              ...hoverLayer.paint,
              'fill-color': 'orange',
              'fill-opacity': 0.7,
            };
          }
          map.addLayer(hoverLayer); // Add above all layers
          map.triggerRepaint();
        }
      }
    } else {
      if (map.getLayer(hoverLayerId)) {
        map.removeLayer(hoverLayerId);
      }
    }
  }, [hoveredFeature, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Add selected attribute row highlight layer
    const selectedAttributeLayerId = 'selected-attribute-highlight';
    if (selectedAttributeRow) {
      if (!map.getLayer(selectedAttributeLayerId)) {
        const layerType = selectedAttributeRow.type === 'points' ? 'stp' : selectedAttributeRow.type === 'lines' ? 'stl' : 'sta';
        const config = layersConfig[layerType];
        if (config) {
          const selectedAttributeLayer = { ...config.layer };
          selectedAttributeLayer.id = selectedAttributeLayerId;
          selectedAttributeLayer.filter = ['==', 'id', selectedAttributeRow.data.id];
          // Modify style for selection
          if (selectedAttributeLayer.type === 'circle') {
            selectedAttributeLayer.paint = {
              ...selectedAttributeLayer.paint,
              'circle-color': 'purple',
              'circle-radius': 8,
              'circle-stroke-color': 'black',
              'circle-stroke-width': 2,
            };
          } else if (selectedAttributeLayer.type === 'line') {
            selectedAttributeLayer.paint = {
              ...selectedAttributeLayer.paint,
              'line-color': 'purple',
              'line-width': 5,
            };
          } else if (selectedAttributeLayer.type === 'fill') {
            selectedAttributeLayer.paint = {
              ...selectedAttributeLayer.paint,
              'fill-color': 'purple',
              'fill-opacity': 0.9,
            };
          }
          map.addLayer(selectedAttributeLayer); // Add above all layers
          map.triggerRepaint();
        }
      }
    } else {
      if (map.getLayer(selectedAttributeLayerId)) {
        map.removeLayer(selectedAttributeLayerId);
      }
    }
  }, [selectedAttributeRow, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !selectedFeature) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Zoom to selected feature
    map.flyTo({
      center: [selectedFeature.geometry.coordinates[0], selectedFeature.geometry.coordinates[1]],
      zoom: 12,
      duration: 1000
    });
  }, [selectedFeature, mapLoaded]);

  useEffect(() => {
    updateLayers();
  }, [updateLayers, styleUrl]);

  return (
    <div
      className="relative w-full rounded-md border overflow-hidden"
      style={{ height: '100%' }}
    >
      <ReactMapGL
        ref={mapRef}
        mapLib={maplibre as any}
        reuseMaps
        mapStyle={styleUrl as any}
        {...viewState}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapLoaded(true)}
        onStyleLoad={() => updateLayers()}
        onMove={onMove}
        onMouseMove={onMouseMove}
        onMouseLeave={() => onMouseMoveCoords(null)}
        onClick={onMapClick}
      >
        <NavigationControl visualizePitch position="top-right" />
        {marker && (
          <Marker longitude={marker.lng} latitude={marker.lat}>
            <div style={{ color: 'red', fontSize: '24px' }}>📍</div>
          </Marker>
        )}
      </ReactMapGL>
    </div>
  );
});
