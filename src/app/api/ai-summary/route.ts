import { createHash } from 'node:crypto';
import { getCache } from '@vercel/functions';
import { createGateway, createTextStreamResponse, Output, streamText } from 'ai';
import { pageSummarySchema, summaryTargetSchema } from '@/lib/ai-summary/schema';
import { getSummarySource } from '@/lib/ai-summary/source';
import { buildSummaryPrompt, summaryCacheKey, summaryInstructions, SUMMARY_MODEL } from '@/lib/ai-summary/prompt';
import { summaryRateLimit } from '@/lib/ai-summary/rateLimit';

export const maxDuration = 30;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return new Response('Ugyldig forespørsel.', { status: 403, headers });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return new Response('Forventet JSON.', { status: 415, headers });
  }
  // Limit the actual body, including chunked requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return new Response('Mangler forespørsel.', { status: 400, headers });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 512) {
      await reader.cancel();
      return new Response('For stor forespørsel.', { status: 413, headers });
    }
    chunks.push(value);
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return new Response('Ugyldig JSON.', { status: 400, headers });
  }
  const target = summaryTargetSchema.safeParse(body);
  if (!target.success) return new Response('Ugyldig side.', { status: 400, headers });

  const address = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'local';
  const clientKey = createHash('sha256').update(address.split(',')[0].trim()).digest('hex');
  const retryAfter = summaryRateLimit(clientKey);
  if (retryAfter) return new Response('Vent litt før du prøver igjen.', {
    status: 429, headers: { ...headers, 'Retry-After': String(retryAfter) },
  });

  const requestId = crypto.randomUUID();
  const started = Date.now();
  const model = process.env.AI_SUMMARY_MODEL?.trim() || SUMMARY_MODEL;
  const logContext = { requestId, ...target.data, model };
  try {
    const source = await getSummarySource(target.data);
    if (!source) return new Response('Siden finnes ikke.', { status: 404, headers });
    if (source.content.length < 100 || source.content.length > 110_000) {
      throw new Error('Invalid summary source length');
    }
    const cache = getCache({ namespace: 'page-ai-summary', keyHashFunction: key => key });
    const cacheKey = summaryCacheKey(source, model);
    const cached = await cache.get(cacheKey);
    if (cached !== null) {
      const summary = pageSummarySchema.parse(cached);
      console.info(JSON.stringify({ event: 'ai_summary_cache_hit', ...logContext, durationMs: Date.now() - started }));
      return Response.json(summary, { headers: { ...headers, 'X-AI-Summary-Cache': 'HIT' } });
    }
    const summaryApiKey = process.env.AI_SUMMARY_GATEWAY_API_KEY?.trim();
    if (!summaryApiKey && !process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
      console.warn(JSON.stringify({ event: 'ai_summary_unconfigured', ...logContext }));
      return new Response('Oppsummeringen er midlertidig utilgjengelig.', { status: 503, headers });
    }

    const cancellation = new AbortController();
    const abortSignal = AbortSignal.any([request.signal, cancellation.signal]);
    abortSignal.throwIfAborted();
    const result = streamText({
      model: summaryApiKey ? createGateway({ apiKey: summaryApiKey })(model) : model,
      system: summaryInstructions,
      prompt: buildSummaryPrompt(source),
      output: Output.object({ schema: pageSummarySchema }),
      maxOutputTokens: 2400,
      timeout: 25_000,
      maxRetries: 1,
      abortSignal,
      onError: () => {}, // The response stream below logs errors once, without prompt/provider payloads.
    });

    const stream = new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const part of result.stream) {
            if (part.type === 'text-delta') controller.enqueue(part.text);
            if (part.type === 'error') throw part.error;
            if (part.type === 'abort') throw new Error('Summary aborted');
          }
          const summary = pageSummarySchema.parse(await result.output);
          if (await result.finishReason !== 'stop') throw new Error('Incomplete summary');
          abortSignal.throwIfAborted();
          try {
            await cache.set(cacheKey, summary, {
              ttl: 86400, tags: ['page-ai-summary', `${source.kind}:${source.slug}`],
              name: `${source.kind}/${source.slug}`,
            });
          } catch (error) {
            console.error(JSON.stringify({ event: 'ai_summary_cache_write_failed', ...logContext, error: error instanceof Error ? error.name : 'UnknownError' }));
          }
          const usage = await result.totalUsage;
          console.info(JSON.stringify({ event: 'ai_summary_completed', ...logContext,
            durationMs: Date.now() - started, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens }));
          controller.close();
        } catch (error) {
          cancellation.abort();
          console.error(JSON.stringify({ event: 'ai_summary_failed', ...logContext,
            durationMs: Date.now() - started, error: error instanceof Error ? error.name : 'UnknownError' }));
          controller.error(new Error('Oppsummeringen kunne ikke fullføres.'));
        }
      },
      cancel() {
        cancellation.abort();
      },
    });
    return createTextStreamResponse({ stream, headers: { ...headers, 'X-AI-Summary-Cache': 'MISS' } });
  } catch (error) {
    console.error(JSON.stringify({ event: 'ai_summary_failed', ...logContext,
      durationMs: Date.now() - started, error: error instanceof Error ? error.name : 'UnknownError' }));
    return new Response('Oppsummeringen er midlertidig utilgjengelig.', { status: 503, headers });
  }
}
