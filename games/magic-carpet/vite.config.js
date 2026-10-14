import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 4096,
    cssCodeSplit: false,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        entryFileNames: 'a/[name].js',
        chunkFileNames: 'a/[name].js',
        assetFileNames: 'a/[name][extname]',
      },
    },
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'a/[name].js',
      },
    },
  },
  esbuild: {
    target: 'es2022',
    drop: command === 'build' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
  server: {
    host: true,
    port: 5178,
  },
}))
