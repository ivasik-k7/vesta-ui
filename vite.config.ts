/// <reference types="vitest/config" />
import { execSync } from 'node:child_process'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

import pkg from './package.json' with { type: 'json' }

// Build identity shown in the footer as vX.X.X-hash. The hash is the HEAD this
// build was produced from; falls back cleanly where git is unavailable (CI tarballs).
function gitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Router plugin must run before react to generate the route tree
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  define: {
    // Some web3 deps reference `global` expecting Node.
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_HASH__: JSON.stringify(gitHash()),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
