/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');
const { articlePresentationBlocks, articleRevealTimeline, articleVisibleCharacters } = loadTypeScript('lib/ai-summary/articlePresentation.ts');
const { articleSummaryMetrics } = loadTypeScript('lib/ai-summary/schema.ts');
const prepared = require('../src/lib/ai-summary/articleSummaries.generated.json');

test('all article text is preserved and fully revealed by four seconds for either jitter extreme', () => {
  for (const { content } of Object.values(prepared)) {
    const blocks = articlePresentationBlocks(content);
    const text = blocks.map(block => block.text).join(' ');
    assert.equal(Array.from(text.normalize('NFC').replace(/\s+/g, ' ').trim()).length, articleSummaryMetrics(content).total);
    for (const random of [() => 0, () => 1]) {
      const timeline = articleRevealTimeline(text, random);
      assert.equal(articleVisibleCharacters(2499, timeline), 0);
      assert.ok(articleVisibleCharacters(3250, timeline) > 0);
      assert.ok(articleVisibleCharacters(3250, timeline) < text.length);
      assert.equal(articleVisibleCharacters(4000, timeline), text.length);
      assert.equal(articleVisibleCharacters(20_000, timeline), text.length);
      assert.ok(timeline.every((word, i) => i === 0 || word.at > timeline[i - 1].at));
      assert.ok(timeline.every(word => word.end === text.length || /\s/.test(text[word.end])));
    }
  }
});

test('punctuation adds a relative pause without extending the fixed reveal budget', () => {
  const plain = articleRevealTimeline('Ett to tre', () => 0.5);
  const punctuated = articleRevealTimeline('Ett. to tre', () => 0.5);
  assert.ok(punctuated[1].at - punctuated[0].at > plain[1].at - plain[0].at);
  assert.equal(punctuated.at(-1).at, plain.at(-1).at);
});
