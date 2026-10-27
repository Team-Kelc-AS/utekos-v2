import 'server-only'
import { marketingApi } from './resendMarketingApi'

export type MarketingContact = { id: string; email: string; unsubscribed: boolean }

function contactPath(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))
    throw new Error('marketing_contact_id_invalid')
  return `/contacts/${id}`
}

export async function getMarketingContact(id: string): Promise<MarketingContact> {
  const data = await marketingApi(contactPath(id))
  if (data.id !== id || typeof data.email !== 'string' || typeof data.unsubscribed !== 'boolean')
    throw new Error('marketing_contact_lookup_failed')
  return { id: data.id, email: data.email, unsubscribed: data.unsubscribed }
}

export async function unsubscribeMarketingContact(id: string): Promise<void> {
  const data = await marketingApi(contactPath(id), {
    method: 'PATCH', body: { unsubscribed: true }
  })
  if (data.id !== id) throw new Error('marketing_unsubscribe_persist_failed')
  const contact = await getMarketingContact(id)
  if (!contact.unsubscribed) throw new Error('marketing_unsubscribe_not_persisted')
}
