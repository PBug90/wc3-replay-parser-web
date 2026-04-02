import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'util', 'crypto', 'stream'],
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      w3gjs: path.resolve(__dirname, 'node_modules/w3gjs/dist/lib/index.js'),
      fs: path.resolve(__dirname, 'src/stubs/fs.js'),
      'node:fs': path.resolve(__dirname, 'src/stubs/fs.js'),
      perf_hooks: path.resolve(__dirname, 'src/stubs/perf_hooks.js'),
      'node:perf_hooks': path.resolve(__dirname, 'src/stubs/perf_hooks.js'),
      zlib: path.resolve(__dirname, 'src/stubs/zlib.js'),
      'node:zlib': path.resolve(__dirname, 'src/stubs/zlib.js'),
    },
  },
})
