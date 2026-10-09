import * as z from '@/lib/validation/zodMini'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalVideoProgressCustomDataSchema =
  z.strictObject({
    video_id: z.string().check(z.minLength(1)),
    milestone: z.union([
      z.literal(10),
      z.literal(25),
      z.literal(50),
      z.literal(75),
      z.literal(90),
      z.literal(100)
    ]),
    video_title: z.string().check(z.minLength(1)),
    video_duration: z.number().check(z.gte(0)),
    video_current_time: z.number().check(z.gte(0)),
    video_percent: z.number().check(z.int(), z.gte(1), z.lte(100))
  })

export const canonicalVideoProgressSchema = z.strictObject({
  ...canonicalEventEnvelopeSchema.shape,
  event_name: z.literal('video_progress'),
  source: z.literal('web'),
  page_url: z.string().check(z.url()),
  referrer_url: z.optional(z.string().check(z.url())),
  page_title: z.string().check(z.minLength(1)),
  page_view_id: z.string().check(z.uuid()),
  custom_data: canonicalVideoProgressCustomDataSchema
})

export type CanonicalVideoProgress = z.infer<
  typeof canonicalVideoProgressSchema
>
