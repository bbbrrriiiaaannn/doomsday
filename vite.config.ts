/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/doomsday/ on GitHub Pages.
  base: '/doomsday/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
