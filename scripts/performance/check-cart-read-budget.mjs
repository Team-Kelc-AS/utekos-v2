import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

// Measure the exact CartSlot import, including transitive application code.
// Only the server-only marker is external; Node built-ins are not bundled.
// This isolated budget is distinct from Next's shared per-route module graph.
const result = await build({
  stdin: {
    contents: 'export { CART_COOKIE, cartView, readCart } from "./src/lib/cart/server";',
    resolveDir: process.cwd(),
    sourcefile: 'cart-read-import.ts',
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
assert.ok(bytes <= 15_000, `Cart reads exceed 15,000 B: ${bytes}`);
assert.ok(gzip <= 5_000, `Cart reads exceed 5,000 B gzip: ${gzip}`);
console.log(JSON.stringify({ bytes, gzip, budgets: { bytes: 15_000, gzip: 5_000 } }, null, 2));
