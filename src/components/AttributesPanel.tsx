import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useMapStore } from '../store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
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
  onZoomToFeature: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onShowBbox: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onShowReportCard: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onFilterToFeature: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onClearFilter: (type: 'points' | 'lines' | 'polygons') => void;
  filteredFeature: FilteredFeature | null;
}

export function AttributesPanel({ 
  onAttributeRowSelect,
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
    activeInfoMode,
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

  // Determine the active tab based on store state or default to 'points'
  const [activeTab, setActiveTab] = useState<'points' | 'lines' | 'polygons'>(activeInfoMode || 'points');

  // Sync active tab with store's activeInfoMode when it changes
  useEffect(() => {
    if (activeInfoMode) {
      setActiveTab(activeInfoMode);
    }
  }, [activeInfoMode]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-3">
         <Tabs 
           value={activeTab} 
           onValueChange={(value: 'points' | 'lines' | 'polygons') => {
             setActiveTab(value);
             // Update the store's activeInfoMode when tab changes
             useMapStore.getState().setActiveInfoMode(value);
           }} 
           className="w-full"
         >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="points">Точки</TabsTrigger>
            <TabsTrigger value="lines">Линии</TabsTrigger>
            <TabsTrigger value="polygons">Полигоны</TabsTrigger>
          </TabsList>

           {/* Points Tab */}
          <TabsContent value="points" className="space-y-3">
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
              <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                <AgGridReact
                  rowData={pointsData}
                  columnDefs={[
                    { field: 'id', headerName: 'ID', width: 100 },
                    { field: 'avts', headerName: 'Автор', width: 120 },
                    { field: 'name_otch', headerName: 'Отчет', width: 150 },
                    { field: 'org_isp', headerName: 'Организация', width: 150 },
                    { field: 'god_nach', headerName: 'Год начала', width: 100 },
                    { field: 'god_end', headerName: 'Год окончания', width: 120 },
                    { field: 'method', headerName: 'Метод', width: 120 },
                    { field: 'nom_1000', headerName: 'Лист', width: 100 },
                    { field: 'scale', headerName: 'Масштаб', width: 100 },
                    { field: 'tgf', headerName: 'ТГФ', width: 100 },
                    { field: 'in_n_rosg', headerName: 'инв. № РГФ', width: 120 },
                    { field: 'in_n_tgf', headerName: 'инв. № ТГФ', width: 120 },
                    { field: 'n_uk_rosg', headerName: '№ РГФ', width: 100 },
                    { field: 'n_uk_tgf', headerName: '№ ТГФ', width: 100 },
                    { field: 'web_uk_id', headerName: '№', width: 100 },
                    { field: 'vid_iz', headerName: 'Вид', width: 120 },
                  ]}
                  rowSelection="single"
                  onRowClicked={(event) => {
                    handleRowSelect(event.data, 'points');
                    // Trigger zoom to feature when row is clicked
                    onZoomToFeature(event.data, 'points');
                  }}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={10}
                  rowClassRules={{
                    'selected-row': (params) => 
                      selectedAttributeRow?.type === 'points' && 
                      selectedAttributeRow.data.id === params.data.id
                  }}
                  getContextMenuItems={(params) => [
                    'copy',
                    'copyWithHeaders',
                    'paste',
                    'separator',
                    'export',
                    {
                      name: 'Показать на карте',
                      action: () => {
                        if (params.node?.data) {
                          onZoomToFeature(params.node.data, 'points');
                        }
                      }
                    },
                    {
                      name: 'Показать bbox',
                      action: () => {
                        if (params.node?.data) {
                          onShowBbox(params.node.data, 'points');
                        }
                      }
                    },
                    {
                      name: 'Показать только этот',
                      action: () => {
                        if (params.node?.data) {
                          handleFilterToFeatureLocal(params.node.data, 'points');
                        }
                      }
                    },
                    ...(filteredFeature?.type === 'points' ? [{
                      name: 'Показать все',
                      action: () => {
                        handleClearFilterLocal('points');
                      }
                    }] : [])
                  ]}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Нет данных о точках</p>
            )}
          </TabsContent>

          {/* Lines Tab */}
          <TabsContent value="lines" className="space-y-3">
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
              <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                <AgGridReact
                  rowData={linesData}
                  columnDefs={[
                    { field: 'id', headerName: 'ID', width: 100 },
                    { field: 'avts', headerName: 'Автор', width: 120 },
                    { field: 'name_otch', headerName: 'Отчет', width: 150 },
                    { field: 'org_isp', headerName: 'Организация', width: 150 },
                    { field: 'god_nach', headerName: 'Год начала', width: 100 },
                    { field: 'god_end', headerName: 'Год окончания', width: 120 },
                    { field: 'method', headerName: 'Метод', width: 120 },
                    { field: 'nom_1000', headerName: 'Лист', width: 100 },
                    { field: 'scale', headerName: 'Масштаб', width: 100 },
                    { field: 'tgf', headerName: 'ТГФ', width: 100 },
                    { field: 'in_n_rosg', headerName: 'инв. № РГФ', width: 120 },
                    { field: 'in_n_tgf', headerName: 'инв. № ТГФ', width: 120 },
                    { field: 'n_uk_rosg', headerName: '№ РГФ', width: 100 },
                    { field: 'n_uk_tgf', headerName: '№ ТГФ', width: 100 },
                    { field: 'web_uk_id', headerName: '№', width: 100 },
                    { field: 'vid_iz', headerName: 'Вид', width: 120 },
                  ]}
                  rowSelection="single"
                  onRowClicked={(event) => {
                    handleRowSelect(event.data, 'lines');
                    // Trigger zoom to feature when row is clicked
                    onZoomToFeature(event.data, 'lines');
                  }}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={10}
                  rowClassRules={{
                    'selected-row': (params) => 
                      selectedAttributeRow?.type === 'lines' && 
                      selectedAttributeRow.data.id === params.data.id
                  }}
                  getContextMenuItems={(params) => [
                    'copy',
                    'copyWithHeaders',
                    'paste',
                    'separator',
                    'export',
                    {
                      name: 'Показать на карте',
                      action: () => {
                        if (params.node?.data) {
                          onZoomToFeature(params.node.data, 'lines');
                        }
                      }
                    },
                    {
                      name: 'Показать bbox',
                      action: () => {
                        if (params.node?.data) {
                          onShowBbox(params.node.data, 'lines');
                        }
                      }
                    },
                    {
                      name: 'Показать только этот',
                      action: () => {
                        if (params.node?.data) {
                          handleFilterToFeatureLocal(params.node.data, 'lines');
                        }
                      }
                    },
                    ...(filteredFeature?.type === 'lines' ? [{
                      name: 'Показать все',
                      action: () => {
                        handleClearFilterLocal('lines');
                      }
                    }] : [])
                  ]}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Нет данных о линиях</p>
            )}
          </TabsContent>

          {/* Polygons Tab */}
          <TabsContent value="polygons" className="space-y-3">
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
              <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                <AgGridReact
                  rowData={polygonsData}
                  columnDefs={[
                    { field: 'id', headerName: 'ID', width: 100 },
                    { field: 'avts', headerName: 'Автор', width: 120 },
                    { field: 'name_otch', headerName: 'Отчет', width: 150 },
                    { field: 'org_isp', headerName: 'Организация', width: 150 },
                    { field: 'god_nach', headerName: 'Год начала', width: 100 },
                    { field: 'god_end', headerName: 'Год окончания', width: 120 },
                    { field: 'method', headerName: 'Метод', width: 120 },
                    { field: 'nom_1000', headerName: 'Лист', width: 100 },
                    { field: 'scale', headerName: 'Масштаб', width: 100 },
                    { field: 'tgf', headerName: 'ТГФ', width: 100 },
                    { field: 'in_n_rosg', headerName: 'инв. № РГФ', width: 120 },
                    { field: 'in_n_tgf', headerName: 'инв. № ТГФ', width: 120 },
                    { field: 'n_uk_rosg', headerName: '№ РГФ', width: 100 },
                    { field: 'n_uk_tgf', headerName: '№ ТГФ', width: 100 },
                    { field: 'web_uk_id', headerName: '№', width: 100 },
                    { field: 'vid_iz', headerName: 'Вид', width: 120 },
                  ]}
                  rowSelection="single"
                  onRowClicked={(event) => {
                    handleRowSelect(event.data, 'polygons');
                    // Trigger zoom to feature when row is clicked
                    onZoomToFeature(event.data, 'polygons');
                  }}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={10}
                  rowClassRules={{
                    'selected-row': (params) => 
                      selectedAttributeRow?.type === 'polygons' && 
                      selectedAttributeRow.data.id === params.data.id
                  }}
                  getContextMenuItems={(params) => [
                    'copy',
                    'copyWithHeaders',
                    'paste',
                    'separator',
                    'export',
                    {
                      name: 'Показать на карте',
                      action: () => {
                        if (params.node?.data) {
                          onZoomToFeature(params.node.data, 'polygons');
                        }
                      }
                    },
                    {
                      name: 'Показать bbox',
                      action: () => {
                        if (params.node?.data) {
                          onShowBbox(params.node.data, 'polygons');
                        }
                      }
                    },
                    {
                      name: 'Показать только этот',
                      action: () => {
                        if (params.node?.data) {
                          handleFilterToFeatureLocal(params.node.data, 'polygons');
                        }
                      }
                    },
                    ...(filteredFeature?.type === 'polygons' ? [{
                      name: 'Показать все',
                      action: () => {
                        handleClearFilterLocal('polygons');
                      }
                    }] : [])
                  ]}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Нет данных о полигонах</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
