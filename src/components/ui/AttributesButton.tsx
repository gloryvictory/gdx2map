import { Button } from './button';
import { Table } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface AttributesButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function AttributesButton({ onClick, isActive }: AttributesButtonProps) {
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
            <Table className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Атрибуты</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
