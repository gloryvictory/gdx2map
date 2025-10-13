import { useEffect, useMemo, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { AppHeader } from './components/AppHeader';
import { MapView } from './components/Map';
import { RightPanel } from './components/RightPanel';
import { LeftPanel } from './components/LeftPanel';
import { AttributesPanel } from './components/AttributesPanel';
import { BottomPanel } from './components/BottomPanel';
import { Label } from './components/ui/label';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Checkbox } from './components/ui/checkbox';
import { LIGHT_MAP_STYLE } from './constants/mapStyles';
import { ALL_BASEMAPS } from './lib/basemaps';
import { TILE_SERVER_URL } from './config';

type Layer = {
  name: string;
  title: string;
  description: string;
  type: string;
  url: string;
  level: { min: number; max: number };
};

export default function App() {
  const [basemapKey, setBasemapKey] = useState<string>('osm');
  const [showBaseMaps, setShowBaseMaps] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [hoveredFeatures, setHoveredFeatures] = useState<any[]>([]);
  const [clickedFeatures, setClickedFeatures] = useState<any[]>([]);
  const [marker, setMarker] = useState<{lng: number, lat: number} | null>(null);
  const [showFeatureTable, setShowFeatureTable] = useState(false);
  const [activeInfoMode, setActiveInfoMode] = useState<'points' | 'lines' | 'polygons' | null>(null);
  const [showMarkerInfo, setShowMarkerInfo] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [attributesPointsData, setAttributesPointsData] = useState<any[]>([]);
  const [attributesLinesData, setAttributesLinesData] = useState<any[]>([]);
  const [attributesPolygonsData, setAttributesPolygonsData] = useState<any[]>([]);
  const [mouseCoords, setMouseCoords] = useState<{lng: number, lat: number} | null>(null);
  const [coordSystem, setCoordSystem] = useState<'EPSG:4326' | 'EPSG:3857'>('EPSG:4326');
  const [currentZoom, setCurrentZoom] = useState<number>(2);
  const [highlightedPoints, setHighlightedPoints] = useState<Set<string>>(new Set());
  const [highlightedLines, setHighlightedLines] = useState<Set<string>>(new Set());
  const [highlightedPolygons, setHighlightedPolygons] = useState<Set<string>>(new Set());
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [hoveredFeature, setHoveredFeature] = useState<any>(null);
  const [selectedAttributeRow, setSelectedAttributeRow] = useState<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetch(`${TILE_SERVER_URL}/catalog`)
      .then(response => response.json())
      .then(data => {
        const tiles = data.tiles || {};
        const titleMap: Record<string, string> = {
          'gdx2.stp.geom': 'Отчеты - точки',
          'gdx2.stl.geom': 'Отчеты - линии',
          'gdx2.sta.geom': 'Отчеты - Полигоны',
          'gdx2.lu.geom': 'Лицензионные участки',
          'gdx2.field.geom': 'Месторождения',
        };
        const order = ['field', 'lu', 'sta', 'stl', 'stp'];
        const fetchedLayers: Layer[] = Object.keys(tiles)
          .map(tableName => ({
            name: tableName,
            title: titleMap[tiles[tableName].description] || tiles[tableName].description || tableName,
            description: tiles[tableName].description || tableName,
            type: 'xyz',
            url: `${TILE_SERVER_URL}/${tableName}/{z}/{x}/{y}`,
            level: { min: 0, max: 22 },
          }))
          .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
        setLayers(fetchedLayers);
        // Set all visible
        const initialVisible = new Set(fetchedLayers.map(l => l.name));
        setVisibleLayers(initialVisible);
      })
      .catch(error => console.error('Failed to fetch layers:', error));
  }, []);
  const style = useMemo(() => {
    const found = ALL_BASEMAPS.find((b) => b.key === basemapKey);
    return found ? found.url : LIGHT_MAP_STYLE;
  }, [basemapKey]);

  const handleLayersClick = () => {
    setShowLayers(prev => !prev);
  };

  const handleBaseMapsClick = () => {
    setShowBaseMaps(prev => !prev);
  };

  const handleAttributesClick = () => {
    setShowAttributes(prev => !prev);
  };

  const handleLayerToggle = (layerName: string, checked: boolean) => {
    setVisibleLayers(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(layerName);
      } else {
        newSet.delete(layerName);
      }
      return newSet;
    });
  };

  const handleBasemapSelect = (key: string) => {
    setBasemapKey(key);
    setShowBaseMaps(false);
  };

  const updateAttributesData = (features: any[]) => {
    const points: any[] = [];
    const lines: any[] = [];
    const polygons: any[] = [];

    features.forEach(feature => {
      const type = feature.layer.id.split('.')[1];
      if (type === 'stp') {
        points.push(feature.properties);
      } else if (type === 'stl') {
        lines.push(feature.properties);
      } else if (type === 'sta') {
        polygons.push(feature.properties);
      }
    });

    setAttributesPointsData(points);
    setAttributesLinesData(lines);
    setAttributesPolygonsData(polygons);
  };

  const toggleHighlightPoints = () => {
    if (highlightedPoints.size > 0) {
      setHighlightedPoints(new Set());
    } else {
      const ids = new Set(attributesPointsData.map(item => item.id?.toString()).filter(Boolean));
      setHighlightedPoints(ids);
      // Ensure layer is visible
      setVisibleLayers(prev => new Set([...prev, 'stp']));
    }
  };

  const toggleHighlightLines = () => {
    if (highlightedLines.size > 0) {
      setHighlightedLines(new Set());
    } else {
      const ids = new Set(attributesLinesData.map(item => item.id?.toString()).filter(Boolean));
      setHighlightedLines(ids);
      // Ensure layer is visible
      setVisibleLayers(prev => new Set([...prev, 'stl']));
    }
  };

  const toggleHighlightPolygons = () => {
    if (highlightedPolygons.size > 0) {
      setHighlightedPolygons(new Set());
    } else {
      const ids = new Set(attributesPolygonsData.map(item => item.id?.toString()).filter(Boolean));
      setHighlightedPolygons(ids);
      // Ensure layer is visible
      setVisibleLayers(prev => new Set([...prev, 'sta']));
    }
  };

  const handleFeatureSelect = (feature: any) => {
    setSelectedFeature(feature);
    setSelectedAttributeRow(null); // Clear attribute selection when selecting feature
    // Zoom to feature
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      // For simplicity, zoom to a fixed level and center on the feature
      // In a real app, you'd calculate bounds from the feature geometry
      map.flyTo({
        center: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
        zoom: 12,
        duration: 1000
      });
    }
  };

  const handleAttributeRowSelect = (row: any, type: 'points' | 'lines' | 'polygons') => {
    if (selectedAttributeRow && selectedAttributeRow.data.id === row.id && selectedAttributeRow.type === type) {
      // Deselect if clicking the same row
      setSelectedAttributeRow(null);
      setSelectedFeature(null); // Also clear feature selection
    } else {
      setSelectedAttributeRow({ data: row, type });
      setSelectedFeature(null); // Clear feature selection when selecting attribute row

      // Always zoom to the feature when selecting
      setTimeout(() => {
        if (mapRef.current && row) {
          const map = mapRef.current.getMap();
          // Query rendered features instead of source features for better coordinate access
          const layerName = type === 'points' ? 'gdx2.stp' : type === 'lines' ? 'gdx2.stl' : 'gdx2.sta';
          const features = map.queryRenderedFeatures(undefined, {
            layers: [layerName],
            filter: ['==', 'id', row.id]
          });
          if (features.length > 0) {
            const feature = features[0];
            const coordinates = feature.geometry.coordinates;
            if (coordinates) {
              if (type === 'points') {
                const center = coordinates as [number, number];
                map.flyTo({
                  center: center,
                  zoom: 12,
                  duration: 1000
                });
              } else if (type === 'lines') {
                // Calculate bbox for the entire line
                const coords = coordinates as [number, number][];
                let minLng = coords[0][0];
                let maxLng = coords[0][0];
                let minLat = coords[0][1];
                let maxLat = coords[0][1];

                coords.forEach(coord => {
                  minLng = Math.min(minLng, coord[0]);
                  maxLng = Math.max(maxLng, coord[0]);
                  minLat = Math.min(minLat, coord[1]);
                  maxLat = Math.max(maxLat, coord[1]);
                });

                map.fitBounds([
                  [minLng, minLat],
                  [maxLng, maxLat]
                ], {
                  padding: 50,
                  duration: 1000
                });
              } else {
                // For polygons, fit bounds to show entire polygon
                const coords = coordinates as [number, number][][];
                let minLng = coords[0][0][0];
                let maxLng = coords[0][0][0];
                let minLat = coords[0][0][1];
                let maxLat = coords[0][0][1];

                coords.forEach(ring => {
                  ring.forEach(coord => {
                    minLng = Math.min(minLng, coord[0]);
                    maxLng = Math.max(maxLng, coord[0]);
                    minLat = Math.min(minLat, coord[1]);
                    maxLat = Math.max(maxLat, coord[1]);
                  });
                });

                map.fitBounds([
                  [minLng, minLat],
                  [maxLng, maxLat]
                ], {
                  padding: 50,
                  duration: 1000
                });
              }
            }
          } else {
            // If no features found, try again after a longer delay (maybe layer is still loading)
            setTimeout(() => {
              const featuresRetry = map.queryRenderedFeatures(undefined, {
                layers: [layerName],
                filter: ['==', 'id', row.id]
              });
              if (featuresRetry.length > 0) {
                const feature = featuresRetry[0];
                const coordinates = feature.geometry.coordinates;
                if (coordinates) {
                  if (type === 'points') {
                    const center = coordinates as [number, number];
                    map.flyTo({
                      center: center,
                      zoom: 12,
                      duration: 1000
                    });
                  } else if (type === 'lines') {
                    // Calculate bbox for the entire line
                    const coords = coordinates as [number, number][];
                    let minLng = coords[0][0];
                    let maxLng = coords[0][0];
                    let minLat = coords[0][1];
                    let maxLat = coords[0][1];

                    coords.forEach(coord => {
                      minLng = Math.min(minLng, coord[0]);
                      maxLng = Math.max(maxLng, coord[0]);
                      minLat = Math.min(minLat, coord[1]);
                      maxLat = Math.max(maxLat, coord[1]);
                    });

                    map.fitBounds([
                      [minLng, minLat],
                      [maxLng, maxLat]
                    ], {
                      padding: 50,
                      duration: 1000
                    });
                  } else {
                    // For polygons, fit bounds to show entire polygon
                    const coords = coordinates as [number, number][][];
                    let minLng = coords[0][0][0];
                    let maxLng = coords[0][0][0];
                    let minLat = coords[0][0][1];
                    let maxLat = coords[0][0][1];

                    coords.forEach(ring => {
                      ring.forEach(coord => {
                        minLng = Math.min(minLng, coord[0]);
                        maxLng = Math.max(maxLng, coord[0]);
                        minLat = Math.min(minLat, coord[1]);
                        maxLat = Math.max(maxLat, coord[1]);
                      });
                    });

                    map.fitBounds([
                      [minLng, minLat],
                      [maxLng, maxLat]
                    ], {
                      padding: 50,
                      duration: 1000
                    });
                  }
                }
              }
            }, 500);
          }
        }
      }, 100); // Small delay to ensure state updates are processed
    }
  };

  return (
    <div className={`min-h-screen bg-background text-foreground relative ${theme}`}>
      <AppHeader theme={theme} onThemeChange={setTheme} />
      <main className="absolute top-14 left-0 right-0 bottom-0">
        <div className="absolute left-0 top-0 bottom-0 z-10">
          <LeftPanel
            onLayersClick={handleLayersClick}
            onBaseMapsClick={handleBaseMapsClick}
            onAttributesClick={handleAttributesClick}
            isLayersActive={showLayers}
            isBaseMapsActive={showBaseMaps}
            isAttributesActive={showAttributes}
          />
        </div>
        {showLayers && (
          <div className="absolute left-16 top-0 bottom-0 z-20 bg-background border-r border-border p-3 w-64">
            <h3 className="text-lg font-semibold mb-3">Слои</h3>
            <div className="space-y-2">
              {[...layers].reverse().map((layer) => (
                <div key={layer.name} className="flex items-center gap-2">
                  <Checkbox
                    id={`layer-${layer.name}`}
                    checked={visibleLayers.has(layer.name)}
                    onCheckedChange={(checked) => handleLayerToggle(layer.name, checked as boolean)}
                  />
                  <Label htmlFor={`layer-${layer.name}`}>{layer.title}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
        {showBaseMaps && (
          <div className="absolute left-16 top-0 bottom-0 z-20 bg-background border-r border-border p-3 w-64">
            <h3 className="text-lg font-semibold mb-3">Базовые карты</h3>
            <RadioGroup value={basemapKey} onValueChange={handleBasemapSelect}>
              <div className="space-y-2">
                {ALL_BASEMAPS.map((b) => (
                  <div key={b.key} className="flex items-center gap-2">
                    <RadioGroupItem id={`popup-basemap-${b.key}`} value={b.key} />
                    <Label htmlFor={`popup-basemap-${b.key}`}>{b.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}
        <div className={`absolute top-0 right-0 bottom-0 ${showBaseMaps || showLayers ? 'left-80' : 'left-16'}`}>
          <PanelGroup direction="vertical" key={showAttributes ? 'active' : 'inactive'}>
            <Panel defaultSize={showAttributes ? 60 : 80} minSize={30}>
              <RightPanel
                hoveredFeatures={hoveredFeatures}
                clickedFeatures={clickedFeatures}
                showFeatureTable={showFeatureTable}
                onToggleFeatureTable={setShowFeatureTable}
                activeInfoMode={activeInfoMode}
                onSetActiveInfoMode={(mode) => {
                  setActiveInfoMode(mode);
                  if (mode) setShowMarkerInfo(false);
                }}
                showMarkerInfo={showMarkerInfo}
                onToggleMarkerInfo={(show) => {
                  setShowMarkerInfo(show);
                  if (show) setActiveInfoMode(null);
                }}
                showAttributes={showAttributes}
                onToggleAttributes={(show) => {
                  if (show) {
                    updateAttributesData(clickedFeatures);
                    setActiveInfoMode(null);
                  }
                  setShowAttributes(show);
                }}
                selectedFeature={selectedFeature}
                onFeatureSelect={handleFeatureSelect}
                onFeatureHover={setHoveredFeature}
              >
                <MapView
                  ref={mapRef}
                  styleUrl={style as any}
                  visibleLayers={visibleLayers}
                  layers={layers}
                  onFeaturesHover={setHoveredFeatures}
                  enableHover={activeInfoMode !== null}
                  infoMode={activeInfoMode}
                  onClick={(features, lngLat) => { setClickedFeatures(features); if (showMarkerInfo) setMarker(lngLat); }}
                  marker={marker}
                  onMouseMoveCoords={setMouseCoords}
                  highlightedPoints={highlightedPoints}
                  highlightedLines={highlightedLines}
                  highlightedPolygons={highlightedPolygons}
                  onZoomChange={setCurrentZoom}
                  selectedFeature={selectedFeature}
                  hoveredFeature={hoveredFeature}
                  selectedAttributeRow={selectedAttributeRow}
                />
              </RightPanel>
            </Panel>
            <PanelResizeHandle className="h-2 bg-border" />
            <Panel defaultSize={showAttributes ? 50 : 20} minSize={20} maxSize={50}>
              <AttributesPanel
                visibleLayers={visibleLayers}
                onLayerToggle={handleLayerToggle}
                pointsData={attributesPointsData}
                linesData={attributesLinesData}
                polygonsData={attributesPolygonsData}
                highlightedPoints={highlightedPoints}
                highlightedLines={highlightedLines}
                highlightedPolygons={highlightedPolygons}
                onToggleHighlightPoints={toggleHighlightPoints}
                onToggleHighlightLines={toggleHighlightLines}
                onToggleHighlightPolygons={toggleHighlightPolygons}
                selectedAttributeRow={selectedAttributeRow}
                onAttributeRowSelect={handleAttributeRowSelect}
                onZoomToFeature={(row, type) => {
                  if (mapRef.current && row) {
                    const map = mapRef.current.getMap();
                    const layerName = type === 'points' ? 'gdx2.stp' : type === 'lines' ? 'gdx2.stl' : 'gdx2.sta';
                    const features = map.queryRenderedFeatures(undefined, {
                      layers: [layerName],
                      filter: ['==', 'id', row.id]
                    });
                    if (features.length > 0) {
                      const feature = features[0];
                      const coordinates = feature.geometry.coordinates;
                      if (coordinates) {
                        let center: [number, number];
                        if (type === 'points') {
                          center = coordinates as [number, number];
                        } else if (type === 'lines') {
                          center = (coordinates as [number, number][])[0];
                        } else {
                          center = (coordinates as [number, number][][])[0][0];
                        }
                        map.flyTo({
                          center: center,
                          zoom: 12,
                          duration: 1000
                        });
                      }
                    }
                  }
                }}
              />
            </Panel>
            {/* <PanelResizeHandle className="h-2 bg-border" /> */}
            <Panel defaultSize={2} minSize={2} maxSize={2}>
              <BottomPanel mouseCoords={mouseCoords} coordSystem={coordSystem} onCoordSystemChange={setCoordSystem} zoom={currentZoom} />
            </Panel>
          </PanelGroup>
        </div>
      </main>
    </div>
  );
}
