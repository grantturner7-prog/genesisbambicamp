import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Two real pages: "/" (landing) and "/facilities/" (3D camp map).
// `base: './'` keeps the build portable to any host or sub-path.
export default defineConfig({
  base: './',
  // Separate dev-server caches let several checkouts run side by side.
  cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        facilities: resolve(__dirname, 'facilities/index.html'),
      },
    },
  },
})
