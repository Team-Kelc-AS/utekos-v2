import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

// Review every Base UI entry point against actual Next route graphs. Isolated
// component sizes exclude shared React, Next and CSS; they are not transfers.
async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return files.flat();
}

const analyzeDirectory = process.argv[2] ?? '.next/diagnostics/analyze';
const sourceRoutes = new Map();
const graphs = (await filesIn(`${analyzeDirectory}/data`))
  .filter(path => path.endsWith('/analyze.data'));
for (const file of graphs) {
  const buffer = await readFile(file);
  const header = JSON.parse(buffer.subarray(4, 4 + buffer.readUInt32BE(0)).toString());
  const paths = new Map();
  function sourcePath(index) {
    if (paths.has(index)) return paths.get(index);
    const source = header.sources[index];
    const parent = source.parent_source_index;
    const path = `${parent == null ? '' : sourcePath(parent)}/${source.path}`.replace(/\/{2,}/g, '/');
    paths.set(index, path);
    return path;
  }
  const route = `/${file.slice(`${analyzeDirectory}/data/`.length, -'analyze.data'.length)}`.replace(/\/$/, '') || '/';
  for (const part of header.chunk_parts) {
    if (!part.size || !header.output_files[part.output_file_index].filename.endsWith('.js')) continue;
    const path = sourcePath(part.source_index);
    if (!sourceRoutes.has(path)) sourceRoutes.set(path, new Set());
    sourceRoutes.get(path).add(route);
  }
}

function routesMatching(fragment) {
  return [...new Set([...sourceRoutes].filter(([path]) => path.includes(fragment))
    .flatMap(([, routes]) => [...routes]))].sort();
}

const components = [];
for (const file of (await filesIn('src')).filter(path => /\.(?:tsx?|mdx)$/.test(path)).sort()) {
  const source = await readFile(file, 'utf8');
  const imports = [...source.matchAll(/from\s+['"](@base-ui\/react[^'"]*)['"]/g)].map(match => match[1]);
  if (!imports.length) continue;
  const result = await build({
    entryPoints: [file], bundle: true, minify: true, format: 'esm', platform: 'browser',
    jsx: 'automatic', external: ['react', 'react-dom', 'react/jsx-runtime', 'next/*'],
    write: false, metafile: true,
    plugins: [{ name: 'exclude-css', setup(builder) {
      builder.onLoad({ filter: /\.css$/ }, () => ({ contents: 'export default {};', loader: 'js' }));
    } }],
  });
  const bytes = result.outputFiles[0].contents;
  const output = Object.values(result.metafile.outputs)[0];
  const baseUiModules = Object.entries(output.inputs)
    .filter(([path, input]) => path.includes('/@base-ui/react/') && input.bytesInOutput > 0)
    .map(([path]) => path.split('/@base-ui/react/').at(-1)).sort();
  components.push({ file, imports, routes: routesMatching(`/${file}`),
    isolated: { bytes: bytes.length, gzip: gzipSync(bytes).length }, baseUiModules });
}

const baseUi = JSON.parse(await readFile('node_modules/@base-ui/react/package.json', 'utf8'));
const packages = [];
for (const specifier of [...new Set(components.flatMap(component => component.imports))].sort()) {
  const subpath = specifier.slice('@base-ui/react/'.length);
  const entry = baseUi.exports[`./${subpath}`].import.default;
  const source = await readFile(resolve('node_modules/@base-ui/react', entry), 'utf8');
  packages.push({ specifier, namespaceExport: /export \* as /.test(source),
    importers: components.filter(component => component.imports.includes(specifier)).map(component => component.file),
    implementationRoutes: routesMatching(`/node_modules/@base-ui/react/${subpath}/`),
  });
}
console.log(JSON.stringify({ versions: {
  baseUi: baseUi.version,
  next: JSON.parse(await readFile('node_modules/next/package.json', 'utf8')).version,
}, analyzedRoutes: graphs.length, packages, components }, null, 2));
