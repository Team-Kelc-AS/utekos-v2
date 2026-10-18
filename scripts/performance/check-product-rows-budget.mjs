import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const result = await build({
  entryPoints: ['src/assets/components/catalog/ProductRowsMotion.tsx'],
  outdir: 'product-rows-budget', bundle: true, splitting: true, minify: true,
  format: 'esm', platform: 'browser', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], write: false, metafile: true,
  plugins: [{ name: 'css', setup(builder) {
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: 'export default {};', loader: 'js' }));
  } }],
});
const outputs = result.metafile.outputs;
const entry = Object.keys(outputs).find((path) => outputs[path].entryPoint?.endsWith('/ProductRowsMotion.tsx'));
assert.ok(entry);
const initial = new Set();
function visit(path) {
  if (initial.has(path)) return;
  initial.add(path);
  for (const dependency of outputs[path].imports) {
    if (!dependency.external && dependency.kind !== 'dynamic-import') visit(dependency.path);
  }
}
visit(entry);
const files = Object.entries(outputs).map(([path, output], index) => ({
  path, bytes: output.bytes, gzip: gzipSync(result.outputFiles[index].contents).length, initial: initial.has(path),
}));
const initialGzip = files.filter((file) => file.initial).reduce((sum, file) => sum + file.gzip, 0);
const totalGzip = files.reduce((sum, file) => sum + file.gzip, 0);
assert.ok(initialGzip <= 900, `Product row loader exceeds 900 B gzip: ${initialGzip}`);
assert.ok(totalGzip <= 6500, `Product row animation exceeds 6,500 B gzip: ${totalGzip}`);
assert.ok([...initial].every((path) => !Object.keys(outputs[path].inputs).some((input) => /node_modules\/.*motion/.test(input))),
  'Motion must remain outside the initial product-row entry');
assert.ok(outputs[entry].imports.some((item) => item.kind === 'dynamic-import'));
console.log(JSON.stringify({ productRows: { files, initialGzip, totalGzip } }, null, 2));
