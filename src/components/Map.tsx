import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibre from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMapGL, {
  type MapRef,
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

export function MapView({ styleUrl, visibleLayers, layers }: { styleUrl: string | object | null; visibleLayers: Set<string>; layers: Layer[] }) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewState, setViewState] = useState<any>({
    longitude: 77,
    latitude: 76,
    zoom: 2,
    bearing: 0,
    pitch: 0,
  });

  const onMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
  }, []);

  useEffect(() => {
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
      } else {
        // Remove layer if exists
        if (map.getLayer(layerId)) {
          console.log('Removing layer', layerId);
          map.removeLayer(layerId);
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
  }, [mapLoaded, visibleLayers]);

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
        onMove={onMove}
      >
        <NavigationControl visualizePitch position="top-right" />
      </ReactMapGL>
    </div>
  );
}
