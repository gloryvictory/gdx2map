import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		proxy: {
			'/gdx2': {
				target: 'http://r48-vgeohub01.zsniigg.local:7800',
				changeOrigin: true,
				secure: false,
			},
		},
	},
})
