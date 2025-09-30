import { Button } from './button';
import { User } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export function UserButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="w-10 h-10">
            <User className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>User</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
