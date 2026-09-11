/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const preload = mode === 'preload'
  return {
    build: {
      emptyOutDir: !preload,
      lib: {
        entry: preload ? 'src/preload.ts' : 'src/main.ts',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: [/^electron(?:\/.*)?$/, /^node:/],
        output: {
          entryFileNames: '[name].cjs',
        },
      },
    },
    test: {
      coverage: {
        exclude: ['dist/**', 'node_modules/**', 'release/**', 'vite.config.ts'],
      },
    },
  }
})
