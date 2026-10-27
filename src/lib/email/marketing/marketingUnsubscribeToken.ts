import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

const CONTACT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const PURPOSE = 'utekos:resend-marketing-unsubscribe:v1:'
export const MARKETING_UNSUBSCRIBE_PATH =
  '/api/email/marketing/unsubscribe'

function signature(contactId: string, secret?: string): string {
  const key = secret ?? process.env.MARKETING_UNSUBSCRIBE_SECRET
  if (!key || Buffer.byteLength(key, 'utf8') < 32) {
    throw new Error('marketing_unsubscribe_secret_invalid')
  }
  return createHmac('sha256', key)
    .update(PURPOSE + contactId)
    .digest('base64url')
}

// Stable, purpose-bound tokens keep retry payloads identical. No email address
// appears in the URL. Links remain usable while the signing secret is retained.
export function createMarketingUnsubscribeToken(
  contactId: string,
  secret?: string
): string {
  if (!CONTACT_ID.test(contactId))
    throw new Error('marketing_contact_id_invalid')
  return `m1.${contactId}.${signature(contactId, secret)}`
}

export function verifyMarketingUnsubscribeToken(
  token: string,
  secret?: string
): string {
  const [version, contactId, supplied, extra] = token.split('.')
  if (
    token.length > 128 ||
    version !== 'm1' ||
    !contactId ||
    !CONTACT_ID.test(contactId) ||
    !supplied ||
    !/^[A-Za-z0-9_-]{43}$/.test(supplied) ||
    extra !== undefined
  ) {
    throw new Error('marketing_unsubscribe_token_invalid')
  }
  if (
    !timingSafeEqual(
      Buffer.from(supplied),
      Buffer.from(signature(contactId, secret))
    )
  ) {
    throw new Error('marketing_unsubscribe_token_invalid')
  }
  return contactId
}

export function createMarketingUnsubscribeUrl(
  contactId: string,
  options: { secret?: string; baseUrl?: string } = {}
): string {
  const base = new URL(
    options.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://utekos.no'
  )
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw new Error('marketing_unsubscribe_base_url_invalid')
  }
  const url = new URL(MARKETING_UNSUBSCRIBE_PATH, base)
  url.searchParams.set(
    'token',
    createMarketingUnsubscribeToken(contactId, options.secret)
  )
  return url.toString()
}
