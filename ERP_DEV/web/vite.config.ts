import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dev only: forward /api to local erp-app (see DAY-ONE §5). Prod serves
  // the built shell behind the same host as the API (VITE_API_URL blank).
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
