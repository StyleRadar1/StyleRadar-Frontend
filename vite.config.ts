import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/mapbox-gl') || id.includes('node_modules/react-map-gl')) {
            return 'vendor-mapbox'
          }
          if (id.includes('node_modules/@mediapipe/tasks-vision')) {
            return 'vendor-mediapipe'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
        },
      },
    },
  },
})
