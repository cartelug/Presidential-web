import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Presidential-web/',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
});
