import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const root = process.cwd();
const output = path.join(root, 'src/lib/google-customer-reviews/shell.generated.json');
const renderer = path.join(root, '.next/google-reviews-renderer.mjs');
await mkdir(path.dirname(renderer), { recursive: true });
await build({
  stdin: {
    contents: `import { renderToStaticMarkup } from 'react-dom/server';
      import { createElement } from 'react';
      import { ReviewShell } from './src/lib/google-customer-reviews/ReviewShell';
      export const views = Object.fromEntries(['loading','ready','unavailable','error'].map(view =>
        [view, renderToStaticMarkup(createElement(ReviewShell, { view }))]));`,
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: renderer,
  tsconfig: path.join(root, 'tsconfig.json'),
  define: { 'process.env.NODE_ENV': '"production"' },
});
const { views } = await import(pathToFileURL(renderer).href);
const cssFile = path.join(root, 'src/app/globals.css');
const sources = ['../lib/google-customer-reviews/ReviewShell.tsx', ...['card', 'button', 'empty', 'spinner'].map(name => `../assets/components/ui/${name}.tsx`)];
const stylesheet = (await readFile(cssFile, 'utf8')).replace('@import "tailwindcss";',
  `@import "tailwindcss" source(none);\n${sources.map(source => `@source "${source}";`).join('\n')}`);
const result = await postcss([tailwind({ base: root, optimize: true })]).process(stylesheet, {
  from: cssFile,
  map: false,
});
await writeFile(output, JSON.stringify({ views, css: result.css }) + '\n');
console.log(`Built Google Reviews shell from shadcn components (${Buffer.byteLength(result.css)} CSS bytes)`);
