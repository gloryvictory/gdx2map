import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { ALL_BASEMAPS } from '../lib/basemaps'

interface RightPanelProps {
	selectedKey: string
	onChangeBasemap: (key: string) => void
	children: React.ReactNode
}

export function RightPanel({ selectedKey, onChangeBasemap, children }: RightPanelProps) {
	return (
		<PanelGroup direction="horizontal">
			<Panel minSize={40} defaultSize={70}>
				{children}
			</Panel>
			<PanelResizeHandle className="w-1 bg-border" />
			<Panel minSize={20} defaultSize={30} className="bg-background">
				<div className="h-full overflow-auto p-3">
					<Tabs defaultValue="basemaps" className="w-full">
						<TabsList className="w-full">
							<TabsTrigger value="basemaps" className="flex-1">Базовые карты</TabsTrigger>
						</TabsList>
						<TabsContent value="basemaps" className="mt-3">
							<RadioGroup value={selectedKey} onValueChange={onChangeBasemap}>
								<div className="space-y-2">
									{ALL_BASEMAPS.map((b) => (
										<div key={b.key} className="flex items-center gap-2">
											<RadioGroupItem id={`basemap-${b.key}`} value={b.key} />
											<Label htmlFor={`basemap-${b.key}`}>{b.label}</Label>
										</div>
									))}
								</div>
							</RadioGroup>
						</TabsContent>
					</Tabs>
				</div>
			</Panel>
		</PanelGroup>
	)
} 
