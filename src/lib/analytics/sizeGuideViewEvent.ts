import * as z from '@/lib/validation/zodMini'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalSizeGuideViewCustomDataSchema =
  z.strictObject({
    guide_id: z.string().check(z.minLength(1)),
    open_sequence: z.number().check(z.int(), z.gt(0))
  })

export const canonicalSizeGuideViewSchema = z.strictObject({
  ...canonicalEventEnvelopeSchema.shape,
  event_name: z.literal('size_guide_view'),
  source: z.literal('web'),
  page_url: z.string().check(z.url()),
  referrer_url: z.optional(z.string().check(z.url())),
  page_title: z.string().check(z.minLength(1)),
  page_view_id: z.string().check(z.uuid()),
  custom_data: canonicalSizeGuideViewCustomDataSchema
})

export type CanonicalSizeGuideView = z.infer<
  typeof canonicalSizeGuideViewSchema
>
