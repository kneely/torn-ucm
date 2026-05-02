import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import UnoCSS from '@unocss/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// Read userscript header from separate file
const userscriptHeader = readFileSync(resolve(__dirname, 'src/userscript-header.js'), 'utf-8');
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  define: {
    __UCM_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    UnoCSS(),
    cssInjectedByJsPlugin({ topExecutionPriority: false }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'TornUCM',
      formats: ['iife'],
      fileName: () => 'torn-ucm.user.js',
    },
    outDir: 'dist',
    minify: false, // Keep readable for userscript hosts
    rollupOptions: {
      output: {
        banner: userscriptHeader,
        // No code splitting - must be single file
        inlineDynamicImports: true,
      },
    },
  },
});
