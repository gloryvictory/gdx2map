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
import type { Layer, Feature, LngLat, BBox, SelectedAttributeRow, FilteredFeature } from '../types';

export const MapView = forwardRef<any, {
  styleUrl: string | object | null;
  visibleLayers: Set<string>;
  layers: Layer[];
  onFeaturesHover: (features: Feature[]) => void;
  enableHover: boolean;
  infoMode: 'points' | 'lines' | 'polygons' | null;
  onClick: (features: Feature[], lngLat: LngLat) => void;
  marker: LngLat | null;
  onMouseMoveCoords: (coords: LngLat | null) => void;
  highlightedPoints: Set<string>;
  highlightedLines: Set<string>;
  highlightedPolygons: Set<string>;
  onZoomChange: (zoom: number) => void;
  selectedFeature: Feature | null;
  hoveredFeature: Feature | null;
  selectedAttributeRow: SelectedAttributeRow | null;
  onRedrawStart?: () => void;
  onRedrawEnd?: () => void;
  filteredFeature?: FilteredFeature | null;
  rectangleSelection?: boolean;
  onRectangleSelect?: (bounds: BBox) => void;
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
  selectedAttributeRow,
  onRedrawStart,
  onRedrawEnd,
  filteredFeature,
  rectangleSelection,
  onRectangleSelect
}, ref) => {
  const targetLayerNames = ['stp', 'stl', 'sta'];
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [rectangleStart, setRectangleStart] = useState<{lng: number, lat: number} | null>(null);
  const [rectangleCurrent, setRectangleCurrent] = useState<{lng: number, lat: number} | null>(null);

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
    const currentLngLat = { lng: evt.lngLat.lng, lat: evt.lngLat.lat };
    onMouseMoveCoords(currentLngLat);

    // Update rectangle current point while selecting
    if (rectangleSelection && rectangleStart) {
      setRectangleCurrent(currentLngLat);
    }

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
      if (!rectangleSelection) {
        map.getCanvas().style.cursor = '';
      }
      return;
    }

    const features = map.queryRenderedFeatures(evt.point, {
      layers: visibleTargetLayers,
    }) as unknown as Feature[];
    if (enableHover) onFeaturesHover(features);
    if (!rectangleSelection) {
      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    }
  }, [mapLoaded, onFeaturesHover, visibleLayers, enableHover, infoMode, onMouseMoveCoords, rectangleSelection, rectangleStart]);

  const onMapClick = useCallback((evt: any) => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Handle rectangle selection
    if (rectangleSelection) {
      if (!rectangleStart) {
        // Start rectangle selection
        setRectangleStart({ lng: evt.lngLat.lng, lat: evt.lngLat.lat });
        console.log('Rectangle selection started at:', evt.lngLat);
      } else {
        // Complete rectangle selection
        const bounds: [[number, number], [number, number]] = [
          [Math.min(rectangleStart.lng, evt.lngLat.lng), Math.min(rectangleStart.lat, evt.lngLat.lat)],
          [Math.max(rectangleStart.lng, evt.lngLat.lng), Math.max(rectangleStart.lat, evt.lngLat.lat)]
        ];
        console.log('Rectangle selection completed with bounds:', bounds);
        onRectangleSelect?.(bounds);
        setRectangleStart(null);
        setRectangleCurrent(null);
      }
      return;
    }

    const visibleTargetLayers = targetLayerNames
      .filter(name => visibleLayers.has(name))
      .map(name => `gdx2.${name}`);

    const features = map.queryRenderedFeatures(evt.point, {
      layers: visibleTargetLayers,
    }) as unknown as Feature[];
    onClick(features, { lng: evt.lngLat.lng, lat: evt.lngLat.lat });
  }, [mapLoaded, visibleLayers, onClick, rectangleSelection, rectangleStart, onRectangleSelect]);

  const updateLayers = useCallback(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    onRedrawStart?.();
    // console.log('Adding layers', visibleLayers);

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
          // console.log('Adding source', sourceId);
          map.addSource(sourceId, config.source);
        }
        // Add layer if not exists
        if (!map.getLayer(layerId)) {
          // console.log('Adding layer', layerId);
          map.addLayer(config.layer);
          map.triggerRepaint();
        }
        // For lu, also add labels (removed - lu_labels requires glyphs)
        // if (layer.name === 'lu') {
        //   const labelsConfig = layersConfig.lu_labels;
        //   const labelsId = labelsConfig.layer.id;
        //   if (!map.getLayer(labelsId)) {
        //     console.log('Adding layer', labelsId);
        //     map.addLayer(labelsConfig.layer);
        //     map.triggerRepaint();
        //   }
        // }

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
        // For lu, remove labels too (removed - lu_labels no longer exists)
        // if (layer.name === 'lu') {
        //   const labelsConfig = layersConfig.lu_labels;
        //   const labelsId = labelsConfig.layer.id;
        //   if (map.getLayer(labelsId)) {
        //     console.log('Removing layer', labelsId);
        //     map.removeLayer(labelsId);
        //   }
        // }
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

    // End redraw after a short delay to allow rendering
    setTimeout(() => {
      onRedrawEnd?.();
    }, 100);
  }, [mapLoaded, visibleLayers, layers, highlightedPoints, highlightedLines, highlightedPolygons, onRedrawStart, onRedrawEnd]);

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
          selectedAttributeLayer.filter = ['==', 'id', selectedAttributeRow.data.id] as any;
          // Modify style for selection
          if (selectedAttributeLayer.type === 'circle') {
            selectedAttributeLayer.paint = {
              ...selectedAttributeLayer.paint,
              'circle-color': 'red',
              'circle-radius': 8,
              'circle-stroke-color': 'black',
              'circle-stroke-width': 2,
            };
          } else if (selectedAttributeLayer.type === 'line') {
            selectedAttributeLayer.paint = {
              ...selectedAttributeLayer.paint,
              'line-color': 'red',
              'line-width': 5,
            };
          } else if (selectedAttributeLayer.type === 'fill') {
            selectedAttributeLayer.paint = {
              ...selectedAttributeLayer.paint,
              'fill-color': 'red',
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
    const coords = (selectedFeature.geometry as any).coordinates as [number, number];
    map.flyTo({
      center: [coords[0], coords[1]],
      zoom: 12,
      duration: 1000
    });
  }, [selectedFeature, mapLoaded]);

  useEffect(() => {
    updateLayers();
  }, [updateLayers, styleUrl]);

  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Handle filtered feature
    if (filteredFeature) {
      const layerType = filteredFeature.type === 'points' ? 'stp' : filteredFeature.type === 'lines' ? 'stl' : 'sta';
      const layerName = `gdx2.${layerType}`;

      // Hide all other layers
      const allLayerNames = ['gdx2.stp', 'gdx2.stl', 'gdx2.sta', 'gdx2.lu', 'gdx2.field'];
      allLayerNames.forEach(name => {
        if (map.getLayer(name)) {
          map.setLayoutProperty(name, 'visibility', name === layerName ? 'visible' : 'none');
        }
      });

      // Apply filter to show only the selected feature using == filter
      if (map.getLayer(layerName)) {
        map.setFilter(layerName, ['==', 'id', filteredFeature.row.id] as any);
        map.triggerRepaint();
      }
    } else {
      // Clear filter and show all layers
      const allLayerNames = ['gdx2.stp', 'gdx2.stl', 'gdx2.sta', 'gdx2.lu', 'gdx2.field'];
      allLayerNames.forEach(layerName => {
        if (map.getLayer(layerName)) {
          map.setLayoutProperty(layerName, 'visibility', 'visible');
          map.setFilter(layerName, null);
        }
      });
      map.triggerRepaint();
    }
  }, [filteredFeature, mapLoaded]);

  // Handle cursor style: arrow for rectangle selection, otherwise allow hover logic to set pointer
  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (rectangleSelection) {
      map.getCanvas().style.cursor = 'default'; // arrow
    } else {
      map.getCanvas().style.cursor = '';
    }
  }, [rectangleSelection, mapLoaded]);

  // Clear local rectangle state when tool is turned off
  useEffect(() => {
    if (!rectangleSelection) {
      setRectangleStart(null);
      setRectangleCurrent(null);
    }
  }, [rectangleSelection]);

  return (
    <div
      className="relative w-full h-full rounded-md border overflow-hidden"
    >
      <ReactMapGL
        ref={mapRef}
        mapLib={maplibre as any}
        reuseMaps
        mapStyle={styleUrl as any}
        {...viewState}
        className="w-full h-full"
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
            <div className="map-marker-emoji">📍</div>
          </Marker>
        )}
      </ReactMapGL>
      {rectangleSelection && rectangleStart && rectangleCurrent && mapLoaded && (
        (() => {
          const map = mapRef.current?.getMap();
          if (!map) return null;
          const p1 = map.project(rectangleStart as any) as any;
          const p2 = map.project(rectangleCurrent as any) as any;
          const left = Math.min(p1.x, p2.x);
          const top = Math.min(p1.y, p2.y);
          const width = Math.abs(p1.x - p2.x);
          const height = Math.abs(p1.y - p2.y);
          return (
            <div className="map-rectangle-container">
              <svg className="map-rectangle-svg">
                <rect x={left} y={top} width={width} height={height} className="map-rectangle-rect" />
              </svg>
            </div>
          );
        })()
      )}
    </div>
  );
});
