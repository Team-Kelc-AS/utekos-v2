import { readFile, writeFile } from 'node:fs/promises';
import { createGateway } from 'ai';
import { knowledgeArticleList } from '../src/lib/knowledge/knowledgeArticles';
import sources from '../src/lib/ai-summary/articleSources.generated.json';
import { generateArticleSummary } from '../src/lib/ai-summary/generateArticleSummary';
import { articleSummaryMetrics, articleSummarySchema, validateSummary, type ArticleSummary } from '../src/lib/ai-summary/schema';
import { summaryCacheKey, SUMMARY_MODEL } from '../src/lib/ai-summary/prompt';

async function main() {
  const write = process.argv.includes('--write');
  if (!write && !process.argv.includes('--check')) throw new Error('Choose --check or --write explicitly');
  const file = new URL('../src/lib/ai-summary/articleSummaries.generated.json', import.meta.url);
  const existing = JSON.parse(await readFile(file, 'utf8')) as Record<string, { sourceKey: string; content: ArticleSummary }>;
  const prepared: typeof existing = {};
  for (const article of knowledgeArticleList) {
    const text = Object.entries(sources).find(([slug]) => slug === article.slug)?.[1];
    if (!text) throw new Error(`Missing article source: ${article.slug}`);
    const source = { kind: 'article' as const, slug: article.slug, title: article.title, content: `${article.description}\n\n${text}` };
    const sourceKey = summaryCacheKey(source, SUMMARY_MODEL);
    let entry = existing[article.slug];
    if (!entry || entry.sourceKey !== sourceKey) {
      if (!write) throw new Error(`Prepare and review the updated summary before release: ${article.slug}`);
      const apiKey = process.env.AI_SUMMARY_GATEWAY_API_KEY?.trim();
      if (!apiKey && !process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error('Gateway authentication required for --write');
      // Explicit editorial command only; never called by the reader or build.
      const result = await generateArticleSummary({ model: apiKey ? createGateway({ apiKey })(SUMMARY_MODEL) : SUMMARY_MODEL,
        source, abortSignal: AbortSignal.timeout(60_000), onText: () => {} });
      entry = { sourceKey, content: result.content };
      existing[article.slug] = entry;
      await writeFile(file, JSON.stringify(existing, null, 2) + '\n');
    }
    validateSummary(articleSummarySchema.parse(entry.content), source);
    prepared[article.slug] = entry;
    console.log(`${article.slug}: ${articleSummaryMetrics(entry.content).total} characters, validated`);
  }
  if (write) await writeFile(file, JSON.stringify(prepared, null, 2) + '\n');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Article summary preparation failed');
  process.exitCode = 1;
});
