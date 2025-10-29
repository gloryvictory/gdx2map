import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Feature } from '../types';

interface LuMarkerPanelProps {
  selectedLu: Feature | null;
  onMarkerPlace: (lu: Feature, showInfo?: boolean) => void;
}

export function LuMarkerPanel({ selectedLu, onMarkerPlace }: LuMarkerPanelProps) {
  return (
    <div className="sticky top-0 bg-background z-10 pb-3">
      <h3 className="text-sm font-medium mb-3 bg-purple-100 p-2 rounded">Выбрать по ЛУ</h3>
      <div className="flex gap-2 px-3 pb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10"
                onClick={() => selectedLu && onMarkerPlace(selectedLu, false)}
                disabled={!selectedLu}
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Поставить маркер</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
