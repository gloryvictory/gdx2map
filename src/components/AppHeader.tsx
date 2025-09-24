import { Button } from './ui/button'
import { BASEMAPS } from '../constants/mapStyles'

interface AppHeaderProps {
	selectedKey: string
	onChangeStyle: (nextKey: string) => void
}

export function AppHeader({ selectedKey, onChangeStyle }: AppHeaderProps) {
	return (
		<header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur h-14">
			<div className="mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
				<h1 className="text-lg font-semibold">gdx2map</h1>
				<div className="flex items-center gap-2">
					<label className="text-sm">Базовая карта:</label>
					<select
						aria-label="Базовая карта"
						className="h-9 rounded-md border bg-background px-2 text-sm"
						value={selectedKey}
						onChange={(e) => onChangeStyle(e.target.value)}
					>
						{BASEMAPS.map((b) => (
							<option key={b.key} value={b.key}>
								{b.label}
							</option>
						))}
					</select>
					<Button>Кнопка</Button>
					<Button variant="secondary">Вторичная</Button>
				</div>
			</div>
		</header>
	)
}
