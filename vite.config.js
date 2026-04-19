import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/MR-JK-MART/',
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
