import { useMemo } from 'react';
import proj4 from 'proj4';

export function BottomPanel({
  mouseCoords,
  coordSystem,
  onCoordSystemChange,
  zoom,
  isLoading
}: {
  mouseCoords: {lng: number, lat: number} | null;
  coordSystem: 'EPSG:4326' | 'EPSG:3857';
  onCoordSystemChange: (system: 'EPSG:4326' | 'EPSG:3857') => void;
  zoom: number;
  isLoading: boolean;
}) {
  const displayedCoords = useMemo(() => {
    if (!mouseCoords) return null;

    if (coordSystem === 'EPSG:4326') {
      return { x: mouseCoords.lng.toFixed(6), y: mouseCoords.lat.toFixed(6) };
    } else {
      // Преобразование в EPSG:3857 (Web Mercator)
      const [x, y] = proj4('EPSG:4326', 'EPSG:3857', [mouseCoords.lng, mouseCoords.lat]);
      return { x: Math.round(x).toString(), y: Math.round(y).toString() };
    }
  }, [mouseCoords, coordSystem]);

  const scale = useMemo(() => {
    // More accurate scale for Web Mercator, using latitude if available
    const lat = mouseCoords ? mouseCoords.lat : 0; // Use equator if no mouse coords
    const metersPerPixel = 156543.0339 * Math.cos(lat * Math.PI / 180) / (2 ** zoom);
    return Math.round(1 / metersPerPixel);
  }, [zoom, mouseCoords]);

  return (
    <div className="bg-gray-200 border-t border-border flex items-center justify-between h-full px-4">
      <div className="flex items-center justify-center gap-2">
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        )}
        <p className="text-sm text-muted-foreground">Bottom Panel</p>
      </div>
      <div className="flex items-center gap-2">
        {displayedCoords && (
          <span className="text-sm text-muted-foreground">
            {displayedCoords.x}, {displayedCoords.y}
          </span>
        )}
        <select
          value={coordSystem}
          onChange={(e) => onCoordSystemChange(e.target.value as 'EPSG:4326' | 'EPSG:3857')}
          className="text-sm border border-border rounded px-2 py-1 bg-background"
        >
          <option value="EPSG:4326">EPSG:4326</option>
          <option value="EPSG:3857">EPSG:3857</option>
        </select>
        <span className="text-sm text-muted-foreground">Масштаб: 1:{scale.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground">Zoom: {zoom.toFixed(1)}</span>
      </div>
    </div>
  );
}
