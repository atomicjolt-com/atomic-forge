import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Custom plugin to generate assets.json manifest
const assetsManifestPlugin = () => {
  return {
    name: 'assets-manifest',
    apply: 'build',
    generateBundle(options, bundle) {
      const manifest = {};

      // Find entry points in the bundle
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          // Map the original entry name to the output file
          const entryName = chunk.name + '.ts';
          manifest[entryName] = `/assets/js/${fileName}`;
        }
      }

      // Write the manifest file
      this.emitFile({
        type: 'asset',
        fileName: 'assets.json',
        source: JSON.stringify(manifest, null, 2)
      });
    }
  };
};

export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'src/assets/js',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'app-init': path.resolve(__dirname, 'client/app-init.ts'),
        'app': path.resolve(__dirname, 'client/app.ts')
      },
      output: {
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      }
    },
    manifest: false, // We'll use our custom plugin instead
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : true,
    minify: process.env.NODE_ENV !== 'development'
  },
  plugins: [assetsManifestPlugin()],
  server: {
    watch: {
      // Watch the client directory
      ignored: ['!**/client/**']
    }
  }
});