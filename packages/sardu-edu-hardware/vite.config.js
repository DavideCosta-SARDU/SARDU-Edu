/// <reference types="vitest/config" />
import dts from 'unplugin-dts/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SarduEduHardware',
      fileName: 'sardu-edu-hardware',
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      tsconfigPath: 'tsconfig.build.json',
    }),
  ],
  test: {
    coverage: {
      exclude: ['dist/**', 'node_modules/**', 'test/**', 'vite.config.js'],
    },
  },
})
