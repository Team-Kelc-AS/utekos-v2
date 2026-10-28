import 'server-only'

import { track } from '@vercel/analytics/server'
import { after } from 'next/server'

const commerceEvents = {
  '/api/events/add-to-cart': 'add_to_cart',
  '/api/events/begin-checkout': 'begin_checkout'
} as const

type CommerceOperation = keyof typeof commerceEvents

function isCommerceOperation(value: string): value is CommerceOperation {
  return Object.hasOwn(commerceEvents, value)
}

export function acceptedVercelCommerceEvent(
  operation: string,
  status: number,
  body: Uint8Array
): { name: 'add_to_cart' | 'begin_checkout'; data: { currency: string; value: number } } | null {
  if (status !== 202 || !isCommerceOperation(operation)) return null

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(body).toString('utf8'))
  } catch {
    return null
  }

  if (typeof payload !== 'object' || payload === null) return null
  const event = payload as Record<string, unknown>
  if (event.event_name !== commerceEvents[operation]) return null
  const consent = event.consent
  if (typeof consent !== 'object' || consent === null ||
      (consent as Record<string, unknown>).analytics !== 'granted') return null
  const customData = event.custom_data
  if (typeof customData !== 'object' || customData === null) return null
  const { currency, value } = customData as Record<string, unknown>
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency) ||
      typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null

  return { name: commerceEvents[operation], data: { currency, value } }
}

export function scheduleVercelCommerceEvent(
  operation: string,
  status: number,
  body: Uint8Array,
  request: Request,
  clientIpAddress?: string
): void {
  const event = acceptedVercelCommerceEvent(operation, status, body)
  if (!event) return

  try {
    after(async () => {
      try {
        // Only the two allowed commerce properties leave the canonical payload.
        await track(event.name, event.data, {
          headers: {
            'user-agent': request.headers.get('user-agent') ?? undefined,
            'x-forwarded-for': clientIpAddress
          }
        })
      } catch {
        console.error('vercel_commerce_event_projection_failed', { event: event.name })
      }
    })
  } catch {
    console.error('vercel_commerce_event_schedule_failed', { event: event.name })
  }
}
