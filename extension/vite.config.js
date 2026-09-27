import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';

/**
 * Custom Vite plugin that copies vanilla JS files (content scripts, service worker)
 * and the manifest to the dist/ folder after the React build completes.
 * 
 * These files don't need React or bundling — they run in the content script
 * and service worker contexts where ES module imports aren't available.
 */
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    writeBundle() {
      const copyDir = (src, dest) => {
        if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
        const entries = readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = resolve(src, entry.name);
          const destPath = resolve(dest, entry.name);
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            copyFileSync(srcPath, destPath);
          }
        }
      };

      // Copy manifest.json to dist root
      if (existsSync('public/manifest.json')) {
        copyFileSync('public/manifest.json', 'dist/manifest.json');
      }

      // Copy vanilla JS content scripts
      if (existsSync('src/content')) copyDir('src/content', 'dist/content');

      // Copy service worker
      if (existsSync('src/background')) copyDir('src/background', 'dist/background');
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    copyExtensionFiles()
  ],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html')
      },
      output: {
        // Keep JS chunks in an assets folder to avoid cluttering the root
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
