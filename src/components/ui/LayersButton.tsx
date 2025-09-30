import { Button } from './button';
import { Layers2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface LayersButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function LayersButton({ onClick, isActive }: LayersButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="icon"
            className="w-10 h-10"
            onClick={onClick}
          >
            <Layers2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Слои</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
