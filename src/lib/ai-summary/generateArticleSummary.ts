import { Output, streamText, type LanguageModel } from 'ai';
import { z } from 'zod';
import { articleSummaryIssues, articleSummaryMetrics, articleSummarySchema, type ArticleSummary, type SummarySource } from './schema';
import { articleSummaryInstructions, buildSummaryPrompt, SUMMARY_REASONING } from './prompt';

// Prefer one short editorial correction over regenerating the whole article.
export function articleRevisionPlan(summary: ArticleSummary) {
  const fields = [
    { name: 'scope', text: summary.scope, min: 40, max: 240, replace: (text: string) => ({ ...summary, scope: text }) },
    { name: 'learning', text: summary.learning, min: 60, max: 290, replace: (text: string) => ({ ...summary, learning: text }) },
    ...summary.points.flatMap((point, index) => [
      { name: `points[${index}].text`, text: point.text, min: 10, max: 300, replace: (text: string) => ({ ...summary, points: summary.points.map((item, i) => i === index ? { ...item, text } : item) }) },
      ...point.details.map((detail, detailIndex) => ({
        name: `points[${index}].details[${detailIndex}]`, text: detail, min: 10, max: 250,
        replace: (text: string) => ({ ...summary, points: summary.points.map((item, i) => i === index ? { ...item, details: item.details.map((value, j) => j === detailIndex ? text : value) } : item) }),
      })),
    ]),
  ];
  const candidates = fields.flatMap(field => {
    const validLengths = [];
    for (let length = field.min; length <= field.max; length++) {
      if (!articleSummaryIssues(field.replace('x'.repeat(length))).length) validLengths.push(length);
    }
    if (!validLengths.length) return [];
    const min = validLengths[0], max = validLengths.at(-1)!;
    const target = Math.round((min + max) / 2);
    const metrics = articleSummaryMetrics(field.replace('x'.repeat(target)));
    const balance = metrics.proportions.reduce((sum, proportion, i) => sum + Math.abs(proportion - [0.15, 0.20, 0.65][i]), 0);
    return [{ ...field, min, max, target, score: max - min - balance * 100 }];
  });
  return candidates.sort((a, b) => b.score - a.score)[0];
}

export async function generateArticleSummary({ model, source, abortSignal, onText }: {
  model: LanguageModel;
  source: SummarySource;
  abortSignal: AbortSignal;
  onText: () => void;
}) {
  // Used by the explicit editorial preparation command, never reader requests.
  const signal = abortSignal;
  let correction = '';
  let draft: ArticleSummary | undefined;
  const usage = { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 };
  for (let attempt = 1; attempt <= 3; attempt++) {
    signal.throwIfAborted();
    const revision = draft ? articleRevisionPlan(draft) : undefined;
    const result = streamText({
      model,
      system: articleSummaryInstructions,
      prompt: buildSummaryPrompt(source) + (revision
        ? `\n\nRedaksjonell retting: ${JSON.stringify(draft)}\nSkriv BARE en ny tekst til ${revision.name} i feltet replacement. Nåværende tekst: ${JSON.stringify(revision.text)}. Den nye teksten må ha ${revision.min}–${revision.max} tegn inkludert mellomrom; sikt på ${revision.target}. Bevar betydningen, kildegrunnlaget og vesentlige forbehold. Ikke bruk fyllstoff eller henvis til rettingen. Resten av oppsummeringen beholdes uendret.`
        : correction),
      output: Output.object<ArticleSummary | { replacement: string }>({ schema: revision ? z.object({ replacement: z.string().trim().min(10).max(400) }) : articleSummarySchema }),
      providerOptions: {
        google: { thinkingConfig: { thinkingLevel: SUMMARY_REASONING } },
        vertex: { thinkingConfig: { thinkingLevel: SUMMARY_REASONING } },
      },
      maxOutputTokens: 1600,
      maxRetries: 0,
      abortSignal: signal,
      onError: () => {}, // The route records one sanitized failure.
    });
    for await (const part of result.stream) {
      if (part.type === 'text-delta') onText();
      if (part.type === 'error') throw part.error;
      if (part.type === 'abort') throw new Error('Summary aborted');
    }
    if (await result.finishReason !== 'stop') throw new Error('Incomplete article summary');
    const output = await result.output;
    const content = articleSummarySchema.parse(revision && output && 'replacement' in output ? revision.replace(output.replacement) : output);
    const tokens = await result.totalUsage;
    usage.inputTokens += tokens.inputTokens ?? 0;
    usage.outputTokens += tokens.outputTokens ?? 0;
    usage.reasoningTokens += tokens.outputTokenDetails?.reasoningTokens ?? 0;
    signal.throwIfAborted();
    const issues = articleSummaryIssues(content);
    if (!issues.length) return { content, usage, attempts: attempt };
    draft = content;
    const metrics = articleSummaryMetrics(content);
    correction = `\n\nRedaksjonell retting av forrige utkast: ${JSON.stringify(content)}\nMålt lengde inkl. overskrifter: ${metrics.total} tegn; delene har ${metrics.lengths.join(', ')} tegn. ${issues.join(' ')} Endre teksten til totalt 975 tegn. Det betyr ${975 - metrics.total} tegn endring. Behold kildegrunnlaget og strukturen, ikke legg til fyllstoff.`;
  }
  throw new Error('Article summary failed length or structure validation');
}
