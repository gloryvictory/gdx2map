import { Button } from './button';
import { Layers } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface BaseMapsButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function BaseMapsButton({ onClick, isActive }: BaseMapsButtonProps) {
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
            <Layers className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Базовые карты</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
