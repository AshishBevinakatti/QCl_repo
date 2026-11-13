import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dev only: forward /api to local erp-app (see DAY-ONE §5). Prod serves
  // the built shell behind the same host as the API (VITE_API_URL blank).
  server: {
    proxy: {
      '/api/v1/sales': 'http://localhost:8082',
      '/api/v1/portal': 'http://localhost:8082',
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
