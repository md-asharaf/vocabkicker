import { defineConfig } from 'vite';
// vite.config.js
export default defineConfig({
  base: './', // Ensures relative paths in the built index.html for GitHub Pages
  server: {},
  build: {
    outDir: 'dist',
  },
});
