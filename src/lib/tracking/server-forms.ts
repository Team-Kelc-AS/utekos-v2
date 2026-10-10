import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/dist/server/request/headers';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { getVercelOidcToken } from '@vercel/oidc';
import { ipAddress, geolocation } from '@vercel/functions/headers';
import * as z from '@/lib/validation/zodMini';
import { parseLeadFormTrackingContext } from '@/lib/analytics/leadFormTrackingContext';
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization';
import { canonicalGenerateLeadSchema, buildGenerateLeadDataLayerEvent, type GenerateLeadDataLayerEvent } from '@/lib/analytics/generateLeadEvent';
import { BRIDGE_URL } from './bridge-contract';
import { identityCookieHeader, verifiedFacebookLoginId } from './backend';
import { productionTrackingEnabled, isTrackingOrigin } from './environment';

/** The same accepted Resend receipt keeps the same lead ID across lost responses. */
export function submissionIdFromReceipt(receiptId: string) {
  const bytes = createHash('sha256').update(`utekos:resend:${receiptId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
async function formRequest(form: FormData) {
  if (!productionTrackingEnabled()) return;
  const incoming = new Headers(await headers());
  const origin = incoming.get('origin');
  if (!origin || !isTrackingOrigin(origin)) return;
  const request = new NextRequest(origin, { headers: incoming });
  const supplied = parseLeadFormTrackingContext(form.get('leadTrackingContext'));
  const pageUrl = supplied?.page_url ?? incoming.get('referer');
  if (!pageUrl || new URL(pageUrl).origin !== origin) return;
  return { request, trackingContext: {
    ...supplied, consent: resolveTrackingAuthorization(), page_url: pageUrl,
    cookie_header: identityCookieHeader(request),
  } };
}
async function submitOperation(request: NextRequest, operation: '/internal/storefront/accepted-dun-waitlist' | '/internal/storefront/accepted-dun-reservation' | '/internal/storefront/accepted-dealer-inquiry' | '/api/events/form-submit', body: unknown, timeout = 8000) {
  const requestId = crypto.randomUUID();
  const geo = geolocation(request); const ip = ipAddress(request);
  const facebookLoginId = verifiedFacebookLoginId(request);
  const response = await fetch(BRIDGE_URL, {
    method: 'POST', cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(timeout),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${await getVercelOidcToken({ audience: BRIDGE_URL })}` },
    body: JSON.stringify({ version: 1, operation, method: 'POST', bodyBase64: Buffer.from(JSON.stringify(body)).toString('base64'),
      headers: { origin: request.nextUrl.origin, 'content-type': 'application/json', cookie: identityCookieHeader(request) },
      context: { publicOrigin: request.nextUrl.origin, environment: 'production', requestId,
        ...(process.env.VERCEL_GIT_COMMIT_SHA ? { deploySha: process.env.VERCEL_GIT_COMMIT_SHA } : {}),
        ...(ip ? { clientIpAddress: ip } : {}), ...(request.headers.get('user-agent') ? { userAgent: request.headers.get('user-agent') } : {}),
        ...(geo.country ? { countryCode: geo.country } : {}), ...(geo.city ? { city: geo.city } : {}),
        ...(geo.countryRegion ? { regionCode: geo.countryRegion } : {}), ...(geo.postalCode ? { postalCode: geo.postalCode } : {}),
        ...(facebookLoginId ? { facebookLoginId } : {}),
      },
    }),
  });
  if (response.status !== 200 && response.status !== 202) throw new Error('form_collection_unverified');
  return { httpStatus: response.status, data: await response.json() };
}
export async function recordAcceptedForm(form: FormData, formId: string, submissionId = crypto.randomUUID()) {
  try {
    const context = await formRequest(form); if (!context) return;
    const tracking = context.trackingContext;
    await submitOperation(context.request, '/api/events/form-submit', {
      schema_version: 1, event_name: 'form_submit', source: 'server', environment: 'production',
      event_id: submissionId, event_time: new Date().toISOString(), consent: resolveTrackingAuthorization(),
      page_url: tracking.page_url, ...(tracking.page_view_id ? { page_view_id: tracking.page_view_id } : {}),
      ...(tracking.journey_id ? { journey_id: tracking.journey_id } : {}),
      custom_data: { submission_id: submissionId, form_id: formId, form_name: formId, result: 'accepted' },
    });
  } catch { console.error('form_tracking_unverified', { formId }); }
}
export async function recordAcceptedWaitlist(form: FormData, input: { receiptId: string; email: string; phone: string; firstName: string }): Promise<GenerateLeadDataLayerEvent | undefined> {
  try {
    const context = await formRequest(form); if (!context) return;
    const submissionId = submissionIdFromReceipt(input.receiptId);
    const result = await submitOperation(context.request, '/internal/storefront/accepted-dun-waitlist', {
      submissionId, email: input.email, phone: input.phone, firstName: input.firstName,
      trackingContext: context.trackingContext,
    });
    await recordAcceptedForm(form, 'product_waitlist_utekos_dun', submissionId);
    const parsed = z.object({ status: z.enum(['accepted', 'duplicate']), eventId: z.uuid(), dataLayerEvent: z.looseObject({ canonical_event: canonicalGenerateLeadSchema }) }).safeParse(result.data);
    if (result.httpStatus === 200 && parsed.success && parsed.data.eventId === submissionId && parsed.data.dataLayerEvent.canonical_event.event_id === submissionId) {
      return buildGenerateLeadDataLayerEvent(parsed.data.dataLayerEvent.canonical_event);
    }
    console.error('waitlist_tracking_unverified', { submissionId });
  } catch { console.error('waitlist_tracking_unverified'); }
}

/** The accepted email receipt is immutable across bounded, idempotent bridge retries. */
export async function recordAcceptedDunReservation(form: FormData, input: {
  receiptId: string; email: string; phone: string; firstName: string;
  productId: string; variantId: string; color: 'Vargnatt' | 'Fjellblå'; size: 'Small' | 'Medium' | 'Large';
}): Promise<GenerateLeadDataLayerEvent | undefined> {
  const submissionId = submissionIdFromReceipt(input.receiptId);
  try {
    const context = await formRequest(form); if (!context) return;
    const body = {
      submissionId, acceptedAt: new Date().toISOString(), trackingContext: context.trackingContext,
      email: input.email, phone: input.phone, firstName: input.firstName,
      productId: input.productId, variantId: input.variantId, color: input.color, size: input.size,
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await submitOperation(context.request, '/internal/storefront/accepted-dun-reservation', body);
        const parsed = z.object({ status: z.enum(['accepted', 'duplicate']), eventId: z.uuid(), dataLayerEvent: z.looseObject({ canonical_event: canonicalGenerateLeadSchema }) }).safeParse(result.data);
        if (result.httpStatus !== 200 || !parsed.success || parsed.data.eventId !== submissionId) continue;
        const event = parsed.data.dataLayerEvent.canonical_event;
        const data = event.custom_data;
        if (event.event_id === submissionId && data.submission_id === submissionId &&
          data.form_id === 'product_reservation_utekos_dun' && data.lead_type === 'product_reservation' &&
          'variant_id' in data && data.variant_id === input.variantId && data.product_id === input.productId &&
          data.color === input.color && data.size === input.size && event.page_url === context.trackingContext.page_url) {
          return buildGenerateLeadDataLayerEvent(event);
        }
      } catch { /* Retry the same receipt, never send the email again here. */ }
    }
  } catch { /* Email acceptance remains successful if telemetry is unavailable. */ }
  console.error('dun_reservation_tracking_unverified', { submissionId });
}

/** The email receipt is authoritative. Tracking retries never resend the email. */
export async function recordAcceptedDealerInquiry(form: FormData, input: {
  receiptId: string; email: string; phone: string; name: string; storeName: string; location: string;
}): Promise<GenerateLeadDataLayerEvent | undefined> {
  const submissionId = submissionIdFromReceipt(input.receiptId);
  try {
    const context = await formRequest(form); if (!context) return;
    const acceptedAt = new Date().toISOString();
    const body = {
      submissionId, acceptedAt, email: input.email, phone: input.phone,
      name: input.name, storeName: input.storeName, location: input.location,
      trackingContext: context.trackingContext,
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await submitOperation(context.request, '/internal/storefront/accepted-dealer-inquiry', body, 12000);
        if (result.httpStatus === 200 && result.data?.status === 'stored_without_tracking') return;
        const parsed = z.object({ status: z.enum(['accepted', 'duplicate']), eventId: z.uuid(), dataLayerEvent: z.looseObject({ canonical_event: canonicalGenerateLeadSchema }) }).safeParse(result.data);
        if (result.httpStatus === 200 && parsed.success && parsed.data.eventId === submissionId &&
          parsed.data.dataLayerEvent.canonical_event.event_id === submissionId &&
          parsed.data.dataLayerEvent.canonical_event.custom_data.form_id === 'dealer_inquiry') {
          return buildGenerateLeadDataLayerEvent(parsed.data.dataLayerEvent.canonical_event);
        }
      } catch { /* Same immutable receipt ID permits an idempotent retry. */ }
    }
  } catch { /* Email acceptance must not turn into a misleading delivery error. */ }
  console.error('dealer_inquiry_tracking_unverified', { submissionId });
}
