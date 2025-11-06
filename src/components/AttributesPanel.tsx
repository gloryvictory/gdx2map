import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { Eye, MapPin, Filter, FilterX, Download, Square, BookKey, FileSearch } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
 TooltipTrigger,
} from './ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ui/context-menu';
import { BACKEND_SERVER_URL, RGF_URL } from '../config';
import { useState } from 'react';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

import type { ReportRow, SelectedAttributeRow, FilteredFeature } from '../types';

interface AttributesPanelProps {
  visibleLayers: Set<string>;
  onLayerToggle: (layerName: string, checked: boolean) => void;
  pointsData: ReportRow[];
  linesData: ReportRow[];
  polygonsData: ReportRow[];
  highlightedPoints: Set<string>;
  highlightedLines: Set<string>;
  highlightedPolygons: Set<string>;
  onToggleHighlightPoints: () => void;
  onToggleHighlightLines: () => void;
  onToggleHighlightPolygons: () => void;
  selectedAttributeRow: SelectedAttributeRow | null;
  onAttributeRowSelect: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onZoomToFeature: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onFilterToFeature: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onClearFilter: (type: 'points' | 'lines' | 'polygons') => void;
  filteredFeature: FilteredFeature | null;
  onShowBbox: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
  onShowReportCard?: (row: ReportRow, type: 'points' | 'lines' | 'polygons') => void;
}

export function AttributesPanel({
  visibleLayers,
  onLayerToggle,
  pointsData,
  linesData,
  polygonsData,
  highlightedPoints,
  highlightedLines,
  highlightedPolygons,
  onToggleHighlightPoints,
  onToggleHighlightLines,
  onToggleHighlightPolygons,
  selectedAttributeRow,
  onAttributeRowSelect,
  onZoomToFeature,
  onFilterToFeature,
  onClearFilter,
  filteredFeature,
  onShowBbox,
  onShowReportCard
}: AttributesPanelProps) {

  const fieldDescriptions: Record<string, string> = {
    avts: 'Автор',
    name_otch: 'Отчет',
    org_isp: 'Организация',
    god_nach: 'Год начала',
    god_end: 'Год окончания',
    method: 'Метод',
    nom_1000: 'Лист',
    scale: 'Масштаб',
    tgf: 'ТГФ',
    in_n_rosg: 'инв. № РГФ',
    in_n_tgf: 'инв. № ТГФ',
    n_uk_rosg: '№ РГФ',
    n_uk_tgf: '№ ТГФ',
    web_uk_id: '№',
    vid_iz: 'Вид',
    id: '№',
    name_otch1: 'Отчет (дополнительно)',
  };

  const getColumns = (): ColDef[] => {
    return Object.keys(fieldDescriptions).map(key => ({ field: key, headerName: fieldDescriptions[key] || key }));
  };

  const columns = getColumns();

  const checkRegistryAvailability = async (data: ReportRow[], type: 'points' | 'lines' | 'polygons') => {
    // For now, we'll implement a simpler approach by showing an alert with the counts
    // In a real implementation, we would need to update the grid's rowData and column definitions
    const results = await Promise.all(data.map(async (row) => {
      if (row.n_uk_rosg && row.n_uk_rosg !== 'None') {
        try {
          const response = await fetch(`${BACKEND_SERVER_URL}${RGF_URL}${row.n_uk_rosg}`);
          if (response.ok) {
            const result = await response.json();
            return { id: row.id, hasRegistry: result && result.count > 0 };
          } else {
            return { id: row.id, hasRegistry: false };
          }
        } catch (error) {
          console.error('Error checking registry for RGF number:', row.n_uk_rosg, error);
          return { id: row.id, hasRegistry: false };
        }
      } else {
        return { id: row.id, hasRegistry: false };
      }
    }));

    const foundCount = results.filter(r => r.hasRegistry).length;
    const notFoundCount = results.length - foundCount;
    
    alert(`Проверка реестра завершена:\nНайдено: ${foundCount}\nНе найдено: ${notFoundCount}`);
  };

  const exportToExcel = (data: ReportRow[], filename: string) => {
    // Create a mapping from English keys to Russian labels
    const tableRows = [
      { label: 'Автор', key: 'avts' },
      { label: 'Отчет', key: 'name_otch' },
      { label: 'Организация', key: 'org_isp' },
      { label: 'Год начала', key: 'god_nach' },
      { label: 'Год окончания', key: 'god_end' },
      { label: 'Метод', key: 'method' },
      { label: 'Лист', key: 'nom_1000' },
      { label: 'Масштаб', key: 'scale' },
      { label: 'ТГФ', key: 'tgf' },
      { label: 'инв. № РГФ', key: 'in_n_rosg' },
      { label: 'инв. № ТГФ', key: 'in_n_tgf' },
      { label: '№ РГФ', key: 'n_uk_rosg' },
      { label: '№ ТГФ', key: 'n_uk_tgf' },
      { label: '№', key: 'web_uk_id' },
      { label: 'Вид', key: 'vid_iz' },
      { label: '№', key: 'id' },
    ];

    // Transform data to use Russian column names
    const transformedData = data.map(row => {
      const newRow: Record<string, string | number> = {};
      tableRows.forEach(({ label, key }) => {
        const value = row[key];
        newRow[label] = (value != null ? value : '') as string | number;
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(transformedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="bg-background border-t border-border p-4">
      <h3 className="text-lg font-semibold mb-3">Атрибуты</h3>
      <Tabs defaultValue="points" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="points">Точки ({pointsData.length})</TabsTrigger>
          <TabsTrigger value="lines">Линии ({linesData.length})</TabsTrigger>
          <TabsTrigger value="polygons">Полигоны ({polygonsData.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="points">
          <div className="mb-2 flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleHighlightPoints}
                    className="h-8"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {highlightedPoints.size > 0 ? 'Вернуть обратно' : 'Показать на карте'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{highlightedPoints.size > 0 ? 'Убрать подсветку точек' : 'Подсветить все точки на карте'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToExcel(pointsData, 'points.xlsx')}
                    className="h-8"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Экспорт в Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Экспортировать данные точек в Excel файл</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkRegistryAvailability(pointsData, 'points')}
                    className="h-8"
                  >
                    <FileSearch className="w-4 h-4 mr-1" />
                    Сверка с реестром
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Проверить наличие записей в реестре</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="ag-theme-alpine ag-grid-container">
            <ContextMenu>
              <ContextMenuTrigger>
                <AgGridReact
                  theme="legacy"
                  key={pointsData.length}
                  rowData={pointsData}
                  columnDefs={columns}
                  defaultColDef={{ flex: 1, minWidth: 140, filter: true }}
                  ensureDomOrder
                  suppressNoRowsOverlay={false}
                  rowSelection="single"
                  rowMultiSelectWithClick={false}
                  suppressRowClickSelection={false}
                  onRowClicked={(event) => onAttributeRowSelect(event.data, 'points')}
                  getRowClass={(params) => {
                    if (selectedAttributeRow && selectedAttributeRow.type === 'points' && selectedAttributeRow.data.id === params.data.id) {
                      return 'selected-row';
                    }
                    return '';
                  }}
                  onGridReady={(params) => {
                    // Store grid API for context menu
                    (params.api as any).__contextMenuType = 'points';
                    (params.api as any).__onZoomToFeature = onZoomToFeature;
                    (params.api as any).__onShowBbox = onShowBbox;
                  }}
                />
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => {
                  console.log('Zoom to feature clicked for points');
                  // Use selectedAttributeRow instead of querying grid
                  const selectedRow = selectedAttributeRow?.data;
                  console.log('selectedRow for zoom:', selectedRow, 'type: points');
                  if (selectedRow) {
                    onZoomToFeature(selectedRow, 'points');
                  } else {
                    console.log('No selected row found for zoom');
                  }
                }}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Показать на карте
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                  console.log('Show bbox clicked for points');
                  // Use the passed onShowBbox directly
                  const selectedRow = selectedAttributeRow?.data;
                  if (selectedRow && onShowBbox) {
                    console.log('Calling onShowBbox with:', selectedRow, 'points');
                    onShowBbox(selectedRow, 'points');
                  } else {
                    console.log('No selected row or onShowBbox function');
                  }
                }}>
                  <Square className="w-4 h-4 mr-2" />
                  Показать bbox
                </ContextMenuItem>
                {onShowReportCard && (
                  <ContextMenuItem onClick={() => {
                    const selectedRow = selectedAttributeRow?.data;
                    if (selectedRow) {
                      onShowReportCard(selectedRow, 'points');
                    }
                  }}>
                    <BookKey className="w-4 h-4 mr-2" />
                    Показать карточку отчета
                  </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => {
                  // Get the grid API from the context
                  const grids = document.querySelectorAll('.ag-theme-alpine .ag-root-wrapper');
                  let selectedRow = null;
                  let type = 'points';
                  for (const grid of grids) {
                    const api = (grid as any).__agGridApi;
                    if (api && api.getSelectedRows) {
                      const selectedRows = api.getSelectedRows();
                      if (selectedRows.length > 0) {
                        selectedRow = selectedRows[0];
                        type = (grid as any).__contextMenuType || 'points';
                        break;
                      }
                    }
                  }
                  if (selectedRow) {
                    onFilterToFeature(selectedRow, type as 'points' | 'lines' | 'polygons');
                  }
                }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Показать только этот
                </ContextMenuItem>
                {filteredFeature && filteredFeature.type === 'points' && (
                  <ContextMenuItem onClick={() => onClearFilter('points')}>
                    <FilterX className="w-4 h-4 mr-2" />
                    Показать все
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </TabsContent>
        <TabsContent value="lines">
          <div className="mb-2 flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleHighlightLines}
                    className="h-8"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {highlightedLines.size > 0 ? 'Вернуть обратно' : 'Показать на карте'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{highlightedLines.size > 0 ? 'Убрать подсветку линий' : 'Подсветить все линии на карте'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToExcel(linesData, 'lines.xlsx')}
                    className="h-8"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Экспорт в Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Экспортировать данные линий в Excel файл</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="ag-theme-alpine ag-grid-container">
            <ContextMenu>
              <ContextMenuTrigger>
                <AgGridReact
                  theme="legacy"
                  key={linesData.length}
                  rowData={linesData}
                  columnDefs={columns}
                  defaultColDef={{ flex: 1, minWidth: 140, filter: true }}
                  ensureDomOrder
                  suppressNoRowsOverlay={false}
                  rowSelection="single"
                  rowMultiSelectWithClick={false}
                  suppressRowClickSelection={false}
                  onRowClicked={(event) => onAttributeRowSelect(event.data, 'lines')}
                  getRowClass={(params) => {
                    if (selectedAttributeRow && selectedAttributeRow.type === 'lines' && selectedAttributeRow.data.id === params.data.id) {
                      return 'selected-row';
                    }
                    return '';
                  }}
                  onGridReady={(params) => {
                    // Store grid API for context menu
                    (params.api as any).__contextMenuType = 'lines';
                    (params.api as any).__onZoomToFeature = onZoomToFeature;
                    (params.api as any).__onShowBbox = onShowBbox;
                  }}
                />
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => {
                  console.log('Zoom to feature clicked for lines');
                  // Use selectedAttributeRow instead of querying grid
                  const selectedRow = selectedAttributeRow?.data;
                  console.log('selectedRow for zoom:', selectedRow, 'type: lines');
                  if (selectedRow) {
                    onZoomToFeature(selectedRow, 'lines');
                  } else {
                    console.log('No selected row found for zoom');
                  }
                }}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Показать на карте
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                  console.log('Show bbox clicked for lines');
                  // Use the passed onShowBbox directly
                  const selectedRow = selectedAttributeRow?.data;
                  if (selectedRow && onShowBbox) {
                    console.log('Calling onShowBbox with:', selectedRow, 'lines');
                    onShowBbox(selectedRow, 'lines');
                  } else {
                    console.log('No selected row or onShowBbox function');
                  }
                }}>
                  <Square className="w-4 h-4 mr-2" />
                  Показать bbox
                </ContextMenuItem>
                {onShowReportCard && (
                  <ContextMenuItem onClick={() => {
                    const selectedRow = selectedAttributeRow?.data;
                    if (selectedRow && onShowReportCard) {
                      onShowReportCard(selectedRow, 'lines');
                    }
                  }}>
                    <BookKey className="w-4 h-4 mr-2" />
                    Показать карточку отчета
                  </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => {
                  // Get the grid API from the context
                  const grids = document.querySelectorAll('.ag-theme-alpine .ag-root-wrapper');
                  let selectedRow = null;
                  let type = 'lines';
                  for (const grid of grids) {
                    const api = (grid as any).__agGridApi;
                    if (api && api.getSelectedRows) {
                      const selectedRows = api.getSelectedRows();
                      if (selectedRows.length > 0) {
                        selectedRow = selectedRows[0];
                        type = (grid as any).__contextMenuType || 'lines';
                        break;
                      }
                    }
                  }
                  if (selectedRow) {
                    onFilterToFeature(selectedRow, type as 'points' | 'lines' | 'polygons');
                  }
                }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Показать только этот
                </ContextMenuItem>
                {filteredFeature && filteredFeature.type === 'lines' && (
                  <ContextMenuItem onClick={() => onClearFilter('lines')}>
                    <FilterX className="w-4 h-4 mr-2" />
                    Показать все
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          </div>
          <div className="mb-2 flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkRegistryAvailability(linesData, 'lines')}
                    className="h-8"
                  >
                    <FileSearch className="w-4 h-4 mr-1" />
                    Сверка с реестром
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Проверить наличие записей в реестре</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TabsContent>
        <TabsContent value="polygons">
          <div className="mb-2 flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleHighlightPolygons}
                    className="h-8"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {highlightedPolygons.size > 0 ? 'Вернуть обратно' : 'Показать на карте'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{highlightedPolygons.size > 0 ? 'Убрать подсветку полигонов' : 'Подсветить все полигоны на карте'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToExcel(polygonsData, 'polygons.xlsx')}
                    className="h-8"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Экспорт в Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Экспортировать данные полигонов в Excel файл</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkRegistryAvailability(polygonsData, 'polygons')}
                    className="h-8"
                  >
                    <FileSearch className="w-4 h-4 mr-1" />
                    Сверка с реестром
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Проверить наличие записей в реестре</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="ag-theme-alpine ag-grid-container">
            <ContextMenu>
              <ContextMenuTrigger>
                <AgGridReact
                  theme="legacy"
                  key={polygonsData.length}
                  rowData={polygonsData}
                  columnDefs={columns}
                  defaultColDef={{ flex: 1, minWidth: 140, filter: true }}
                  ensureDomOrder
                  suppressNoRowsOverlay={false}
                  rowSelection="single"
                  rowMultiSelectWithClick={false}
                  suppressRowClickSelection={false}
                  onRowClicked={(event) => onAttributeRowSelect(event.data, 'polygons')}
                  getRowClass={(params) => {
                    if (selectedAttributeRow && selectedAttributeRow.type === 'polygons' && selectedAttributeRow.data.id === params.data.id) {
                      return 'selected-row';
                    }
                    return '';
                  }}
                  onGridReady={(params) => {
                    // Store grid API for context menu
                    (params.api as any).__contextMenuType = 'polygons';
                    (params.api as any).__onZoomToFeature = onZoomToFeature;
                    (params.api as any).__onShowBbox = onShowBbox;
                  }}
                />
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => {
                  console.log('Zoom to feature clicked for polygons');
                  // Use selectedAttributeRow instead of querying grid
                  const selectedRow = selectedAttributeRow?.data;
                  console.log('selectedRow for zoom:', selectedRow, 'type: polygons');
                  if (selectedRow) {
                    onZoomToFeature(selectedRow, 'polygons');
                  } else {
                    console.log('No selected row found for zoom');
                  }
                }}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Показать на карте
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                  console.log('Show bbox clicked for polygons');
                  // Use the passed onShowBbox directly
                  const selectedRow = selectedAttributeRow?.data;
                  if (selectedRow && onShowBbox) {
                    console.log('Calling onShowBbox with:', selectedRow, 'polygons');
                    onShowBbox(selectedRow, 'polygons');
                  } else {
                    console.log('No selected row or onShowBbox function');
                  }
                }}>
                  <Square className="w-4 h-4 mr-2" />
                  Показать bbox
                </ContextMenuItem>
                {onShowReportCard && (
                  <ContextMenuItem onClick={() => {
                    const selectedRow = selectedAttributeRow?.data;
                    if (selectedRow && onShowReportCard) {
                      onShowReportCard(selectedRow, 'polygons');
                    }
                  }}>
                    <BookKey className="w-4 h-4 mr-2" />
                    Показать карточку отчета
                  </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => {
                  // Get the grid API from the context
                  const grids = document.querySelectorAll('.ag-theme-alpine .ag-root-wrapper');
                  let selectedRow = null;
                  let type = 'polygons';
                  for (const grid of grids) {
                    const api = (grid as any).__agGridApi;
                    if (api && api.getSelectedRows) {
                      const selectedRows = api.getSelectedRows();
                      if (selectedRows.length > 0) {
                        selectedRow = selectedRows[0];
                        type = (grid as any).__contextMenuType || 'polygons';
                        break;
                      }
                    }
                  }
                  if (selectedRow) {
                    onFilterToFeature(selectedRow, type as 'points' | 'lines' | 'polygons');
                  }
                }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Показать только этот
                </ContextMenuItem>
                {filteredFeature && filteredFeature.type === 'polygons' && (
                  <ContextMenuItem onClick={() => onClearFilter('polygons')}>
                    <FilterX className="w-4 h-4 mr-2" />
                    Показать все
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
