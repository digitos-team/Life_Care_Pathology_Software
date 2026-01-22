import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // For `npm run dev`
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },

  // ✅ For `vite preview`
  preview: {
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
})
