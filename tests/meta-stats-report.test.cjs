/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const entry = 'app/api/meta/meta-stats/metaStatsReport.ts';
const start = '2026-10-13T04:07:24Z';
const end = '2026-10-14T00:07:24Z';
const bucket = (time, count = 1) => ({ start_time: time, data: [{ value: 'PageView', count }] });
const plain = value => JSON.parse(JSON.stringify(value));

function harness({ hourly, quality = { web: [] }, totals, totalsPaging, processing, failure } = {}) {
  const calls = [];
  const api = loadTypeScript(entry, {
    env: { NEXT_PUBLIC_META_PIXEL_ID: '123', META_ACCESS_TOKEN: 'fixture-token' },
    fetch: async input => {
      const url = new URL(input);
      assert.equal(url.origin, 'https://graph.facebook.com');
      assert.equal(url.searchParams.get('access_token'), 'fixture-token');
      const aggregation = url.searchParams.get('aggregation');
      const after = url.searchParams.get('after');
      calls.push({ aggregation, after });
      if (failure) return { ok: false, status: 400, json: async () => failure };
      const body = url.pathname.endsWith('/dataset_quality') ? quality
        : aggregation === 'event_total_counts' ? { data: totals ?? [bucket(start, 5)], paging: totalsPaging }
        : aggregation === 'event_processing_results' ? processing ?? { data: [] }
        : hourly ? hourly(after) : { data: [bucket('2026-10-13T10:00:00Z')] };
      return { ok: true, status: 200, json: async () => body };
    },
  });
  return { ...api, calls, report: () => api.fetchMetaStatsReport(start, end) };
}

test('hour buckets never masquerade as exact event times or sum repeated span aggregates', () => {
  const { buildMetaEventMetrics } = harness();
  const metrics = plain(buildMetaEventMetrics(
    [bucket(start, 5), bucket('2026-10-13T08:00:00Z', 2)],
    [bucket('2026-10-14T10:00:00+0000')],
    new Date('2026-10-14T10:27:00Z'),
  ));
  assert.equal(metrics[0].count, 5);
  assert.equal(metrics[0].last_event_at, null);
  assert.equal(metrics[0].minutes_since_last_event, null);
  assert.equal(metrics[0].last_event_bucket_start_at, '2026-10-14T10:00:00.000Z');
  assert.equal(metrics[0].minutes_since_last_event_bucket_start, 27);
  assert.equal(metrics[0].event_time_precision, 'hour_bucket');
});

test('future or empty buckets cannot hide the latest observed past hour', () => {
  const { buildMetaEventMetrics } = harness();
  const [metric] = buildMetaEventMetrics([bucket(start)], [
    bucket('2026-10-14T09:00:00Z'), bucket('2026-10-14T10:00:00Z', 0),
    bucket('2026-10-14T11:00:00Z'),
  ], new Date('2026-10-14T10:27:00Z'));
  assert.equal(metric.last_event_bucket_start_at, '2026-10-14T09:00:00.000Z');
  assert.equal(metric.minutes_since_last_event_bucket_start, 87);
});

test('span totals expose first-response provenance without counting cursor suffixes again', async () => {
  const h = harness({ totals: [bucket(start, 5), bucket('2026-10-13T08:00:00Z', 2)],
    totalsPaging: { next: 'https://graph.facebook.com/v26.0/123/stats?after=suffix' },
  });
  const report = await h.report();
  assert.equal(report.total_event_count, 5);
  assert.equal(report.count_source.paging_next_present, true);
  assert.equal(report.count_source.pagination_followed, false);
  assert.equal(report.count_source.returned_buckets, 2);
  assert.equal(h.calls.filter(c => c.aggregation === 'event_total_counts').length, 1);
});

test('a terminal cursor without paging.next does not request another page', async () => {
  const h = harness({ hourly: after => {
    assert.equal(after, null, 'the terminal after cursor is not a next-page instruction');
    return { data: [bucket('2026-10-13T10:00:00Z')], paging: { cursors: { after: 'terminal' } } };
  } });
  const report = await h.report();
  assert.equal(h.calls.filter(c => c.aggregation === 'event').length, 1);
  assert.deepEqual(plain(report.pagination.event), { complete: true, pages_read: 1, stop_reason: 'end_of_results' });
});

test('paging.next can carry the cursor, without following its URL or credentials', async () => {
  const h = harness({ hourly: after => after
    ? { data: [bucket('2026-10-13T11:00:00Z')] }
    : { data: [bucket('2026-10-13T10:00:00Z')], paging: { next: 'https://graph.facebook.com/v26.0/123/stats?after=second&access_token=do-not-follow' } },
  });
  const report = await h.report();
  assert.equal(report.pagination.event.pages_read, 2);
  assert.equal(report.pagination.event.complete, true);
  assert.equal(report.event_counts[0].last_event_bucket_start_at, '2026-10-13T11:00:00.000Z');
  assert.deepEqual(h.calls.filter(c => c.aggregation === 'event').map(c => c.after), [null, 'second']);
});

test('repeated cursors are reported as incomplete instead of silently succeeding', async () => {
  const h = harness({ hourly: () => ({ data: [bucket('2026-10-13T10:00:00Z')], paging: {
    next: 'https://graph.facebook.com/v26.0/123/stats?after=repeated', cursors: { after: 'repeated' },
  } }) });
  const report = await h.report();
  assert.deepEqual(plain(report.pagination.event), { complete: false, pages_read: 2, stop_reason: 'repeated_cursor' });
  assert.match(h.renderMetaStatsMarkdown(report), /ufullstendig/i);
});

test('the page cap and missing next cursor remain explicit incompleteness', async () => {
  let page = 0;
  const h = harness({ hourly: () => ({ data: [bucket('2026-10-13T10:00:00Z')], paging: {
    next: `https://graph.facebook.com/v26.0/123/stats?after=page${++page}`,
  } }) });
  const report = await h.report();
  assert.deepEqual(plain(report.pagination.event), { complete: false, pages_read: 20, stop_reason: 'page_limit' });
  const malformed = harness({ hourly: () => ({ data: [], paging: { next: 'https://graph.facebook.com/v26.0/123/stats' } }) });
  assert.deepEqual(plain((await malformed.report()).pagination.event), { complete: false, pages_read: 1, stop_reason: 'missing_cursor' });
});

test('quality scope, missing fields and processing metadata cannot claim verified deduplication', async () => {
  const h = harness({
    totals: [{ start_time: start, data: [{ value: 'PageView', count: 5 }, { value: 'Purchase', count: 1 }] }],
    quality: { web: [{ event_name: 'PageView', event_match_quality: { composite_score: 0, diagnostics: [] } }] },
    processing: { data: [{ start_time: start, data: [{ event: 'PageView' }] }] },
  });
  const report = await h.report();
  assert.equal(report.data_semantics.quality_time_range_matches_stats, false);
  assert.equal(report.data_semantics.event_coverage_window_days, 7);
  assert.deepEqual(plain(report.quality_events_not_returned), ['Purchase']);
  assert.equal(report.quality_field_availability[0].diagnostics, 'empty');
  assert.equal(report.quality_field_availability[0].event_coverage, 'not_returned');
  assert.equal(report.quality_field_availability[0].event_match_quality, 'present');
  assert.equal(report.event_processing_results.length, 1);
  assert.deepEqual(plain(report.deduplication_and_coverage), []);
  const md = h.renderMetaStatsMarkdown(report);
  assert.match(md, /7.dagers/i);
  assert.match(md, /ikke.*dedupliseringskvitteringer/i);
  assert.match(md, /Purchase/);
  assert.match(md, /\| PageView \| Returnert \| Ikke returnert \| Ikke returnert \| Ikke returnert \| Tomt \|/);
});

test('malformed stats are not converted into an apparently empty or valid report', async () => {
  const h = harness({ hourly: () => ({ data: 'invalid' }) });
  await assert.rejects(h.report(), /data array/i);
  const { buildMetaEventMetrics } = harness();
  for (const count of [null, '', true, -1, 1.5]) {
    assert.throws(() => buildMetaEventMetrics([bucket(start, count)], [], new Date()), /count/i);
  }
});

test('Graph error diagnostics keep codes without echoing free-form provider text', async () => {
  const h = harness({ failure: { error: { code: 100, error_subcode: 42, message: 'fixture-secret should never reach the report' } } });
  await assert.rejects(h.report(), error => /HTTP 400/.test(error.message)
    && /code=100/.test(error.message) && /subcode=42/.test(error.message)
    && !error.message.includes('fixture-secret'));
});
