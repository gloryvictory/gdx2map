import { useEffect } from 'react';
import { Feature } from '../types';
import { LuMarkerPanel } from './LuMarkerPanel';

interface LuSelectPanelProps {
  luFeatures: Feature[];
  selectedLu: Feature | null;
  onLuSelect: (lu: Feature | null, showInfo?: boolean) => void;
  onExportLuToExcel: (lu: Feature) => void;
  visibleLayers: Set<string>;
  onFeatureSelect: (feature: Feature | null) => void;
  onFeatureHover: (feature: Feature | null) => void;
}

export function LuSelectPanel({
  luFeatures,
  selectedLu,
  onLuSelect,
  onExportLuToExcel,
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
   }, [selectedLu?.properties?.id]); // Используем только ID для оптимизации

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col px-3 pb-3 overflow-hidden">
        <LuMarkerPanel
          selectedLu={selectedLu}
          onMarkerPlace={(lu, showInfo = true) => onLuSelect(lu, showInfo)}
          onExportToExcel={onExportLuToExcel}
        />
        <div className="mb-4 flex-1 flex flex-col">
          <label className="text-sm font-medium mb-2 block">Лицензионные участки: ({luFeatures.length})</label>
          <div className="space-y-1 flex-1 overflow-y-auto border rounded p-2 max-h-96    ">
            {luFeatures
              .slice()
              .sort((a, b) => {
                const nameA = a.properties.name_rus || a.properties.name || `Участок ${a.properties.id}`;
                const nameB = b.properties.name_rus || b.properties.name || `Участок ${b.properties.id}`;
                return nameA.localeCompare(nameB);
              })
              .map((lu, index) => (
                <div
                  key={index}
                  className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                    selectedLu?.properties.id === lu.properties.id ? 'bg-blue-100 border-blue-30' : ''
                  }`}
                  onClick={() => {
                    // Toggle selection - if clicking the same LU, deselect it
                    if (selectedLu?.properties.id === lu.properties.id) {
                      onLuSelect(null, false);
                    } else {
                      onLuSelect(lu, false);
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
