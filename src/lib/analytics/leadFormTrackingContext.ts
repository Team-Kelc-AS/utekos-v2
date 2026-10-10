import * as z from '@/lib/validation/zodMini'
import {
  consentSnapshotSchema,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization'

export const leadFormTrackingContextSchema = z.strictObject({
  consent: consentSnapshotSchema,
  page_url: z.string().check(z.url()),
  page_view_id: z.optional(z.string().check(z.uuid())),
  journey_id: z.optional(z.uuid()),
  referrer_url: z.optional(z.string().check(z.url())),
  cookie_header: z.optional(z.string().check(z.maxLength(4096))),
  campaign: z.optional(z.string().check(z.maxLength(200))),
  medium: z.optional(z.string().check(z.maxLength(200))),
  content: z.optional(z.string().check(z.maxLength(200))),
  term: z.optional(z.string().check(z.maxLength(200)))
})

export type LeadFormTrackingContext = z.infer<
  typeof leadFormTrackingContextSchema
>

export const LEAD_TRACKING_CONTEXT_FIELD = 'leadTrackingContext'

export function parseLeadFormTrackingContext(
  raw: FormDataEntryValue | null
): LeadFormTrackingContext | undefined {
  if (typeof raw !== 'string' || raw.length === 0) {
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }

  const result = leadFormTrackingContextSchema.safeParse(parsed)
  if (!result.success) return undefined
  if (result.data.consent.analytics !== 'granted') {
    delete result.data.journey_id
    delete result.data.page_view_id
  }
  return result.data
}

export function defaultTrackingAuthorization(): ConsentSnapshot {
  return resolveTrackingAuthorization()
}
