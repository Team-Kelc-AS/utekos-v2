import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

// Isolate this feature from React/Next and CSS, then measure both load phases.
// This guards regressions; Next's analyzer and browser requests remain the
// evidence for what the storefront actually ships.
const result = await build({
  entryPoints: ['src/assets/components/frontpage/IntersportAnimation.tsx'],
  outdir: 'motion-budget',
  bundle: true,
  splitting: true,
  minify: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
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
const initial = files.find((file) => file.entry?.endsWith('IntersportAnimation.tsx'));
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
assert.ok(initialGzip <= 700, `Initial animation loader exceeds 700 B gzip: ${initialGzip}`);
const total = files.reduce((sum, file) => sum + file.gzip, 0);
assert.ok(total <= 5_000, `Animation exceeds 5,000 B gzip in total: ${total}`);
const entryOutput = result.metafile.outputs[initial.path];
assert.ok([...initialPaths].every((path) => !Object.keys(result.metafile.outputs[path].inputs)
  .some((input) => /node_modules\/.*motion/.test(input))),
  'Motion must remain outside the initial client entry');
assert.ok(entryOutput.imports.some((dependency) => dependency.kind === 'dynamic-import'),
  'Animation must have a deferred entry');
console.log(JSON.stringify({ files, totalGzip: total, budgets: { initialGzip: 700, totalGzip: 5_000 } }, null, 2));
