import 'maplibre-gl/dist/maplibre-gl.css';
import ReactMapGL, { NavigationControl, ViewState, MapRef } from 'react-map-gl/maplibre';
import * as maplibre from 'maplibre-gl';
import { useCallback, useMemo, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';

export function MapView({ styleUrl }: { styleUrl: string | object }) {
  const mapRef = useRef<MapRef | null>(null);
  const [viewState, setViewState] = useState<any>({
    longitude: 37.6176,
    latitude: 55.7558,
    zoom: 9,
    bearing: 0,
    pitch: 0,
  });

  const layers = useMemo(() => {
    return [
      new ScatterplotLayer({
        id: 'demo-scatter',
        data: [{ position: [37.6176, 55.7558], size: 200 }],
        getPosition: (d: any) => d.position,
        getFillColor: [0, 122, 255, 180],
        getRadius: (d: any) => d.size,
        radiusUnits: 'meters',
        pickable: true,
      }),
    ];
  }, []);

  const onViewStateChange = useCallback((vs: ViewState) => {
    setViewState(vs);
  }, []);

  return (
    <div className="relative w-full rounded-md border overflow-hidden" style={{ height: '100%' }}>
      <DeckGL
        layers={layers}
        controller={true}
        initialViewState={viewState}
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => onViewStateChange(vs as ViewState)}
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
        >
          <NavigationControl visualizePitch position="top-right" />
        </ReactMapGL>
      </DeckGL>
    </div>
  );
}
