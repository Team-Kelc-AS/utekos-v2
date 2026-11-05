import type { ArticleSummary } from './schema';

export const ARTICLE_HEADINGS = ['Omfang', 'Hva lærer du?', 'Rask oppsummering av innhold'] as const;
export const ARTICLE_STATUS_MESSAGES = ['Leser artikkelinnhold...', 'Analyserer kilder..', 'Skriver oppsummering...'] as const;
export const ARTICLE_STATUS_MS = 1_200;
export const ARTICLE_TEXT_COMPLETE_MS = 4_000;
export const ARTICLE_PRESENTATION_COMPLETE_MS = 4_800;

export function articlePresentationBlocks(content: ArticleSummary) {
  const values = [
    { id: 'scope-heading', text: ARTICLE_HEADINGS[0] },
    { id: 'scope', text: content.scope },
    { id: 'learning-heading', text: ARTICLE_HEADINGS[1] },
    { id: 'learning', text: content.learning },
    { id: 'points-heading', text: ARTICLE_HEADINGS[2] },
    ...content.points.flatMap((point, index) => [
      { id: `point-${index}`, text: point.text },
      ...point.details.map((text, detailIndex) => ({ id: `detail-${index}-${detailIndex}`, text })),
    ]),
  ];
  let offset = 0;
  return values.map(value => {
    const block = { ...value, start: offset, end: offset + value.text.length };
    offset = block.end + 1;
    return block;
  });
}

export function articleRevealTimeline(text: string, random: () => number = Math.random) {
  let weight = 0;
  let previous = '';
  const words = Array.from(text.matchAll(/\S+/g), match => {
    // Small variations and punctuation pauses share one fixed time budget.
    weight += 0.8 + random() * 0.4 + (/[.!?]$/.test(previous) ? 2 : /[,;:]$/.test(previous) ? 0.7 : 0);
    previous = match[0];
    return { end: match.index + match[0].length, weight };
  });
  return words.map(word => ({ end: word.end, at: ARTICLE_STATUS_MS + word.weight / weight * (ARTICLE_TEXT_COMPLETE_MS - ARTICLE_STATUS_MS) }));
}

export function articleVisibleCharacters(elapsed: number, timeline: ReturnType<typeof articleRevealTimeline>) {
  let visible = 0;
  for (const word of timeline) {
    if (word.at > elapsed) break;
    visible = word.end;
  }
  return visible;
}
