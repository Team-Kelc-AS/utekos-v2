import type { CanonicalGenerateLead, GenerateLeadDataLayerEvent } from './generateLeadEvent'
import { stripInternalJourneyContext } from './internalJourneyContext'

export function buildGenerateLeadDataLayerEvent(
  event: CanonicalGenerateLead
): GenerateLeadDataLayerEvent {
  return {
    event: 'generate_lead',
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    ...(event.page_view_id ?
      { page_view_id: event.page_view_id }
    : {}),
    custom_data: event.custom_data,
    canonical_event: stripInternalJourneyContext(event)
  }
}
