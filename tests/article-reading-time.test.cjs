/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { loadTypeScript } = require('./load-typescript.cjs');
const reading = import('../scripts/build-article-reading-times.mjs');

test('reading time uses 265 words per minute and rounds up', async () => {
  const { articleReadingMetrics, WORDS_PER_MINUTE } = await reading;
  assert.equal(WORDS_PER_MINUTE, 265);
  assert.deepEqual(articleReadingMetrics(Array(265).fill('ord').join(' ')), { wordCount: 265, readingMinutes: 1 });
  assert.deepEqual(articleReadingMetrics(Array(266).fill('ord').join(' ')), { wordCount: 266, readingMinutes: 2 });
});

test('bibliography text and URLs cannot inflate the reading estimate', async () => {
  const { articleReadingMetrics } = await reading;
  const body = 'Dette er selve artikkelteksten.';
  for (const heading of ['Kilder', 'Referanser', 'Referanseliste']) {
    const markdown = `${body}\n\n## ${heading}\n\n${'Lang kildetittel og nettadresse. '.repeat(500)}`;
    assert.equal(articleReadingMetrics(markdown).wordCount, 4);
  }
  assert.equal(articleReadingMetrics(`${body}\n\n<details>\n<summary>Kilder (3)</summary>\n\n${'Kildetekst '.repeat(100)}\n\n</details>`).wordCount, 4);
});

test('header, navigation, images, AI summary and citations are excluded while prose and tables count', async () => {
  const { articleReadingMetrics } = await reading;
  const markdown = `
<KnowledgeArticleIntro><h1>Lang tittel</h1><p>Ingress med flere ord</p></KnowledgeArticleIntro>
<nav>Innhold med mange lenker</nav>
<PageAiSummary>En hel oppsummering</PageAiSummary>
<figure><img alt="Et bilde" /><figcaption>Lang bildetekst</figcaption></figure>

Dette er brødtekst<Cite ids={[1, 2]} />.

| Kolonne | Verdi |
| --- | --- |
| Ett | To |

<KnowledgeSources article={{ references: ['ikke brødtekst'] }} />
`;
  assert.equal(articleReadingMetrics(markdown).wordCount, 7);
});

test('all registered articles use current generated body counts rather than editorial constants', async () => {
  const { articleReadingMetrics } = await reading;
  const { knowledgeArticleList } = loadTypeScript('lib/knowledge/knowledgeArticles.ts');
  for (const article of knowledgeArticleList) {
    const markdown = fs.readFileSync(path.join(__dirname, '../src/app/(site)/(blog)/uteguiden', article.slug, 'page.mdx'), 'utf8');
    const expected = articleReadingMetrics(markdown);
    assert.equal(article.wordCount, expected.wordCount, article.slug);
    assert.equal(article.readingMinutes, expected.readingMinutes, article.slug);
  }
});
