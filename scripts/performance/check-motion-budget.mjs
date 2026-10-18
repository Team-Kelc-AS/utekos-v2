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

// Keep the always-present header trigger independent of the deferred dialog.
const menu = await build({
  entryPoints: ['src/assets/components/header/HeaderMenu.tsx'],
  outdir: 'menu-budget',
  bundle: true,
  splitting: true,
  minify: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'next/*'],
  write: false,
  metafile: true,
  plugins: [{
    name: 'exclude-css',
    setup(builder) {
      builder.onLoad({ filter: /\.css$/ }, () => ({ contents: 'export default {};', loader: 'js' }));
    },
  }],
});
const menuOutputs = menu.metafile.outputs;
const menuEntry = Object.keys(menuOutputs).find((path) => menuOutputs[path].entryPoint?.endsWith('/HeaderMenu.tsx'));
assert.ok(menuEntry, 'Header menu entry must exist');
const menuInitial = new Set();
function visitMenu(path) {
  if (menuInitial.has(path)) return;
  menuInitial.add(path);
  for (const dependency of menuOutputs[path].imports) {
    if (!dependency.external && dependency.kind !== 'dynamic-import') visitMenu(dependency.path);
  }
}
visitMenu(menuEntry);
assert.ok([...menuInitial].every((path) => !Object.keys(menuOutputs[path].inputs)
  .some((input) => /node_modules\/.*(?:motion|@base-ui)/.test(input) || input.endsWith('/MenuDialog.tsx'))),
'Header menu must defer Motion, Base UI and MenuDialog');
assert.ok(menuOutputs[menuEntry].imports.some((item) => item.kind === 'dynamic-import'),
  'Header menu must retain its dynamic import');
const menuFiles = Object.entries(menuOutputs).map(([path, output], index) => ({
  path, bytes: output.bytes, gzip: gzipSync(menu.outputFiles[index].contents).length,
  initial: menuInitial.has(path),
}));
const menuInitialGzip = menuFiles.filter((file) => file.initial).reduce((sum, file) => sum + file.gzip, 0);
const menuTotalGzip = menuFiles.reduce((sum, file) => sum + file.gzip, 0);
assert.ok(menuInitialGzip <= 1100, `Menu loader exceeds 1,100 B gzip: ${menuInitialGzip}`);
// Includes the shared shadcn Accordion, Base UI, icons and class-name helper.
// These remain deferred; Next may share them with other UI chunks.
assert.ok(menuTotalGzip <= 48_000, `Menu including accordion exceeds 48,000 B gzip: ${menuTotalGzip}`);
console.log(JSON.stringify({ menuFiles, menuInitialGzip, menuTotalGzip }, null, 2));

await import('./check-product-rows-budget.mjs');
