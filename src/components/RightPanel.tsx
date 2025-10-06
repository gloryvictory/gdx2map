import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { MapPin, Route, Square, Flag, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { FeatureTable } from './map/FeatureTable';

interface RightPanelProps {
  hoveredFeatures: any[];
  clickedFeatures: any[];
  children: React.ReactNode;
  showFeatureTable: boolean;
  onToggleFeatureTable: (show: boolean) => void;
  activeInfoMode: 'points' | 'lines' | 'polygons' | null;
  onSetActiveInfoMode: (mode: 'points' | 'lines' | 'polygons' | null) => void;
  showMarkerInfo: boolean;
  onToggleMarkerInfo: (show: boolean) => void;
}

function exportToExcel(features: any[]) {
  if (features.length === 0) return;

  const workbook = XLSX.utils.book_new();

  // Field descriptions
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
    // Add more field descriptions as needed
  };

  // Get all unique keys
  const allKeys = Array.from(new Set(features.flatMap(f => Object.keys(f.properties))));

  // Group by type
  const groups = features.reduce((acc, f) => {
    const type = f.layer.id.split('.')[1];
    if (!acc[type]) acc[type] = [];
    acc[type].push(f);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(groups as Record<string, any[]>).forEach(([type, feats]) => {
    const sheetName = type === 'stp' ? 'Точки' : type === 'stl' ? 'Линии' : 'Полигоны';
    const descriptions = allKeys.map(key => fieldDescriptions[key] || key); // use description or key if no description
    const sheetData = [
      descriptions, // row 1: descriptions
      ...feats.map((f: any) => allKeys.map(key => f.properties[key] || ''))
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  // Add "Все" sheet with all features
  const allDescriptions = [...allKeys.map(key => fieldDescriptions[key] || key), 'Тип'];
  const allData = [
    allDescriptions, // row 1: descriptions
    ...features.map(f => [
      ...allKeys.map(key => f.properties[key] || ''),
      f.layer.id.split('.')[1] === 'stp' ? 'точка' : f.layer.id.split('.')[1] === 'stl' ? 'линия' : 'полигон'
    ])
  ];
  const allWorksheet = XLSX.utils.aoa_to_sheet(allData);
  XLSX.utils.book_append_sheet(workbook, allWorksheet, 'Все');

  // Add "Структура" sheet with field names and descriptions
  const structureData = [
    ['Имя поля', 'Описание'],
    ...allKeys.map(key => [key, fieldDescriptions[key] || ''])
  ];
  const structureWorksheet = XLSX.utils.aoa_to_sheet(structureData);
  XLSX.utils.book_append_sheet(workbook, structureWorksheet, 'Структура');

  XLSX.writeFile(workbook, 'export.xlsx');
}

export function RightPanel({ hoveredFeatures, clickedFeatures, children, showFeatureTable, onToggleFeatureTable, activeInfoMode, onSetActiveInfoMode, showMarkerInfo, onToggleMarkerInfo }: RightPanelProps) {

  const isInfoPanelOpen = activeInfoMode !== null || (showMarkerInfo && clickedFeatures.length > 0);
// isInfoPanelOpen ? 60 : 80
  return (
    <PanelGroup direction="horizontal" key={isInfoPanelOpen ? 'show' : 'hide'}>
      <Panel minSize={40} defaultSize={40}>
        {children}
      </Panel>
      <PanelResizeHandle className="w-1 bg-border" />
      <Panel minSize={0} defaultSize={isInfoPanelOpen ? 20 : 0} className="bg-background">
        <div className="h-full overflow-auto flex flex-col">
          {showMarkerInfo && (
            <div className="flex-1 flex flex-col">
              <div className="sticky top-0 bg-background z-10 pb-3">
                <h3 className="text-sm font-medium mb-3 bg-blue-100 p-2 rounded">Информация под маркером</h3>
                <div className="flex gap-2 px-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToExcel(clickedFeatures)}
                          className="h-8"
                          disabled={clickedFeatures.length === 0}
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Выгрузка в Excel</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="flex-1 overflow-auto px-3 pb-3">
                {clickedFeatures.length > 0 ? (
                  clickedFeatures.map((feature, index) => (
                    <FeatureTable key={`clicked-${index}`} feature={feature} index={index} />
                  ))
                ) : (
                  <p className="text-muted-foreground">Нажмите на карту чтобы поставить маркер и увидеть информацию</p>
                )}
              </div>
            </div>
          )}
          {activeInfoMode && (
            <div className="flex-1 flex flex-col">
              <div className="sticky top-0 bg-background z-10 pb-3">
                <h3 className="text-sm font-medium mb-3 bg-gray-100 p-2 rounded">
                  Информация под курсором - {activeInfoMode === 'points' ? 'точки' : activeInfoMode === 'lines' ? 'линии' : 'полигоны'}
                </h3>
                <div className="flex gap-2 px-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToExcel(hoveredFeatures)}
                          className="h-8"
                          disabled={hoveredFeatures.length === 0}
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Выгрузка в Excel</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="flex-1 overflow-auto px-3 pb-3">
                {hoveredFeatures.length > 0 ? (
                  hoveredFeatures.map((feature, index) => (
                    <FeatureTable key={`hovered-${index}`} feature={feature} index={index} />
                  ))
                ) : (
                  <p className="text-muted-foreground">Наведите курсор на объекты слоев для просмотра атрибутов</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Panel>
      <PanelResizeHandle className="w-1 bg-border" />
      <Panel minSize={4} maxSize={4} defaultSize={4} className="bg-background border-l border-border">
        <div className="h-full flex flex-col items-center justify-start gap-2 p-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeInfoMode === 'points' ? "default" : "outline"}
                  size="icon"
                  onClick={() => onSetActiveInfoMode(activeInfoMode === 'points' ? null : 'points')}
                  className="w-10 h-10"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Информация под курсором - точки</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeInfoMode === 'lines' ? "default" : "outline"}
                  size="icon"
                  onClick={() => onSetActiveInfoMode(activeInfoMode === 'lines' ? null : 'lines')}
                  className="w-10 h-10"
                >
                  <Route className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Информация под курсором - линии</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeInfoMode === 'polygons' ? "default" : "outline"}
                  size="icon"
                  onClick={() => onSetActiveInfoMode(activeInfoMode === 'polygons' ? null : 'polygons')}
                  className="w-10 h-10"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Информация под курсором - полигоны</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showMarkerInfo ? "default" : "outline"}
                  size="icon"
                  onClick={() => onToggleMarkerInfo(!showMarkerInfo)}
                  className="w-10 h-10"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Информация под маркером</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Panel>
    </PanelGroup>
  );
}
