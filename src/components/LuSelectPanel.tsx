import { useState, useEffect, useId } from 'react';
import { Feature } from '../types';
import { FeatureTable } from './map/FeatureTable';

interface LuSelectPanelProps {
  luFeatures: Feature[];
  selectedLu: Feature | null;
  onLuSelect: (lu: Feature | null) => void;
  visibleLayers: Set<string>;
  onFeatureSelect: (feature: Feature | null) => void;
  onFeatureHover: (feature: Feature | null) => void;
}

export function LuSelectPanel({
  luFeatures,
  selectedLu,
  onLuSelect,
  visibleLayers,
  onFeatureSelect,
  onFeatureHover
}: LuSelectPanelProps) {
  // Filter features that are inside the selected LU
   useEffect(() => {
     if (selectedLu) {
       // This would require spatial intersection logic to determine which features are within the LU
       // For now, we'll just show the LU feature itself
       // In a real implementation, you would need to:
       // 1. Query features from other layers that intersect with the selected LU geometry
       // 2. Update setFilteredFeatures with those features
     }
   }, [selectedLu]);

  return (
    <div className="h-full overflow-auto flex flex-col">
      <div className="sticky top-0 bg-background z-10 pb-3">
        <h3 className="text-sm font-medium mb-3 bg-purple-100 p-2 rounded">Выбрать по ЛУ</h3>
        <div className="flex gap-2 px-3 pb-2">
          <button
            type="button"
            className="p-2 rounded border border-gray-300 hover:bg-gray-100"
            title="Поставить маркер"
            onClick={() => {
              // Logic to place marker will be implemented in App.tsx
            }}
          >
            📍
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-3 pb-3">
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Лицензионные участки:</label>
          <div className="space-y-1 h-full overflow-auto border rounded p-2">
            {luFeatures.map((lu, index) => (
              <div
                key={index}
                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  selectedLu?.properties.id === lu.properties.id ? 'bg-blue-100 border-blue-30' : ''
                }`}
                onClick={() => {
                  // Toggle selection - if clicking the same LU, deselect it
                  if (selectedLu?.properties.id === lu.properties.id) {
                    onLuSelect(null);
                  } else {
                    onLuSelect(lu);
                  }
                }}
              >
                <span className="text-sm">
                  {lu.properties.name_rus || lu.properties.name || `Участок ${lu.properties.id}`}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        
      </div>
    </div>
  );
}
