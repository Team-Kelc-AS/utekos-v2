import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

// Includes the newsletter's server action and OIDC dependencies. Shared React,
// Next and CSS are excluded. This is not a client transfer measurement.
const result = await build({
  entryPoints: ['src/assets/components/Footer.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  minify: true,
  write: false,
  external: ['server-only', 'react', 'react-dom', 'react/jsx-runtime', 'next/*'],
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'exclude-css', setup(builder) {
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: 'export default {};', loader: 'js' }));
  } }],
});

const bytes = result.outputFiles[0].contents.length;
const gzip = gzipSync(result.outputFiles[0].contents).length;
assert.ok(bytes <= 600_000, `Footer exceeds 600,000 B: ${bytes}`);
assert.ok(gzip <= 130_000, `Footer exceeds 130,000 B gzip: ${gzip}`);
console.log(JSON.stringify({ bytes, gzip, budgets: { bytes: 600_000, gzip: 130_000 } }, null, 2));
