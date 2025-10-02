import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TableProperties } from 'lucide-react';
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
  children: React.ReactNode;
}

export function RightPanel({ hoveredFeatures, children }: RightPanelProps) {
  const [showFeatureTable, setShowFeatureTable] = useState(true);

  return (
    <PanelGroup direction="horizontal" key={showFeatureTable ? 'show' : 'hide'}>
      <Panel minSize={40} defaultSize={showFeatureTable ? 60 : 80}>
        {children}
      </Panel>
      <PanelResizeHandle className="w-1 bg-border" />
      <Panel minSize={0} defaultSize={showFeatureTable ? 20 : 0} className="bg-background">
        <div className="h-full overflow-auto p-3">
          <h3 className="text-sm font-medium mb-3 bg-gray-100 p-2 rounded">Информация под курсором</h3>
          {hoveredFeatures.length > 0 ? (
            hoveredFeatures.map((feature, index) => (
              <FeatureTable key={index} feature={feature} index={index} />
            ))
          ) : (
            <p className="text-muted-foreground">Наведите курсор на объекты слоев для просмотра атрибутов</p>
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
                  variant={showFeatureTable ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowFeatureTable(!showFeatureTable)}
                  className="w-10 h-10"
                >
                  <TableProperties className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Под курсором</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Add more buttons here if needed */}
        </div>
      </Panel>
    </PanelGroup>
  );
}
