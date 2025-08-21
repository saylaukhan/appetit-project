import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'f93ddae4f6a8.ngrok-free.app'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})