import * as z from '@/lib/validation/zodMini'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalFormErrorCustomDataSchema = z.strictObject(
  {
    attempt_id: z.string().check(z.minLength(1)),
    form_id: z.string().check(z.minLength(1)),
    error_category: z.string().check(z.minLength(1))
  }
)

export const canonicalFormErrorSchema = z.strictObject({
  ...canonicalEventEnvelopeSchema.shape,
  event_name: z.literal('form_error'),
  source: z.literal('web'),
  page_url: z.string().check(z.url()),
  referrer_url: z.optional(z.string().check(z.url())),
  page_title: z.string().check(z.minLength(1)),
  page_view_id: z.optional(z.string().check(z.uuid())),
  custom_data: canonicalFormErrorCustomDataSchema
})

export type CanonicalFormError = z.infer<
  typeof canonicalFormErrorSchema
>
