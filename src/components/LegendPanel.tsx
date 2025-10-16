import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { layersConfig } from '../layers';

interface LegendPanelProps {
  visibleLayers: Set<string>;
  layers: Array<{ name: string; title: string; description: string; type: string; url: string; level: { min: number; max: number } }>;
}

export function LegendPanel({ visibleLayers, layers }: LegendPanelProps) {
  const [legendItems, setLegendItems] = useState<Array<{ name: string; title: string; color: string; visible: boolean }>>([]);

  useEffect(() => {
    // Generate legend items based on visible layers
    const items = layers
      .filter(layer => visibleLayers.has(layer.name))
      .reverse()
      .map(layer => {
        // Get color from layer configuration
        const config = layersConfig[layer.name];
        let color = '#666666'; // default color

        if (config) {
          const layerSpec = config.layer;
          if (layerSpec.type === 'circle' && 'paint' in layerSpec && layerSpec.paint && 'circle-color' in layerSpec.paint) {
            color = layerSpec.paint['circle-color'] as string;
          } else if (layerSpec.type === 'line' && 'paint' in layerSpec && layerSpec.paint && 'line-color' in layerSpec.paint) {
            color = layerSpec.paint['line-color'] as string;
          } else if (layerSpec.type === 'fill' && 'paint' in layerSpec && layerSpec.paint && 'fill-color' in layerSpec.paint) {
            color = layerSpec.paint['fill-color'] as string;
          }
        }

        return {
          name: layer.name,
          title: layer.title,
          color,
          visible: visibleLayers.has(layer.name)
        };
      });

    setLegendItems(items);
  }, [visibleLayers, layers]);

  return (
    <div className="bg-background border-t border-border p-4">
      <h3 className="text-lg font-semibold mb-3">Легенда</h3>
      <div className="space-y-2">
        {legendItems.length > 0 ? (
          legendItems.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border legend-color"
                style={{ '--legend-color': item.color } as React.CSSProperties}
              />
              <span className="text-sm">{item.title}</span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">Нет видимых слоев для отображения в легенде</p>
        )}
      </div>
    </div>
  );
}
