import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { Eye } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface AttributesPanelProps {
  visibleLayers: Set<string>;
  onLayerToggle: (layerName: string, checked: boolean) => void;
  pointsData: any[];
  linesData: any[];
  polygonsData: any[];
  highlightedPoints: Set<string>;
  highlightedLines: Set<string>;
  highlightedPolygons: Set<string>;
  onToggleHighlightPoints: () => void;
  onToggleHighlightLines: () => void;
  onToggleHighlightPolygons: () => void;
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
  onToggleHighlightPolygons
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
          <div className="mb-2">
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
          </div>
          <div className="ag-theme-alpine" style={{ height: 300, width: '100%' }}>
            <AgGridReact
              key={pointsData.length}
              rowData={pointsData}
              columnDefs={columns}
              defaultColDef={{ flex: 1, minWidth: 100 }}
              ensureDomOrder
              suppressNoRowsOverlay={false}
            />
          </div>
        </TabsContent>
        <TabsContent value="lines">
          <div className="mb-2">
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
          </div>
          <div className="ag-theme-alpine" style={{ height: 300, width: '100%' }}>
            <AgGridReact
              key={linesData.length}
              rowData={linesData}
              columnDefs={columns}
              defaultColDef={{ flex: 1, minWidth: 100 }}
              ensureDomOrder
              suppressNoRowsOverlay={false}
            />
          </div>
        </TabsContent>
        <TabsContent value="polygons">
          <div className="mb-2">
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
          </div>
          <div className="ag-theme-alpine" style={{ height: 300, width: '100%' }}>
            <AgGridReact
              key={polygonsData.length}
              rowData={polygonsData}
              columnDefs={columns}
              defaultColDef={{ flex: 1, minWidth: 100 }}
              ensureDomOrder
              suppressNoRowsOverlay={false}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
