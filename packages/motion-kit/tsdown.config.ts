import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/generate.ts'],
  outDir: 'lib',
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  outExtensions: () => ({js: '.js', dts: '.d.ts'}),
  deps: {
    neverBundle: [/^@canvas-commons\//, 'typescript', 'vite'],
  },
});
