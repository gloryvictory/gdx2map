import 'maplibre-gl/dist/maplibre-gl.css';
import { ScatterplotLayer } from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import * as maplibre from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMapGL, {
  type MapRef,
  NavigationControl,
  type ViewState,
} from 'react-map-gl/maplibre';
import layersData from '../data/layers.json';

export function MapView({ styleUrl, visibleLayers }: { styleUrl: string | object; visibleLayers: Set<string> }) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewState, setViewState] = useState<any>({
    longitude: 77,
    latitude: 76,
    zoom: 2,
    bearing: 0,
    pitch: 0,
  });

  const layers = useMemo(() => {
    return [];
  }, []);

  const onViewStateChange = useCallback((vs: ViewState) => {
    setViewState(vs);
  }, []);

  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    console.log('Adding layers', visibleLayers);

    const allLayers = layersData.services.layers;

    allLayers.forEach(layer => {
      const sourceId = `vector-${layer.name}`;
      const layerId = `vector-layer-${layer.name}`;

      if (visibleLayers.has(layer.name)) {
        // Add source if not exists
        if (!map.getSource(sourceId)) {
          console.log('Adding source', sourceId, layer.url);
          map.addSource(sourceId, {
            type: 'vector',
            tiles: [layer.url],
            minzoom: layer.level?.min || 0,
            maxzoom: layer.level?.max || 22,
          });
        }
        // Add layer if not exists
        if (!map.getLayer(layerId)) {
          console.log('Adding layer', layerId);
          // Determine layer type based on name
          let type: 'fill' | 'line' | 'circle' = 'fill';
          if (layer.name === 'stl') type = 'line';
          else if (layer.name === 'stp') type = 'circle';
          else type = 'fill';

          const layerConfig: any = {
            id: layerId,
            type,
            source: sourceId,
            'source-layer': 'default',
          };

          if (type === 'fill') {
            layerConfig.paint = {
              'fill-color': '#ff0000',
              'fill-opacity': 0.5,
            };
          } else if (type === 'line') {
            layerConfig.paint = {
              'line-color': '#0000ff',
              'line-width': 2,
            };
          } else if (type === 'circle') {
            layerConfig.paint = {
              'circle-color': '#00ff00',
              'circle-radius': 5,
            };
          }

          map.addLayer(layerConfig);
          console.log('Layer added', layerId);
        }
      } else {
        // Remove layer if exists
        if (map.getLayer(layerId)) {
          console.log('Removing layer', layerId);
          map.removeLayer(layerId);
        }
        // Remove source if exists
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      }
    });
  }, [mapLoaded, visibleLayers]);

  return (
    <div
      className="relative w-full rounded-md border overflow-hidden"
      style={{ height: '100%' }}
    >
      <DeckGL
        layers={layers}
        controller={true}
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) =>
          onViewStateChange(vs as ViewState)
        }
        style={{ width: '100%', height: '100%' }}
      >
        <ReactMapGL
          ref={mapRef}
          mapLib={maplibre as any}
          reuseMaps
          mapStyle={styleUrl as any}
          longitude={viewState.longitude}
          latitude={viewState.latitude}
          zoom={viewState.zoom}
          bearing={viewState.bearing}
          pitch={viewState.pitch}
          style={{ width: '100%', height: '100%' }}
          onLoad={() => setMapLoaded(true)}
        >
          <NavigationControl visualizePitch position="top-right" />
        </ReactMapGL>
      </DeckGL>
    </div>
  );
}
