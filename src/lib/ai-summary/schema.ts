import { z } from 'zod';

export const summaryTargetSchema = z.object({
  kind: z.enum(['product', 'article']),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).strict();

export type SummaryTarget = z.infer<typeof summaryTargetSchema>;

export const pageSummarySchema = z.object({
  summary: z.string().trim().min(20).max(900)
    .describe('To til fire korte setninger på norsk bokmål, maksimalt 70 ord.'),
  keyPoints: z.array(z.string().trim().min(5).max(240)).min(2).max(4)
    .describe('To til fire konkrete hovedpunkter som finnes i kildeteksten.'),
  limitations: z.array(z.string().trim().min(5).max(300)).max(3)
    .describe('Viktige forbehold eller begrensninger uttrykkelig omtalt i kilden. Tom liste hvis ingen er relevante.'),
});

export type PageSummary = z.infer<typeof pageSummarySchema>;
export type SummarySource = SummaryTarget & { title: string; content: string };
