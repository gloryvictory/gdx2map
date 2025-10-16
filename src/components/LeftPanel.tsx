import { HomeButton } from './ui/HomeButton';
import { LayersButton } from './ui/LayersButton';
import { BaseMapsButton } from './ui/SettingsButton';
import { LegendButton } from './ui/LegendButton';
import { AttributesButton } from './ui/AttributesButton';
import { UserButton } from './ui/UserButton';

interface LeftPanelProps {
  onLayersClick: () => void;
  onBaseMapsClick: () => void;
  onLegendClick: () => void;
  onAttributesClick: () => void;
  isLayersActive: boolean;
  isBaseMapsActive: boolean;
  isLegendActive: boolean;
  isAttributesActive: boolean;
}

export function LeftPanel({ onLayersClick, onBaseMapsClick, onLegendClick, onAttributesClick, isLayersActive, isBaseMapsActive, isLegendActive, isAttributesActive }: LeftPanelProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-2 p-2 bg-background border-r border-border h-full">
      <div className="flex flex-col items-center gap-2">
        <HomeButton />
        <LayersButton onClick={onLayersClick} isActive={isLayersActive} />
        <BaseMapsButton onClick={onBaseMapsClick} isActive={isBaseMapsActive} />
        <LegendButton onClick={onLegendClick} isActive={isLegendActive} />
        <AttributesButton onClick={onAttributesClick} isActive={isAttributesActive} />
      </div>
      <UserButton />
    </div>
  );
}
