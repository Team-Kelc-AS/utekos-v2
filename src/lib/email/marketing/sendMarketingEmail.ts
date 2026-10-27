import 'server-only'

import { sendMarketingMessage as sendTransactionalEmail } from './resendMarketingApi'
import { getMarketingContact } from './marketingContact'
import { createMarketingUnsubscribeUrl } from './marketingUnsubscribeToken'

const PLACEHOLDER = '{{{RESEND_UNSUBSCRIBE_URL}}}'
type Input = {
  contactId: string
  expectedEmail: string
  from: string
  replyTo?: string
  subject: string
  html: string
  text: string
  idempotencyKey: string
}
type Dependencies = {
  getContact: typeof getMarketingContact
  createUrl: typeof createMarketingUnsubscribeUrl
  send: typeof sendTransactionalEmail
}
const defaults: Dependencies = {
  getContact: getMarketingContact,
  createUrl: createMarketingUnsubscribeUrl,
  send: sendTransactionalEmail
}

// Call at delivery time, including for delayed waves. Do not pre-schedule raw
// /emails messages: subscription status could change before their delivery.
export async function sendMarketingEmail(
  input: Input,
  dependencies = defaults
) {
  if (
    !input.html.includes(`href="${PLACEHOLDER}"`) ||
    !input.text.includes(PLACEHOLDER)
  ) {
    throw new Error('marketing_unsubscribe_placeholder_missing')
  }
  const unsubscribeUrl = dependencies.createUrl(input.contactId)
  const html = input.html.replaceAll(
    PLACEHOLDER,
    unsubscribeUrl.replaceAll('&', '&amp;')
  )
  const text = input.text.replaceAll(PLACEHOLDER, unsubscribeUrl)
  if (/\{\{\{[^}]+\}\}\}/.test(html + text))
    throw new Error('marketing_unresolved_placeholder')
  // Direct /emails sends do not enforce the Contacts unsubscribe flag for us.
  // Lookup failures abort sending; recipients must match the reviewed list.
  const contact = await dependencies.getContact(input.contactId)
  if (
    contact.id !== input.contactId ||
    contact.email.trim().toLowerCase() !==
      input.expectedEmail.trim().toLowerCase()
  ) {
    throw new Error('marketing_recipient_mismatch')
  }
  if (contact.unsubscribed !== false)
    return {
      ok: false as const,
      reason: 'unsubscribed' as const
    }
  return dependencies.send({
    from: input.from,
    to: contact.email,
    subject: input.subject,
    html,
    text,
    idempotencyKey: input.idempotencyKey,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  })
}
