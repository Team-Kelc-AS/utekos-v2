// MDX is compiled to JavaScript, so tsc cannot check its literal hrefs directly.
// Validate them against Next's generated Route type without writing generated files.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const require = createRequire(import.meta.url);
const loaderRequire = createRequire(require.resolve('@mdx-js/loader'));
const { createProcessor } = await import(loaderRequire.resolve('@mdx-js/mdx'));
const processor = createProcessor();
const links = [];

function mdxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = join(directory, entry.name);
    return entry.isDirectory() ? mdxFiles(filename) : /\.mdx?$/.test(entry.name) ? [filename] : [];
  });
}

function visit(node, filename) {
  let href;
  if (node.type === 'link' || node.type === 'definition') href = node.url;
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    const attribute = node.attributes.find((item) => item.name === 'href');
    if (typeof attribute?.value === 'string') href = attribute.value;
    else if (attribute?.value?.type === 'mdxJsxAttributeValueExpression') {
      const expression = attribute.value.data?.estree?.body[0]?.expression;
      if (expression?.type === 'Literal' && typeof expression.value === 'string') href = expression.value;
      else throw new Error(`${relative(root, filename)}:${node.position.start.line}: Move dynamic hrefs into a typed TypeScript component.`);
    }
  }
  if (href?.startsWith('/') && !href.startsWith('//')) {
    const path = href.split(/[?#]/, 1)[0];
    // Downloads and other public files are assets, not application routes.
    const asset = join(root, 'public', path);
    if (!(existsSync(asset) && statSync(asset).isFile())) links.push({ href, filename, line: node.position.start.line });
  }
  for (const child of node.children ?? []) visit(child, filename);
}

for (const filename of process.argv.length > 2 ? process.argv.slice(2).map((file) => resolve(file)) : mdxFiles(join(root, 'src'))) {
  visit(processor.parse(readFileSync(filename, 'utf8')), filename);
}

const generatedTypes = join(root, '.next/types/link.d.ts');
if (!existsSync(generatedTypes)) throw new Error('Run next typegen before checking MDX routes.');
const config = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const filename = join(root, '__mdx_route_typecheck__.ts');
const source = ['import type { Route } from "next";', ...links.map(({ href }) => `${JSON.stringify(href)} satisfies Route<${JSON.stringify(href)}>;`)].join('\n');
const options = { ...parsed.options, incremental: false, noEmit: true };
const host = ts.createCompilerHost(options);
const originalGetSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => file === filename
  ? ts.createSourceFile(file, source, languageVersion, true)
  : originalGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile);
const program = ts.createProgram([join(root, 'next-env.d.ts'), generatedTypes, filename], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
for (const diagnostic of diagnostics) {
  const line = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line;
  const link = diagnostic.file?.fileName === filename && line !== undefined ? links[line - 1] : undefined;
  const location = link ? `${relative(root, link.filename)}:${link.line}: ` : '';
  console.error(`${location}${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
}
if (diagnostics.length) process.exitCode = 1;
else console.log(`MDX routes: ${links.length} internal links passed Next.js route type checking.`);
