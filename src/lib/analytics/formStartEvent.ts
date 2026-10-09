import * as z from '@/lib/validation/zodMini'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalFormStartCustomDataSchema = z.strictObject(
  {
    form_id: z.string().check(z.minLength(1)),
    form_name: z.string().check(z.minLength(1)),
    field_category: z.optional(z.string().check(z.minLength(1)))
  }
)

export const canonicalFormStartSchema = z.strictObject({
  ...canonicalEventEnvelopeSchema.shape,
  event_name: z.literal('form_start'),
  source: z.literal('web'),
  page_url: z.string().check(z.url()),
  referrer_url: z.optional(z.string().check(z.url())),
  page_title: z.string().check(z.minLength(1)),
  page_view_id: z.string().check(z.uuid()),
  custom_data: canonicalFormStartCustomDataSchema
})

export type CanonicalFormStart = z.infer<
  typeof canonicalFormStartSchema
>
