#!/usr/bin/env node
/**
 * Bundles src/bzmusic-player-element.ts into dist/embed.js as a single
 * self-contained IIFE that defines the <bzmusic-player> custom element.
 *
 * Third-party sites consume this via:
 *   <script src="https://bz.rocks/embed.js" defer></script>
 *
 * The script auto-defines the custom element on load. No module loading,
 * no importmap, no CSS to ship separately — the iframe inside the element
 * carries the actual player chrome from /embed.html.
 */

import { build } from 'esbuild';

await build({
  entryPoints: ['src/bzmusic-player-element.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  outfile: 'dist/embed.js',
  banner: {
    js: '/* bz.rocks <bzmusic-player> web component · https://bz.rocks/embed.js */'
  },
  legalComments: 'none'
});

console.log('✓ dist/embed.js (web component) built');
