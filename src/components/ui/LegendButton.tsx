import { Map } from "lucide-react";
import { Button } from "./button";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

interface LegendButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function LegendButton({ onClick, isActive }: LegendButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? "default" : "outline"}
          size="icon"
          onClick={onClick}
          className="w-10 h-10"
        >
          <Map className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">Легенда</TooltipContent>
    </Tooltip>
  );
}
