import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Compute bbox for GeoJSON-like coordinates
export function computeCoordinatesBbox(coordinates: any): [number, number, number, number] {
  const update = (pt: [number, number]) => {
    if (pt[0] < minX) minX = pt[0];
    if (pt[0] > maxX) maxX = pt[0];
    if (pt[1] < minY) minY = pt[1];
    if (pt[1] > maxY) maxY = pt[1];
  };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (coords: any) => {
    if (!coords) return;
    if (typeof coords[0] === 'number') {
      update(coords as [number, number]);
      return;
    }
    for (const c of coords) walk(c);
  };
  walk(coordinates);
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return [0, 0, 0, 0];
  }
  return [minX, minY, maxX, maxY];
}
