import { Button } from './button';
import { Home } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export function HomeButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Home className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Home</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
