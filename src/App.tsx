import { useMemo, useState } from 'react'
import { MapView } from './components/Map'
import { LIGHT_MAP_STYLE } from './constants/mapStyles'
import { AppHeader } from './components/AppHeader'
import { RightPanel } from './components/RightPanel'
import { ALL_BASEMAPS } from './lib/basemaps'

export default function App() {
	const [basemapKey, setBasemapKey] = useState<string>('light')
	const style = useMemo(() => {
		const found = ALL_BASEMAPS.find((b) => b.key === basemapKey)
		return found?.url ?? LIGHT_MAP_STYLE
	}, [basemapKey])
	return (
		<div className="min-h-screen bg-background text-foreground">
			<AppHeader selectedKey={basemapKey} onChangeStyle={setBasemapKey} />
			<main className="mx-auto max-w-7xl px-4">
				<div style={{ height: 'calc(100vh - 3.5rem)' }}>
					<RightPanel selectedKey={basemapKey} onChangeBasemap={setBasemapKey}>
						<MapView styleUrl={style as any} />
					</RightPanel>
				</div>
			</main>
		</div>
	)
}
