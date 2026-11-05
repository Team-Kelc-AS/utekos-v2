import { createProcessor } from '@mdx-js/mdx';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'src/app/(blog)/uteguiden');
const processor = createProcessor();
const omitted = new Set([
  'mdxjsEsm', 'code', 'html', 'image', 'definition',
]);
const omittedElements = new Set([
  'nav', 'figure', 'script', 'style', 'KnowledgeArticleMeta', 'KnowledgeSources', 'KnowledgeToc',
  'KnowledgeLearnings', 'BackToTop', 'PageAiSummary', 'Cite',
]);

// Parse MDX without evaluating imports, JSX expressions or page code.
export function extractArticleText(node) {
  if (omitted.has(node.type) || omittedElements.has(node.name) ||
      node.attributes?.some(attribute => attribute.name === 'data-ai-source-exclude')) return '';
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (node.type === 'mdxTextExpression' || node.type === 'mdxFlowExpression') {
    const expression = node.data?.estree?.body?.[0]?.expression;
    return expression?.type === 'Literal' && typeof expression.value === 'string'
      ? expression.value : '';
  }
  const text = (node.children ?? []).map(extractArticleText).join('');
  const title = node.attributes?.find(attribute => attribute.name === 'title');
  const prefix = typeof title?.value === 'string' ? `${title.value}\n` : '';
  return prefix + text + (['paragraph', 'heading', 'listItem', 'tableRow', 'mdxJsxFlowElement'].includes(node.type) ? '\n\n' : '');
}

export async function buildArticleSources() {
  const sources = {};
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const filename = path.join(directory, entry.name, 'page.mdx');
    let raw;
    try {
      raw = await readFile(filename, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const content = extractArticleText(processor.parse(raw))
      .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (content.length < 200 || content.length > 100_000) {
      throw new Error(`Unexpected summary source length for ${entry.name}: ${content.length}`);
    }
    sources[entry.name] = content;
  }
  const target = path.join(root, 'src/lib/ai-summary/articleSources.generated.json');
  const json = JSON.stringify(sources, null, 2) + '\n';
  const previous = await readFile(target, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  if (previous !== json) await writeFile(target, json);
  console.log(`AI summary sources: ${Object.keys(sources).length} articles`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildArticleSources();
}
