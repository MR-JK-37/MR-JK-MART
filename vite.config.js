import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const appVersion = process.env.GITHUB_SHA
  ? process.env.GITHUB_SHA.slice(0, 12)
  : execSync('git rev-parse --short=12 HEAD').toString().trim()

export default defineConfig({
  base: '/MR-JK-MART/',
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'crypto', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
