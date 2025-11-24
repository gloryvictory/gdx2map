// biome-ignore assist/source/organizeImports: <explanation>
import services from '../data/services.json';
import { BASEMAPS as PRESET_BASEMAPS, createXyzRasterStyle } from '../constants/mapStyles';
import type { BasemapEntry, ServiceCatalog, ServiceCategory, TmsEntry } from '../types';

// Use shared BasemapEntry from types

function expandBracketHost(url: string): string[] {
  // Expand patterns like [0123], [abcd], [1234] into multiple URLs
  const match = url.match(/\[(.+?)\]/);
  if (!match) return [url];
  const chars = match[1].split('');
  return chars.map((ch) => url.replace(match[0], ch));
}

function convertTemplate(url: string): string {
  return url
    .replace(/\{LEVEL\}/g, '{z}')
    .replace(/\{ROW\}/g, '{x}')
    .replace(/\{COL\}/g, '{y}');
}

function buildFromServices(): BasemapEntry[] {
  const list: BasemapEntry[] = [];
  try {
    const svc = services as unknown as ServiceCatalog;
    const categories = (svc?.services?.category ?? []) as ServiceCategory[];
    for (const cat of categories) {
      for (const t of (cat.tms ?? []) as TmsEntry[]) {
        if (t.type !== 'xyz' || !t.url) continue;
        
        // Исключаем нежелательные карты
        if ((cat.name === 'Here' && t.title === 'Ландшафт (англ)') ||
            (cat.name === 'TomTom' && t.title === 'Пробки')) {
          continue;
        }
        
        const tiles = expandBracketHost(convertTemplate(String(t.url)));
        const style = createXyzRasterStyle(tiles, t.title ?? cat.name);
        list.push({
          key: t.name,
          label: `${cat.name}: ${t.title ?? t.name}`,
          url: style,
        });
      }
    }
  } catch {
    // ignore if services.json missing or invalid
  }
  return list;
}

export const ALL_BASEMAPS: ReadonlyArray<BasemapEntry> = [
  { key: 'none', label: 'Без базовой карты', url: null },
  ...PRESET_BASEMAPS,
  ...buildFromServices(),
];
