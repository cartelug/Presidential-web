import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Presidential-web/',
  build: {
    outDir: 'dist',
    target: 'es2022',
    rollupOptions: {
      input: {
        index: 'index.html',
        achievements: 'achievements.html',
        timeline: 'timeline.html',
        sources: 'sources.html',
      },
    },
  },
});
