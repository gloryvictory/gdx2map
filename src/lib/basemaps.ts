// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// biome-ignore assist/source/organizeImports: <explanation>
import services from '../data/services.json'
import { BASEMAPS as PRESET_BASEMAPS, createXyzRasterStyle } from '../constants/mapStyles'


type BasemapEntry = {
	key: string
	label: string
	url: string | object
}

function expandBracketHost(url: string): string[] {
	// Expand patterns like [0123], [abcd], [1234] into multiple URLs
	const match = url.match(/\[(.+?)\]/)
	if (!match) return [url]
	const chars = match[1].split('')
	return chars.map((ch) => url.replace(match[0], ch))
}

function convertTemplate(url: string): string {
	return url
		.replace(/\{LEVEL\}/g, '{z}')
		.replace(/\{ROW\}/g, '{x}')
		.replace(/\{COL\}/g, '{y}')
}

function buildFromServices(): BasemapEntry[] {
	const list: BasemapEntry[] = []
	try {
		const categories = (services?.services?.category ?? []) as Array<any>
		for (const cat of categories) {
			for (const t of cat.tms ?? []) {
				if (t.type !== 'xyz' || !t.url) continue
				const tiles = expandBracketHost(convertTemplate(String(t.url)))
				const style = createXyzRasterStyle(tiles, t.title ?? cat.name)
				list.push({ key: t.name, label: `${cat.name}: ${t.title ?? t.name}`, url: style })
			}
		}
	} catch {
		// ignore if services.json missing or invalid
	}
	return list
}

export const ALL_BASEMAPS: ReadonlyArray<BasemapEntry> = [
	...PRESET_BASEMAPS,
	...buildFromServices(),
] 
