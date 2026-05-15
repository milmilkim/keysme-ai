import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'utils/index': 'src/utils/index.ts',
    'adapters/index': 'src/adapters/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
})
