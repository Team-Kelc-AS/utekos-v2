import * as z from '@/lib/validation/zodMini'

const percentageSchema = z.number().check(z.gte(0), z.lte(100))

const percentageFeedbackSchema = z.looseObject({
  description: z.optional(z.string()),
  percentage: percentageSchema
})

const relativeIncreaseSchema = z.looseObject({
  description: z.optional(z.string()),
  percentage: z.number().check(z.gte(0))
})

const matchKeyFeedbackSchema = z.looseObject({
  coverage: z.optional(percentageFeedbackSchema),
  identifier: z.string().check(z.minLength(1)),
  potential_aly_acr_increase: z.optional(relativeIncreaseSchema)
})

const diagnosticSchema = z.looseObject({
  affected_event_count: z.optional(z.number().check(z.int(), z.gte(0))),
  description: z.optional(z.string()),
  name: z.string().check(z.minLength(1)),
  percentage: z.optional(percentageSchema),
  solution: z.optional(z.string()),
  total_event_count: z.optional(z.number().check(z.int(), z.gte(0)))
})

const dedupeKeyFeedbackSchema = z.looseObject({
  browser_events_with_dedupe_key:
    z.optional(percentageFeedbackSchema),
  dedupe_key: z.string().check(z.minLength(1)),
  overall_browser_coverage_from_dedupe_key:
    z.optional(percentageFeedbackSchema),
  server_events_with_dedupe_key:
    z.optional(percentageFeedbackSchema)
})

const eventMatchQualitySchema = z.looseObject({
  composite_score: z.number().check(z.gte(0), z.lte(10)),
  diagnostics: z.optional(z.array(diagnosticSchema)),
  match_key_feedback: z.optional(z.array(matchKeyFeedbackSchema))
})

const eventCoverageSchema = z.looseObject({
  description: z.optional(z.string()),
  goal_percentage: z.optional(percentageSchema),
  percentage: percentageSchema
})

const dataFreshnessSchema = z.looseObject({
  description: z.optional(z.string()),
  upload_frequency: z.string().check(z.minLength(1))
})

export const metaDatasetQualityEventSchema = z.looseObject({
  acr: z.nullish(relativeIncreaseSchema),
  data_freshness: z.nullish(dataFreshnessSchema),
  dedupe_key_feedback: z.nullish(z.array(dedupeKeyFeedbackSchema)),
  event_coverage: z.nullish(eventCoverageSchema),
  event_match_quality: z.nullish(eventMatchQualitySchema),
  event_name: z.string().check(z.minLength(1)),
  event_potential_aly_acr_increase:
    z.nullish(relativeIncreaseSchema)
})

export const metaDatasetQualityResponseSchema = z.looseObject({
  web: z.array(metaDatasetQualityEventSchema)
})

export type MetaDatasetQualityEvent = z.infer<
  typeof metaDatasetQualityEventSchema
>

export type MetaDatasetQualityResponse = z.infer<
  typeof metaDatasetQualityResponseSchema
>
