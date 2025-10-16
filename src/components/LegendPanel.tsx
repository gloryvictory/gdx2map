import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

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
      .map(layer => {
        // Define colors for different layer types
        let color = '#666666';
        if (layer.name.includes('stp')) color = '#ff6b6b'; // Points - red
        else if (layer.name.includes('stl')) color = '#4ecdc4'; // Lines - teal
        else if (layer.name.includes('sta')) color = '#45b7d1'; // Polygons - blue
        else if (layer.name.includes('lu')) color = '#96ceb4'; // License areas - green
        else if (layer.name.includes('field')) color = '#feca57'; // Fields - yellow

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
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: item.color }}
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
