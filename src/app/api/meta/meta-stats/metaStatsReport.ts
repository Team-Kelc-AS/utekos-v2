export type MetaEventMetric = {
  event_name: string;
  count: number;
  /** @deprecated Stats does not provide exact event times. Use the bucket fields. */
  last_event_at: null;
  /** @deprecated An exact elapsed time cannot be derived from hourly buckets. */
  minutes_since_last_event: null;
  last_event_bucket_start_at: string | null;
  minutes_since_last_event_bucket_start: number | null;
  event_time_precision: "hour_bucket" | "unavailable";
};

type StatsPagination = {
  complete: boolean;
  pages_read: number;
  stop_reason: "end_of_results" | "repeated_cursor" | "page_limit" | "missing_cursor";
};

type FieldAvailability = "not_returned" | "empty" | "present";
type QualityFieldAvailability = {
  event_name: string;
  event_match_quality: FieldAvailability;
  diagnostics: FieldAvailability;
  event_coverage: FieldAvailability;
  data_freshness: FieldAvailability;
  dedupe_key_feedback: FieldAvailability;
};

export type MetaStatsReport = {
  time_range: { start: string; end: string };
  generated_at: string;
  total_event_count: number;
  event_counts: MetaEventMetric[];
  /** @deprecated Processing metadata is now event_processing_results, not dedupe proof. */
  deduplication_and_coverage: never[];
  event_processing_results: unknown[];
  current_emq_and_freshness: unknown[];
  count_source: {
    aggregation: "event_total_counts";
    pages_read: 1;
    bucket_selection: "earliest_span_bucket";
    returned_buckets: number;
    paging_next_present: boolean;
    pagination_followed: false;
  };
  pagination: { event: StatsPagination; event_processing_results: StatsPagination };
  data_semantics: {
    event_count_aggregation: "event_total_counts";
    event_recency: "hour_bucket_start";
    hourly_top_events_limit: 100;
    quality_time_scope: "current_snapshot";
    quality_time_range_matches_stats: false;
    event_coverage_window_days: 7;
    deduplication_receipts_provided: false;
  };
  quality_field_availability: QualityFieldAvailability[];
  quality_events_not_returned: string[];
};

type MetaStatsRow = { value?: unknown; count?: unknown };
type MetaStatsBucket = { start_time?: unknown; data?: unknown };
type MetaApiResponse = {
  data?: unknown;
  paging?: { next?: unknown; cursors?: { after?: string } };
  error?: { code?: unknown; error_subcode?: unknown };
};

const GRAPH_API_VERSION = "v26.0";
const MAX_STATS_PAGES = 20;

function formatGraphError(body: MetaApiResponse, status: number) {
  const diagnostics = [
    ["code", body.error?.code],
    ["subcode", body.error?.error_subcode],
  ].flatMap(([name, value]) =>
    typeof value === "number" && Number.isSafeInteger(value) ? [`${name}=${value}`] : [],
  );
  return `Meta Graph API returned HTTP ${status}${diagnostics.length ? `; ${diagnostics.join("; ")}` : ""}`;
}

async function readMetaResponse(url: URL): Promise<MetaApiResponse> {
  const response = await fetch(url, { cache: "no-store" });
  const body: MetaApiResponse = await response.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Meta Graph API returned an invalid response object");
  }

  if (!response.ok || body.error) {
    throw new Error(formatGraphError(body, response.status));
  }

  return body;
}

function readStatsBuckets(body: MetaApiResponse): MetaStatsBucket[] {
  if (!Array.isArray(body.data)) {
    throw new Error("Meta stats response is missing a data array");
  }
  for (const bucket of body.data) {
    if (!bucket || typeof bucket !== "object" || !Array.isArray(bucket.data)) {
      throw new Error("Meta stats response contains an invalid bucket data array");
    }
  }
  return body.data as MetaStatsBucket[];
}

async function readPagedStats(
  datasetId: string,
  accessToken: string,
  aggregation: string,
  start: string,
  end: string,
): Promise<{ buckets: MetaStatsBucket[]; pagination: StatsPagination }> {
  const rows: MetaStatsBucket[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  for (let page = 0; page < MAX_STATS_PAGES; page += 1) {
    const url = new URL(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${datasetId}/stats`,
    );
    url.searchParams.set("aggregation", aggregation);
    url.searchParams.set("start_time", start);
    url.searchParams.set("end_time", end);
    url.searchParams.set("limit", "500");
    url.searchParams.set("access_token", accessToken);
    if (cursor) url.searchParams.set("after", cursor);

    const body = await readMetaResponse(url);
    rows.push(...readStatsBuckets(body));
    const finish = (complete: boolean, stop_reason: StatsPagination["stop_reason"]) => ({
      buckets: rows,
      pagination: { complete, pages_read: page + 1, stop_reason },
    });

    // A cursor identifies the end of this page; only paging.next means more data.
    const next = body.paging?.next;
    if (next === undefined || next === null) return finish(true, "end_of_results");
    let nextCursor = body.paging?.cursors?.after;
    if (!nextCursor && typeof next === "string") {
      try {
        nextCursor = new URL(next).searchParams.get("after") ?? undefined;
      } catch {
        // Do not fetch a provider-supplied URL or expose it in diagnostics.
      }
    }
    if (!nextCursor?.trim()) return finish(false, "missing_cursor");
    if (seenCursors.has(nextCursor)) return finish(false, "repeated_cursor");
    if (page + 1 === MAX_STATS_PAGES) return finish(false, "page_limit");
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  throw new Error("Meta stats pagination did not terminate");
}

async function readSpanTotalStats(
  datasetId: string,
  accessToken: string,
  start: string,
  end: string,
) {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${datasetId}/stats`,
  );
  url.searchParams.set("aggregation", "event_total_counts");
  url.searchParams.set("start_time", start);
  url.searchParams.set("end_time", end);
  url.searchParams.set("limit", "500");
  url.searchParams.set("access_token", accessToken);

  const body = await readMetaResponse(url);
  return { buckets: readStatsBuckets(body), hasNext: body.paging?.next != null };
}

function parseCount(value: unknown): number {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !/^\d+$/.test(value.trim()))
  ) throw new Error("Meta stats contains an invalid event count");
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Meta stats contains an invalid event count");
  }
  return count;
}

function countRows(buckets: MetaStatsBucket[]) {
  const counts = new Map<string, number>();

  for (const bucket of buckets) {
    if (!Array.isArray(bucket.data)) continue;
    for (const row of bucket.data as MetaStatsRow[]) {
      if (!row || typeof row.value !== "string" || !row.value.trim()) {
        throw new Error("Meta stats contains an invalid event count row");
      }
      const count = parseCount(row.count);
      counts.set(row.value, (counts.get(row.value) ?? 0) + count);
    }
  }

  return counts;
}

function spanTotalBucket(buckets: MetaStatsBucket[]) {
  if (buckets.length <= 1) return buckets;

  const dated = buckets
    .map((bucket) => ({
      bucket,
      timestamp: parseMetaTimestamp(bucket.start_time),
    }))
    .filter(
      (
        entry,
      ): entry is {
        bucket: MetaStatsBucket;
        timestamp: number;
      } => entry.timestamp !== null,
    );

  if (dated.length === 0) return buckets.slice(0, 1);

  dated.sort((a, b) => a.timestamp - b.timestamp);
  const earliest = dated[0];
  return earliest ? [earliest.bucket] : buckets.slice(0, 1);
}

function parseMetaTimestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function latestEventBuckets(buckets: MetaStatsBucket[], nowMs: number) {
  const latestByEvent = new Map<string, number>();

  for (const bucket of buckets) {
    const timestamp = parseMetaTimestamp(bucket.start_time);
    if (timestamp === null || timestamp > nowMs || !Array.isArray(bucket.data)) continue;

    for (const row of bucket.data as MetaStatsRow[]) {
      if (!row || typeof row.value !== "string" || !row.value.trim()) {
        throw new Error("Meta stats contains an invalid event count row");
      }
      if (parseCount(row.count) === 0) continue;
      latestByEvent.set(
        row.value,
        Math.max(latestByEvent.get(row.value) ?? 0, timestamp),
      );
    }
  }

  return latestByEvent;
}

export function buildMetaEventMetrics(
  countBuckets: MetaStatsBucket[],
  hourlyBuckets: MetaStatsBucket[],
  now: Date,
): MetaEventMetric[] {
  const counts = countRows(spanTotalBucket(countBuckets));
  const nowMs = now.getTime();
  const latestByEvent = latestEventBuckets(hourlyBuckets, nowMs);

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([event_name, count]) => {
      const lastEventMs = latestByEvent.get(event_name);
      const isObserved = lastEventMs !== undefined && lastEventMs <= nowMs;

      return {
        event_name,
        count,
        last_event_at: null,
        minutes_since_last_event: null,
        last_event_bucket_start_at: isObserved ? new Date(lastEventMs).toISOString() : null,
        minutes_since_last_event_bucket_start: isObserved
          ? Math.floor((nowMs - lastEventMs) / 60_000)
          : null,
        event_time_precision: isObserved ? "hour_bucket" : "unavailable",
      };
    });
}

export async function fetchMetaStatsReport(
  start: string,
  end: string,
): Promise<MetaStatsReport> {
  const datasetId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!datasetId || !accessToken) {
    throw new Error("Mangler Meta Credentials i .env");
  }

  const qualityUrl = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/dataset_quality`,
  );
  qualityUrl.searchParams.set("dataset_id", datasetId);
  qualityUrl.searchParams.set(
    "fields",
    "web{event_name,event_match_quality{composite_score,match_key_feedback,diagnostics},event_coverage,data_freshness,dedupe_key_feedback}",
  );
  qualityUrl.searchParams.set("access_token", accessToken);

  const [processingBuckets, countBuckets, hourlyBuckets, qualityBody] =
    await Promise.all([
      readPagedStats(
        datasetId,
        accessToken,
        "event_processing_results",
        start,
        end,
      ),
      readSpanTotalStats(datasetId, accessToken, start, end),
      readPagedStats(datasetId, accessToken, "event", start, end),
      readMetaResponse(qualityUrl),
    ]);

  const eventCounts = buildMetaEventMetrics(
    countBuckets.buckets,
    hourlyBuckets.buckets,
    new Date(),
  );
  const quality = qualityBody as MetaApiResponse & {
    web?: unknown;
  };

  const qualityEvents = Array.isArray(quality.web) ? quality.web : [];
  const qualityNames = new Set(qualityEvents.map((item) => asRecord(item).event_name));

  return {
    time_range: { start, end },
    generated_at: new Date().toISOString(),
    total_event_count: eventCounts.reduce(
      (total, event) => total + event.count,
      0,
    ),
    event_counts: eventCounts,
    deduplication_and_coverage: [],
    event_processing_results: processingBuckets.buckets,
    current_emq_and_freshness: qualityEvents,
    count_source: {
      aggregation: "event_total_counts",
      pages_read: 1,
      bucket_selection: "earliest_span_bucket",
      returned_buckets: countBuckets.buckets.length,
      paging_next_present: countBuckets.hasNext,
      pagination_followed: false,
    },
    pagination: {
      event: hourlyBuckets.pagination,
      event_processing_results: processingBuckets.pagination,
    },
    data_semantics: {
      event_count_aggregation: "event_total_counts",
      event_recency: "hour_bucket_start",
      hourly_top_events_limit: 100,
      quality_time_scope: "current_snapshot",
      quality_time_range_matches_stats: false,
      event_coverage_window_days: 7,
      deduplication_receipts_provided: false,
    },
    quality_field_availability: qualityEvents.map(qualityFieldAvailability),
    quality_events_not_returned: eventCounts
      .filter((event) => !qualityNames.has(event.event_name))
      .map((event) => event.event_name),
  };
}

function escapeTableCell(value: unknown) {
  return String(value ?? "–")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function fieldAvailability(value: unknown): FieldAvailability {
  if (value === undefined || value === null) return "not_returned";
  if (Array.isArray(value) && value.length === 0) return "empty";
  if (typeof value === "object" && Object.keys(value).length === 0) return "empty";
  return "present";
}

function qualityFieldAvailability(value: unknown): QualityFieldAvailability {
  const event = asRecord(value);
  return {
    event_name: String(event.event_name ?? "unknown"),
    event_match_quality: fieldAvailability(event.event_match_quality),
    diagnostics: fieldAvailability(asRecord(event.event_match_quality).diagnostics),
    event_coverage: fieldAvailability(event.event_coverage),
    data_freshness: fieldAvailability(event.data_freshness),
    dedupe_key_feedback: fieldAvailability(event.dedupe_key_feedback),
  };
}

function percentage(value: unknown) {
  const record = asRecord(value);
  return typeof record.percentage === "number" ? `${record.percentage}%` : "–";
}

export function renderMetaStatsMarkdown(report: MetaStatsReport) {
  const lines = [
    "# Meta-statistikk",
    "",
    `- **Tidsrom (UTC):** ${report.time_range.start} – ${report.time_range.end}`,
    `- **Hentet (UTC):** ${report.generated_at}`,
    `- **Totalt antall events:** ${report.total_event_count}`,
    "- **Totalkilde:** Metas event_total_counts for hele tidsrommet. Cursor-suffikser summeres ikke som nye hendelser.",
    "- **Eksakt siste hendelsestid:** ikke tilgjengelig fra denne statistikkilden. Bruk timebøttefeltene i JSON.",
    "- **Tidsgrunnlag for kvalitet:** gjeldende kvalitetsøyeblikk; eventdekning er et 7-dagers gjennomsnitt og følger ikke valgt statsperiode.",
    "- **Paginering:** " + Object.entries(report.pagination).map(([name, state]) =>
      `${name}: ${state.complete ? "fullført" : "ufullstendig"} (${state.pages_read} sider, ${state.stop_reason})`,
    ).join("; "),
    "",
    "## Events i valgt tidsrom",
    "",
    "Meta grupperer de 100 hyppigste hendelsesnavnene per time. «Minutter siden» regnes fra starten på siste aktive timebøtte; dette er ikke en eksakt hendelsestid.",
    "",
    "| Event | Antall | Siste aktive timebøtte (UTC) | Minutter siden (ca.) |",
    "| --- | ---: | --- | ---: |",
  ];

  if (report.event_counts.length === 0) {
    lines.push("| Ingen events i perioden | 0 | – | – |");
  } else {
    for (const event of report.event_counts) {
      lines.push(
        `| ${escapeTableCell(event.event_name)} | ${event.count} | ${escapeTableCell(event.last_event_bucket_start_at ?? "Ikke observert")} | ${event.minutes_since_last_event_bucket_start ?? "–"} |`,
      );
    }
  }

  lines.push(
    "",
    "## Event-behandling per time",
    "",
    "Dette er Metas behandlingsmetadata, ikke leverings- eller dedupliseringskvitteringer.",
    "",
    "| Time (UTC) | Events rapportert av Meta |",
    "| --- | --- |",
  );
  for (const item of report.event_processing_results) {
    const bucket = asRecord(item);
    const names = Array.isArray(bucket.data)
      ? bucket.data
          .map((row) => escapeTableCell(asRecord(row).event))
          .join(", ")
      : "–";
    lines.push(`| ${escapeTableCell(bucket.start_time)} | ${names || "–"} |`);
  }
  if (report.event_processing_results.length === 0)
    lines.push("| – | Ingen data fra Meta i perioden |");

  lines.push(
    "",
    "## Event-kvalitet, dekning og ferskhet",
    "",
    "Manglende eller tomme felt er ikke bevis på feilfri levering eller deduplisering.",
    ...(report.quality_events_not_returned.length
      ? [`Ingen kvalitetsrad returnert for: ${report.quality_events_not_returned.map(escapeTableCell).join(", ")}.`, ""]
      : []),
    "| Event | EMQ | Eventdekning | Ferskhet |",
    "| --- | ---: | --- | --- |",
  );

  for (const item of report.current_emq_and_freshness) {
    const event = asRecord(item);
    const matchQuality = asRecord(event.event_match_quality);
    lines.push(
      `| ${escapeTableCell(event.event_name)} | ${escapeTableCell(matchQuality.composite_score)} | ${escapeTableCell(JSON.stringify(event.event_coverage))} | ${escapeTableCell(JSON.stringify(event.data_freshness))} |`,
    );
  }
  if (report.current_emq_and_freshness.length === 0)
    lines.push("| – | – | – | Ingen kvalitetsdata returnert |");

  const availabilityLabels: Record<FieldAvailability, string> = {
    present: "Returnert", empty: "Tomt", not_returned: "Ikke returnert",
  };
  lines.push(
    "", "### Tilgjengelige kvalitetsfelt", "",
    "| Event | EMQ | Dekning | Ferskhet | Dedupe-feedback | Diagnostics |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const event of report.quality_field_availability) {
    lines.push(
      `| ${escapeTableCell(event.event_name)} | ${availabilityLabels[event.event_match_quality]} | ${availabilityLabels[event.event_coverage]} | ${availabilityLabels[event.data_freshness]} | ${availabilityLabels[event.dedupe_key_feedback]} | ${availabilityLabels[event.diagnostics]} |`,
    );
  }
  if (report.quality_field_availability.length === 0)
    lines.push("| – | Ikke returnert | Ikke returnert | Ikke returnert | Ikke returnert | Ikke returnert |");

  lines.push(
    "",
    "### Match key-feedback",
    "",
    "| Event | Identifier | Dekning | Potensiell ACR-økning |",
    "| --- | --- | ---: | ---: |",
  );

  let matchKeyRows = 0;
  for (const item of report.current_emq_and_freshness) {
    const event = asRecord(item);
    const quality = asRecord(event.event_match_quality);
    if (!Array.isArray(quality.match_key_feedback)) continue;
    for (const entry of quality.match_key_feedback) {
      const feedback = asRecord(entry);
      lines.push(
        `| ${escapeTableCell(event.event_name)} | ${escapeTableCell(feedback.identifier)} | ${percentage(feedback.coverage)} | ${percentage(feedback.potential_aly_acr_increase)} |`,
      );
      matchKeyRows += 1;
    }
  }
  if (matchKeyRows === 0)
    lines.push("| – | Ingen match key-feedback returnert | – | – |");

  lines.push(
    "",
    "### Dedupliserings-feedback",
    "",
    "| Event | Nøkkel | Browser-events med nøkkel | Server-events med nøkkel | Browser-dekning fra nøkkelen |",
    "| --- | --- | ---: | ---: | ---: |",
  );

  let dedupeRows = 0;
  for (const item of report.current_emq_and_freshness) {
    const event = asRecord(item);
    if (!Array.isArray(event.dedupe_key_feedback)) continue;
    for (const entry of event.dedupe_key_feedback) {
      const feedback = asRecord(entry);
      lines.push(
        `| ${escapeTableCell(event.event_name)} | ${escapeTableCell(feedback.dedupe_key)} | ${percentage(feedback.browser_events_with_dedupe_key)} | ${percentage(feedback.server_events_with_dedupe_key)} | ${percentage(feedback.overall_browser_coverage_from_dedupe_key)} |`,
      );
      dedupeRows += 1;
    }
  }
  if (dedupeRows === 0)
    lines.push("| – | Ingen dedupliserings-feedback returnert | – | – | – |");

  lines.push(
    "",
    "### Diagnostics",
    "",
    "| Event | Diagnostics fra Meta |",
    "| --- | --- |",
  );
  let diagnosticsRows = 0;
  for (const item of report.current_emq_and_freshness) {
    const event = asRecord(item);
    const quality = asRecord(event.event_match_quality);
    if (quality.diagnostics === undefined) continue;
    lines.push(
      `| ${escapeTableCell(event.event_name)} | ${escapeTableCell(JSON.stringify(quality.diagnostics))} |`,
    );
    diagnosticsRows += 1;
  }
  if (diagnosticsRows === 0) lines.push("| – | Ingen diagnostics returnert |");

  return `${lines.join("\n")}\n`;
}
