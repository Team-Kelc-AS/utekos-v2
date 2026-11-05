import { z } from "zod";
import type { KnowledgeArticle } from "./knowledgeArticles";

export const articleViewsSchema = z.object({
  source: z.literal("google-analytics-4"),
  propertyId: z.string().regex(/^\d+$/),
  metric: z.literal("screenPageViews"),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  timeZone: z.literal("Europe/Oslo"),
  fetchedAt: z.iso.datetime(),
  rows: z.array(z.object({
    path: z.string().startsWith("/"),
    views: z.number().int().nonnegative().safe(),
  })),
}).refine(data => data.startDate <= data.endDate, "Invalid readership date range");

export type ArticleViews = z.infer<typeof articleViewsSchema>;

export class ArticleReadershipError extends Error {}

export function readershipDateRange(now: Date) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const day = new Date(`${today}T12:00:00Z`).getTime();
  return {
    startDate: new Date(day - 30 * 86_400_000).toISOString().slice(0, 10),
    endDate: new Date(day - 86_400_000).toISOString().slice(0, 10),
  };
}

const ga4ReportSchema = z.object({
  dimensionHeaders: z.tuple([z.object({ name: z.literal("pagePath") })]),
  metricHeaders: z.tuple([z.object({ name: z.literal("screenPageViews") })]),
  rows: z.array(z.object({
    dimensionValues: z.tuple([z.object({ value: z.string().startsWith("/") })]),
    metricValues: z.tuple([z.object({ value: z.string().regex(/^\d+$/) })]),
  })).default([]),
  rowCount: z.number().int().nonnegative().default(0),
  metadata: z.object({
    timeZone: z.literal("Europe/Oslo"),
    dataLossFromOtherRow: z.boolean().optional(),
    subjectToThresholding: z.boolean().optional(),
    samplingMetadatas: z.array(z.unknown()).optional(),
  }),
});

export function parseArticleViewsReport(
  raw: unknown,
  period: { startDate: string; endDate: string },
  propertyId: string,
  fetchedAt: string,
): ArticleViews {
  const report = ga4ReportSchema.parse(raw);
  if (report.rowCount !== report.rows.length || report.metadata.dataLossFromOtherRow ||
      report.metadata.subjectToThresholding || report.metadata.samplingMetadatas?.length) {
    throw new ArticleReadershipError("Incomplete or sampled article readership report");
  }
  return articleViewsSchema.parse({
    source: "google-analytics-4", propertyId, metric: "screenPageViews", ...period,
    timeZone: report.metadata.timeZone, fetchedAt,
    rows: report.rows.map(row => ({ path: row.dimensionValues[0].value, views: Number(row.metricValues[0].value) })),
  });
}

export function rankMostReadArticles(
  articles: readonly KnowledgeArticle[],
  rows: ArticleViews["rows"],
) {
  const views = new Map<string, number>();
  for (const row of rows) {
    const path = row.path.split(/[?#]/, 1)[0].replace(/\/$/, "").replace(/^\/kunnskap\//, "/uteguiden/");
    views.set(path, (views.get(path) ?? 0) + row.views);
  }
  // Keep the actual global top five, including the current article if it ranks.
  return articles
    .map(article => ({ article, views: views.get(article.path) ?? 0 }))
    .filter(entry => entry.views > 0)
    .sort((a, b) => b.views - a.views || a.article.slug.localeCompare(b.article.slug, "nb"))
    .slice(0, 5);
}
