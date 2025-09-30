import { useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { MapView } from './components/Map';
import { RightPanel } from './components/RightPanel';
import { LeftPanel } from './components/LeftPanel';
import { Label } from './components/ui/label';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Checkbox } from './components/ui/checkbox';
import { LIGHT_MAP_STYLE } from './constants/mapStyles';
import { ALL_BASEMAPS } from './lib/basemaps';
import layersData from './data/layers.json';

export default function App() {
  const [basemapKey, setBasemapKey] = useState<string>('osm');
  const [showBaseMaps, setShowBaseMaps] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    layersData.services.layers.forEach(layer => initial.add(layer.name));
    return initial;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const style = useMemo(() => {
    const found = ALL_BASEMAPS.find((b) => b.key === basemapKey);
    return found?.url ?? LIGHT_MAP_STYLE;
  }, [basemapKey]);

  const handleLayersClick = () => {
    setShowLayers(prev => !prev);
  };

  const handleBaseMapsClick = () => {
    setShowBaseMaps(prev => !prev);
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
      <main className="absolute top-14 left-0 right-0 bottom-8">
        <div className="absolute left-0 top-0 bottom-0 z-10">
          <LeftPanel
            onLayersClick={handleLayersClick}
            onBaseMapsClick={handleBaseMapsClick}
            isLayersActive={showLayers}
            isBaseMapsActive={showBaseMaps}
          />
        </div>
        {showLayers && (
          <div className="absolute left-16 top-0 bottom-0 z-20 bg-background border-r border-border p-3 w-64">
            <h3 className="text-lg font-semibold mb-3">Слои</h3>
            <div className="space-y-2">
              {layersData.services.layers.map((layer) => (
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
          <RightPanel selectedKey={basemapKey} onChangeBasemap={setBasemapKey}>
            <MapView styleUrl={style as any} visibleLayers={visibleLayers} />
          </RightPanel>
        </div>
      </main>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-muted border-t border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Bottom Panel</p>
      </div>
    </div>
  );
}
