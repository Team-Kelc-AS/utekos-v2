import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

// Includes the OIDC SDK and all its transitive dependencies. Only the server-only
// marker is external; Node built-ins are not bundled. This is an isolated server
// import budget, not a browser transfer size or a Next route bundle size.
const result = await build({
  stdin: {
    contents: 'export { forwardTrackingRequest } from "./src/lib/tracking/backend";',
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'node',
  conditions: ['react-server'],
  define: { 'process.env.NODE_ENV': '"production"' },
  external: ['server-only'],
  write: false,
});

const bytes = result.outputFiles[0].contents.length;
const gzip = gzipSync(result.outputFiles[0].contents).length;
assert.ok(bytes <= 550_000, `Tracking bridge exceeds 550,000 B: ${bytes}`);
assert.ok(gzip <= 120_000, `Tracking bridge exceeds 120,000 B gzip: ${gzip}`);
console.log(JSON.stringify({ bytes, gzip, budgets: { bytes: 550_000, gzip: 120_000 } }, null, 2));
