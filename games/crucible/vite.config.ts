import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 100_000,
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
  esbuild: {
    drop: command === 'build' ? (['console', 'debugger'] as const).slice() : [],
    legalComments: 'none',
  },
  server: {
    host: true,
    ...(process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {}),
  },
}))
