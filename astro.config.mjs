import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Static export per Build Bible §11 — no server, deploy to CDN/edge (GitHub Pages).
export default defineConfig({
  site: 'https://cartelug.github.io',
  base: '/Presidential-web',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  compressHTML: true,
});
