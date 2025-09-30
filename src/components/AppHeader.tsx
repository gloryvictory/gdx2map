import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

interface AppHeaderProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export function AppHeader({ theme, onThemeChange }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur h-14">
      <div className="mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
        <h1 className="text-lg font-semibold">gdx2map</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
