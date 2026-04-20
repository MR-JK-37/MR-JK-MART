import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

const appVersion = process.env.GITHUB_SHA
  ? process.env.GITHUB_SHA.slice(0, 12)
  : execSync('git rev-parse --short=12 HEAD').toString().trim()

export default defineConfig({
  base: '/MR-JK-MART/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
