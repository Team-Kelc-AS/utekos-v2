import * as z from '@/lib/validation/zodMini'
import {
  canonicalCommerceItemSchema,
  canonicalCommerceValueSchema
} from './canonicalCommerceItem'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const canonicalInteractWithAccordionCustomDataSchema =
  z.strictObject({
    ...canonicalCommerceValueSchema.shape,
    accordion_id: z.string().check(z.minLength(1)),
    accordion_title: z.string().check(z.minLength(1)),
    interaction_sequence: z.number().check(z.int(), z.gt(0)),
    interaction_type: z.literal('open'),
    items: z.array(canonicalCommerceItemSchema).check(z.length(1))
  })

export type CanonicalInteractWithAccordionCustomData = z.infer<
  typeof canonicalInteractWithAccordionCustomDataSchema
>

export const canonicalInteractWithAccordionSchema =
  z.strictObject({
    ...canonicalEventEnvelopeSchema.shape,
    event_name: z.literal('interact_with_accordion'),
    source: z.literal('web'),
    page_url: z.string().check(z.url()),
    referrer_url: z.optional(z.string().check(z.url())),
    page_title: z.string().check(z.minLength(1)),
    page_view_id: z.string().check(z.uuid()),
    custom_data: canonicalInteractWithAccordionCustomDataSchema
  })

export type CanonicalInteractWithAccordion = z.infer<
  typeof canonicalInteractWithAccordionSchema
>

type CreateCanonicalInteractWithAccordionInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalInteractWithAccordionCustomData
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: Parameters<typeof mapEventDeviceInfo>[0]
  eventId: string
  eventTime: string
  externalId?: string
  impressionId?: string
  pageTitle: string
  pageUrl: string
  pageViewId: string
  referrerUrl?: string
}

export type InteractWithAccordionDataLayerEvent = {
  canonical_event: CanonicalInteractWithAccordion
  custom_data: CanonicalInteractWithAccordionCustomData
  event: 'interact_with_accordion'
  event_id: string
  event_time: string
  page_view_id: string
  source: 'web'
}

export function createCanonicalInteractWithAccordion(
  input: CreateCanonicalInteractWithAccordionInput
): CanonicalInteractWithAccordion {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalInteractWithAccordionSchema.parse({
    schema_version: 1,
    event_name: 'interact_with_accordion',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    page_url: input.pageUrl,
    page_view_id: input.pageViewId,
    page_title: input.pageTitle,
    ...(input.referrerUrl ?
      { referrer_url: input.referrerUrl }
    : {}),
    consent: input.consent,
    custom_data: input.customData,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.externalId ?
      { external_id: input.externalId }
    : {}),
    ...(input.impressionId ?
      { impression_id: input.impressionId }
    : {}),
    ...(eventDeviceInfo ?
      { event_device_info: eventDeviceInfo }
    : {})
  })
}

export function buildInteractWithAccordionDataLayerEvent(
  event: CanonicalInteractWithAccordion
): InteractWithAccordionDataLayerEvent {
  return {
    canonical_event: event,
    custom_data: event.custom_data,
    event: 'interact_with_accordion',
    event_id: event.event_id,
    event_time: event.event_time,
    page_view_id: event.page_view_id,
    source: event.source
  }
}
