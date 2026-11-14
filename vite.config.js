import { defineConfig } from 'vite';

// base: './' makes every asset path relative, which itch.io requires
// (itch serves the game from a random subfolder on its CDN).
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
