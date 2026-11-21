'use client'

import { metaClientIpResponseSchema } from './metaClientIpContract'

// Dual-stack first-party Stape host (A + AAAA). The response-only sGTM client
// on this exact path echoes the connecting address. Never route this lookup
// through utekos.no or /__sgtm: Vercel is IPv4-only, so a proxied lookup can
// never observe the visitor's IPv6 and Meta flags the CAPI/Pixel mismatch.
export const META_EDGE_CLIENT_IP_URL =
  'https://edge.utekos.no/MeS07gRdh1IMJ8Mtg0'
export const META_SAME_ORIGIN_CLIENT_IP_URL = '/api/meta/client-ip'
export const META_EDGE_CLIENT_IP_TIMEOUT_MS = 1200
export const META_SAME_ORIGIN_CLIENT_IP_TIMEOUT_MS = 2500

const IPV4_OCTET = '(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)'
const IPV4 = new RegExp(`^${IPV4_OCTET}(\\.${IPV4_OCTET}){3}$`)
const IPV4_MAPPED_IPV6 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/

type Send = (input: string, init: RequestInit) => Promise<Response>

let edgeUnavailable = false

/** Returns a canonical bare IPv4/IPv6 address, or '' for any other shape. */
export function normalizeMetaClientIp(value: string): string {
  const candidate = value.trim().toLowerCase()
  const mapped = IPV4_MAPPED_IPV6.exec(candidate)?.[1]
  if (mapped) return IPV4.test(mapped) ? mapped : ''
  if (IPV4.test(candidate)) return candidate
  if (!candidate.includes(':') || !/^[0-9a-f:.]+$/.test(candidate)) return ''
  try {
    const hostname = new URL(`http://[${candidate}]/`).hostname
    const canonical = hostname.slice(1, -1)
    const remapped = IPV4_MAPPED_IPV6.exec(canonical)?.[1]
    return remapped ?? canonical
  } catch {
    return ''
  }
}

async function readClientIp(response: Response) {
  if (!response.ok) return ''
  const parsed = metaClientIpResponseSchema.safeParse(await response.json())
  return parsed.success ? normalizeMetaClientIp(parsed.data.client_ip_address) : ''
}

async function fetchEdgeClientIp(send: Send) {
  if (edgeUnavailable) return ''
  try {
    // CORS-simple request: POST without body or custom headers, so there is no
    // preflight. No credentials: the edge must never set or read cookies, so
    // Stape Cookie Keeper cannot touch _fbc/_fbp.
    const ip = await readClientIp(
      await send(META_EDGE_CLIENT_IP_URL, {
        cache: 'no-store',
        credentials: 'omit',
        method: 'POST',
        mode: 'cors',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(META_EDGE_CLIENT_IP_TIMEOUT_MS)
      })
    )
    if (!ip) edgeUnavailable = true
    return ip
  } catch {
    edgeUnavailable = true
    return ''
  }
}

async function fetchSameOriginClientIp(send: Send, consent: unknown) {
  try {
    return await readClientIp(
      await send(META_SAME_ORIGIN_CLIENT_IP_URL, {
        body: JSON.stringify({ consent }),
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        keepalive: true,
        method: 'POST',
        signal: AbortSignal.timeout(META_SAME_ORIGIN_CLIENT_IP_TIMEOUT_MS)
      })
    )
  } catch {
    return ''
  }
}

/**
 * Consent-gated getIpFn source for the Meta Parameter Builder. Prefers the
 * dual-stack edge echo (observes IPv6) and falls back to the IPv4-only
 * same-origin lookup. Returns '' when nothing usable is available.
 */
export async function fetchMetaClientIp(
  consent: { marketing?: string },
  send: Send = (input, init) => fetch(input, init)
): Promise<string> {
  if (consent.marketing !== 'granted') return ''
  return (
    (await fetchEdgeClientIp(send)) ||
    (await fetchSameOriginClientIp(send, consent))
  )
}

/** Test-only reset of the per-document edge failure flag. */
export function resetMetaEdgeClientIpForTests() {
  edgeUnavailable = false
}
