import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { FeatureTable } from './map/FeatureTable';
import { useMapStore } from '../store';
import type { ReportRow, FilteredFeature, SelectedAttributeRow, Layer } from '../types';

interface AttributesPanelProps {
  visibleLayers: Set<string>; // deprecated - now using store
  onLayerToggle: (layerName: string, checked: boolean) => void; // deprecated - now using store
  pointsData: ReportRow[]; // deprecated - now using store
  linesData: ReportRow[]; // deprecated - now using store
  polygonsData: ReportRow[]; // deprecated - now using store
  highlightedPoints: Set<string>; // deprecated - now using store
  highlightedLines: Set<string>; // deprecated - now using store
  highlightedPolygons: Set<string>; // deprecated - now using store
  onToggleHighlightPoints: () => void; // deprecated - now using store
  onToggleHighlightLines: () => void; // deprecated - now using store
  onToggleHighlightPolygons: () => void; // deprecated - now using store
  selectedAttributeRow: SelectedAttributeRow | null;
  onAttributeRowSelect: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  activeInfoMode: 'points' | 'lines' | 'polygons' | null;
  onZoomToFeature: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onShowBbox: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onShowReportCard: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onFilterToFeature: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onClearFilter: (type: 'points' | 'lines' | 'polygons') => void;
  filteredFeature: FilteredFeature | null;
}

export function AttributesPanel({ 
  onAttributeRowSelect,
  activeInfoMode,
  onZoomToFeature,
  onShowBbox,
  onShowReportCard,
  onFilterToFeature,
  onClearFilter,
  filteredFeature
}: AttributesPanelProps) {
  const {
    attributesPointsData,
    attributesLinesData,
    attributesPolygonsData,
    highlightedPoints,
    highlightedLines,
    highlightedPolygons,
    selectedAttributeRow,
    toggleHighlightPoints,
    toggleHighlightLines,
    toggleHighlightPolygons,
    handleAttributeRowSelect,
    handleFilterToFeature,
    handleClearFilter,
  } = useMapStore();

  // Use store values instead of props
  const pointsData = attributesPointsData;
  const linesData = attributesLinesData;
  const polygonsData = attributesPolygonsData;
  const selectedRow = selectedAttributeRow;

  // Handle attribute row selection
  const handleRowSelect = (row: ReportRow, type: 'points' | 'lines' | 'polygons') => {
    // Проверяем, что row и type определены
    if (!row || !type) return;
    handleAttributeRowSelect(row, type);
  };

  // Handle filter to feature
  const handleFilterToFeatureLocal = (row: ReportRow, type: 'points' | 'lines' | 'polygons') => {
    // Проверяем, что row и type определены
    if (!row || !type) return;
    handleFilterToFeature(row, type);
  };

  // Handle clear filter
  const handleClearFilterLocal = (type: 'points' | 'lines' | 'polygons') => {
    // Проверяем, что type определен
    if (!type) return;
    handleClearFilter(type);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-3 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Точки</h3>
            <div className="flex items-center gap-2">
              {pointsData.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleHighlightPoints()}
                  >
                    {highlightedPoints.size > 0 ? 'Снять выделение' : 'Выделить все'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowReportCard(pointsData[0], 'points')}
                  >
                    Отчет
                  </Button>
                </>
              )}
            </div>
          </div>
          {pointsData.length > 0 ? (
            <div className="space-y-2">
              {pointsData.map((point, index) => (
                <FeatureTable
                  key={`point-${index}`}
                  feature={{ layer: { id: 'gdx2.stp' }, properties: point } as any}
                  index={index}
                  selectedFeature={selectedRow?.type === 'points' && selectedRow.data.id === point.id ? { layer: { id: 'gdx2.stp' }, properties: point } as any : null}
                  onFeatureSelect={(feature) => handleRowSelect(point, 'points')}
                  onFeatureHover={() => {}}
                  onZoomToFeature={(f) => onZoomToFeature(point, 'points')}
                  onShowBbox={() => onShowBbox(point, 'points')}
                  onFilterToFeature={(row, type) => handleFilterToFeatureLocal(row, 'points')}
                  onClearFilter={() => handleClearFilterLocal('points')}
                  isFiltered={!!filteredFeature && filteredFeature.row.id === point.id && filteredFeature.type === 'points'}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Нет данных о точках</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Линии</h3>
            <div className="flex items-center gap-2">
              {linesData.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleHighlightLines()}
                  >
                    {highlightedLines.size > 0 ? 'Снять выделение' : 'Выделить все'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowReportCard(linesData[0], 'lines')}
                  >
                    Отчет
                  </Button>
                </>
              )}
            </div>
          </div>
          {linesData.length > 0 ? (
            <div className="space-y-2">
              {linesData.map((line, index) => (
                <FeatureTable
                  key={`line-${index}`}
                  feature={{ layer: { id: 'gdx2.stl' }, properties: line } as any}
                  index={index}
                  selectedFeature={selectedRow?.type === 'lines' && selectedRow.data.id === line.id ? { layer: { id: 'gdx2.stl' }, properties: line } as any : null}
                  onFeatureSelect={(feature) => handleRowSelect(line, 'lines')}
                  onFeatureHover={() => {}}
                  onZoomToFeature={(f) => onZoomToFeature(line, 'lines')}
                  onShowBbox={() => onShowBbox(line, 'lines')}
                  onFilterToFeature={(row, type) => handleFilterToFeatureLocal(row, 'lines')}
                  onClearFilter={() => handleClearFilterLocal('lines')}
                  isFiltered={!!filteredFeature && filteredFeature.row.id === line.id && filteredFeature.type === 'lines'}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Нет данных о линиях</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Полигоны</h3>
            <div className="flex items-center gap-2">
              {polygonsData.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleHighlightPolygons()}
                  >
                    {highlightedPolygons.size > 0 ? 'Снять выделение' : 'Выделить все'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowReportCard(polygonsData[0], 'polygons')}
                  >
                    Отчет
                  </Button>
                </>
              )}
            </div>
          </div>
          {polygonsData.length > 0 ? (
            <div className="space-y-2">
              {polygonsData.map((polygon, index) => (
                <FeatureTable
                  key={`polygon-${index}`}
                  feature={{ layer: { id: 'gdx2.sta' }, properties: polygon } as any}
                  index={index}
                  selectedFeature={selectedRow?.type === 'polygons' && selectedRow.data.id === polygon.id ? { layer: { id: 'gdx2.sta' }, properties: polygon } as any : null}
                  onFeatureSelect={(feature) => handleRowSelect(polygon, 'polygons')}
                  onFeatureHover={() => {}}
                  onZoomToFeature={(f) => onZoomToFeature(polygon, 'polygons')}
                  onShowBbox={() => onShowBbox(polygon, 'polygons')}
                  onFilterToFeature={(row, type) => handleFilterToFeatureLocal(row, 'polygons')}
                  onClearFilter={() => handleClearFilterLocal('polygons')}
                  isFiltered={!!filteredFeature && filteredFeature.row.id === polygon.id && filteredFeature.type === 'polygons'}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Нет данных о полигонах</p>
          )}
        </div>
      </div>
    </div>
  );
}
