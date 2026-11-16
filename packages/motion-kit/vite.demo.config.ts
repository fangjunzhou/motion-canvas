import canvasCommons from '@canvas-commons/vite-plugin';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => ({
  base: command === 'build' ? `${process.env.DOCS_BASE_URL ?? '/'}demos/` : '/',
  plugins: [canvasCommons({project: './demo/motion-kit-showcase.ts'})],
  build: {
    outDir: 'dist/static/demos',
    emptyOutDir: true,
    rollupOptions: {
      output: {entryFileNames: 'motion-kit-showcase.js'},
    },
  },
}));
