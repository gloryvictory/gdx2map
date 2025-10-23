import { Button } from './button';
import { MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface LuSelectButtonProps {
  onClick: () => void;
  isActive: boolean;
  isDisabled: boolean;
}

export function LuSelectButton({ onClick, isActive, isDisabled }: LuSelectButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="icon"
            className="w-10 h-10"
            onClick={onClick}
            disabled={isDisabled}
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Выбрать по ЛУ</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
