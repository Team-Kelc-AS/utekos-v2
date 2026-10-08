'use server';
import { recordAcceptedWaitlist } from '@/lib/tracking/server-forms';
import type { GenerateLeadDataLayerEvent } from '@/lib/analytics/generateLeadEvent';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getContactEmailConfig } from '@/lib/contact';
const schema = z.object({
  name: z.string().trim().min(2, 'Skriv navnet ditt.').max(100).refine(v => !/[\r\n]/.test(v)),
  email: z.email('Skriv en gyldig e-postadresse.').max(254),
  phone: z.string().trim().min(5, 'Skriv telefonnummeret ditt.').max(40),
  privacy: z.literal(true, { error: 'Bekreft at du har lest personvernerklæringen.' }),
  marketing: z.boolean(), website: z.string().max(200),
});
export type WaitlistState = { status: 'idle' | 'success' | 'error'; message: string; errors?: Record<string, string[] | undefined>; trackingEvent?: GenerateLeadDataLayerEvent };
async function subscribe(email: string) {
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!token || !domain) return false;
  const call = async (query: string, variables: Record<string, unknown>) => {
    const response = await fetch(`https://${domain}/admin/api/2026-10/graphql.json`, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Subscription unavailable');
    const result = await response.json();
    if (result.errors?.length) throw new Error('Subscription rejected');
    return result.data;
  };
  try {
    const result = await call('mutation Subscriber($input: CustomerSetInput!, $identifier: CustomerSetIdentifiers!) { customerSet(input: $input, identifier: $identifier) { customer { id } userErrors { message } } }', { input: { email }, identifier: { email } });
    if (!result.customerSet.customer?.id || result.customerSet.userErrors.length) return false;
    const consent = await call('mutation Consent($input: CustomerEmailMarketingConsentUpdateInput!) { customerEmailMarketingConsentUpdate(input: $input) { userErrors { message } } }', { input: { customerId: result.customerSet.customer.id, emailMarketingConsent: { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN', consentUpdatedAt: new Date().toISOString() } } });
    return !consent.customerEmailMarketingConsentUpdate.userErrors.length;
  } catch { return false; }
}
export async function submitWaitlist(_previous: WaitlistState, data: FormData): Promise<WaitlistState> {
  const parsed = schema.safeParse({ name: data.get('name'), email: data.get('email'), phone: data.get('phone'), privacy: data.get('privacy') === 'on', marketing: data.get('marketing') === 'on', website: data.get('website') ?? '' });
  if (!parsed.success) return { status: 'error', message: 'Kontroller feltene og prøv igjen.', errors: z.flattenError(parsed.error).fieldErrors };
  if (parsed.data.website) return { status: 'success', message: 'Takk for interessen.' };
  const config = getContactEmailConfig();
  if (!config) return { status: 'error', message: 'Ventelisten er midlertidig utilgjengelig. Prøv igjen senere.' };
  const { name, email, phone, marketing } = parsed.data;
  const payload = { from: `Utekos Venteliste <${config.from}>`, to: [config.to], reply_to: email, subject: `Ny ventelistepåmelding: Utekos Dun™ – ${name}`, text: `Produkt: Utekos Dun™\nNavn: ${name}\nE-post: ${email}\nTelefon: ${phone}\nPersonvern: bekreftet\nMarkedsføringssamtykke: ${marketing ? 'Ja' : 'Nei'}` };
  let receiptId: string;
  try {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `waitlist/${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Email unavailable');
    receiptId = z.object({ id: z.string().min(1) }).parse(await response.json()).id;
  } catch { return { status: 'error', message: 'Vi fikk ikke registrert deg. Prøv igjen litt senere.' }; }
  const marketingSaved = !marketing || await subscribe(email);
  const trackingEvent = await recordAcceptedWaitlist(data, { receiptId, email, phone, firstName: name });
  return { status: 'success', ...(trackingEvent ? { trackingEvent } : {}), message: `Du står på ventelisten. Vi kontakter deg når Utekos Dun™ er tilbake.${marketingSaved ? '' : ' Ønsket om nyhetsbrev er sendt til kundeservice for oppfølging.'}` };
}
