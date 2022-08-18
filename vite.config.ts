import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  root: './webview-ui',
  publicDir: 'assets',
  assetsInclude: ['**/*.json'],
  build: {
    outDir: '../out',
    rollupOptions: {
      output: {
        entryFileNames: `webview-ui/[name].js`,
        chunkFileNames: `webview-ui/[name].js`,
        assetFileNames: `webview-ui/[name].[ext]`,
      },
    },
  },
});
