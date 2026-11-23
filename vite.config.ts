import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // theme.tools consumption (step 3): the self-contained blog widget
      // renderer is vendored in-repo (vendor/theme.tools/blog/widgets.ts)
      // because music's CI builds the repo alone — a `../theme.tools` sibling
      // alias would break CI, and the @theme.tools/blog tarball cannot install
      // standalone. Keep this in sync with tsconfig.json `paths`.
      '@theme.tools/blog/widgets': resolve(__dirname, 'vendor/theme.tools/blog/widgets.ts')
    }
  },
  server: { host: true, port: 5173, strictPort: false },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2022',
    cssMinify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ashtonLetter: resolve(__dirname, 'ashton-letter/index.html'),
        embed: resolve(__dirname, 'embed.html'),
        castReceiver: resolve(__dirname, 'cast-receiver/index.html')
      },
      output: {
        // Split observability into a separate async chunk so the LCP-critical
        // main bundle never blocks on telemetry boot.
        manualChunks(id) {
          if (id.includes('src/observability')) return 'observability';
        }
      }
    }
  }
});
