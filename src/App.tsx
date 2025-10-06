import { useEffect, useMemo, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { AppHeader } from './components/AppHeader';
import { MapView } from './components/Map';
import { RightPanel } from './components/RightPanel';
import { LeftPanel } from './components/LeftPanel';
import { AttributesPanel } from './components/AttributesPanel';
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
              {layers.map((layer) => (
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
              >
                <MapView
                  styleUrl={style as any}
                  visibleLayers={visibleLayers}
                  layers={layers}
                  onFeaturesHover={setHoveredFeatures}
                  enableHover={activeInfoMode !== null}
                  infoMode={activeInfoMode}
                  onClick={(features, lngLat) => { setClickedFeatures(features); setMarker(lngLat); }}
                  marker={marker}
                />
              </RightPanel>
            </Panel>
            <PanelResizeHandle className="h-2 bg-border" />
            <Panel defaultSize={showAttributes ? 30 : 10} minSize={5} maxSize={50}>
              <AttributesPanel />
            </Panel>
            <PanelResizeHandle className="h-2 bg-border" />
            <Panel defaultSize={10} minSize={5} maxSize={15}>
              <div className="bg-muted border-t border-border flex items-center justify-center h-full">
                <div className="w-1/2 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Bottom Panel</p>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </main>
    </div>
  );
}
