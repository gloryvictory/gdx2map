import { HomeButton } from './ui/HomeButton';
import { LayersButton } from './ui/LayersButton';
import { BaseMapsButton } from './ui/SettingsButton';
import { UserButton } from './ui/UserButton';

interface LeftPanelProps {
  onLayersClick: () => void;
  onBaseMapsClick: () => void;
  isLayersActive: boolean;
  isBaseMapsActive: boolean;
}

export function LeftPanel({ onLayersClick, onBaseMapsClick, isLayersActive, isBaseMapsActive }: LeftPanelProps) {
  return (
    <div className="flex flex-col items-center justify-start gap-2 p-2 bg-background border-r border-border">
      <HomeButton />
      <LayersButton onClick={onLayersClick} isActive={isLayersActive} />
      <BaseMapsButton onClick={onBaseMapsClick} isActive={isBaseMapsActive} />
      <UserButton />
    </div>
  );
}
