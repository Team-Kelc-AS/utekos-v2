import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

// Isolate the wishlist from shared React and CSS, measuring initial and lazy chunks.
// This guards regressions; Next's analyzer and browser requests remain the
// evidence for what the storefront actually ships.
const result = await build({
  entryPoints: ['src/assets/components/wishlist/WishlistButton.tsx'],
  outdir: 'wishlist-budget',
  bundle: true,
  splitting: true,
  minify: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  write: false,
  metafile: true,
  plugins: [{
    name: 'exclude-css',
    setup(builder) {
      builder.onLoad({ filter: /\.css$/ }, () => ({ contents: 'export default {};', loader: 'js' }));
    },
  }],
});

const outputs = Object.entries(result.metafile.outputs);
const files = outputs.map(([path, output], index) => ({
  path,
  entry: output.entryPoint,
  bytes: output.bytes,
  gzip: gzipSync(result.outputFiles[index].contents).length,
}));
const initial = files.find((file) => file.entry?.endsWith('WishlistButton.tsx'));
assert.ok(initial, 'The client entry must be measurable');
const initialPaths = new Set();
function visit(path) {
  if (initialPaths.has(path)) return;
  initialPaths.add(path);
  for (const dependency of result.metafile.outputs[path].imports) {
    if (!dependency.external && dependency.kind !== 'dynamic-import') visit(dependency.path);
  }
}
visit(initial.path);
const initialGzip = files.filter((file) => initialPaths.has(file.path))
  .reduce((sum, file) => sum + file.gzip, 0);
assert.ok(initialGzip <= 5_000, `Initial wishlist loader exceeds 5,000 B gzip: ${initialGzip}`);
const total = files.reduce((sum, file) => sum + file.gzip, 0);
assert.ok(total <= 10_000, `Wishlist exceeds 10,000 B gzip in total: ${total}`);
console.log(JSON.stringify({ files, initialGzip, totalGzip: total, budgets: { initialGzip: 5_000, totalGzip: 10_000 } }, null, 2));
