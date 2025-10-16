import { Map } from 'lucide-react';
import { Button } from './button';

interface LegendButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function LegendButton({ onClick, isActive }: LegendButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="icon"
      onClick={onClick}
      className="w-10 h-10"
    >
      <Map className="w-4 h-4" />
    </Button>
  );
}
