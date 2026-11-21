import assert from 'node:assert/strict'
import test from 'node:test'

import {
  META_EDGE_CLIENT_IP_URL,
  META_SAME_ORIGIN_CLIENT_IP_URL,
  fetchMetaClientIp,
  normalizeMetaClientIp,
  resetMetaEdgeClientIpForTests
} from '../src/lib/analytics/fetchMetaClientIp'

type Call = { input: string; init: RequestInit }

function sender(responses: Record<string, () => Response | Promise<Response>>) {
  const calls: Call[] = []
  const send = async (input: string, init: RequestInit) => {
    calls.push({ input, init })
    const respond = responses[input]
    if (!respond) throw new TypeError('Failed to fetch')
    return respond()
  }
  return { calls, send }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status
  })

const granted = { marketing: 'granted' }

test('normalizes IPv4, IPv6 and IPv4-mapped IPv6 and rejects other shapes', () => {
  assert.equal(normalizeMetaClientIp(' 203.0.113.7 '), '203.0.113.7')
  assert.equal(normalizeMetaClientIp('2606:4700:4700:0:0:0:0:1111'), '2606:4700:4700::1111')
  assert.equal(normalizeMetaClientIp('2001:DB8::1'), '2001:db8::1')
  assert.equal(normalizeMetaClientIp('::ffff:198.51.100.4'), '198.51.100.4')
  for (const invalid of ['', '256.1.1.1', '[2001:db8::1]', 'fe80::1%en0', '2001:db8::1.AQYCAQMC', 'localhost', '1:2:3']) {
    assert.equal(normalizeMetaClientIp(invalid), '', invalid)
  }
})

test('uses the edge IPv6 echo with a CORS-simple, credential-free request', async () => {
  resetMetaEdgeClientIpForTests()
  const { calls, send } = sender({
    [META_EDGE_CLIENT_IP_URL]: () => json({ client_ip_address: '2606:4700:4700::1111' })
  })

  assert.equal(await fetchMetaClientIp(granted, send), '2606:4700:4700::1111')
  assert.equal(calls.length, 1)
  const { init } = calls[0]!
  assert.equal(init.method, 'POST')
  assert.equal(init.body, undefined)
  assert.equal(init.headers, undefined)
  assert.equal(init.credentials, 'omit')
  assert.equal(init.referrerPolicy, 'no-referrer')
  assert.equal(init.redirect, 'error')
})

test('falls back once to the same-origin lookup and then skips the edge', async () => {
  for (const edge of [
    () => { throw new TypeError('Failed to fetch') },
    () => json({ client_ip_address: 'not-an-ip' }),
    () => json({ client_ip_address: '203.0.113.7', extra: true }),
    () => json({ error: 'forbidden' }, 403),
    () => new Response(null, { status: 204 })
  ]) {
    resetMetaEdgeClientIpForTests()
    const { calls, send } = sender({
      [META_EDGE_CLIENT_IP_URL]: edge,
      [META_SAME_ORIGIN_CLIENT_IP_URL]: () => json({ client_ip_address: '192.0.2.1' })
    })

    assert.equal(await fetchMetaClientIp(granted, send), '192.0.2.1')
    assert.deepEqual(calls.map(call => call.input), [META_EDGE_CLIENT_IP_URL, META_SAME_ORIGIN_CLIENT_IP_URL])
    assert.equal(calls[1]!.init.credentials, 'same-origin')
    assert.equal(calls[1]!.init.body, JSON.stringify({ consent: granted }))

    assert.equal(await fetchMetaClientIp(granted, send), '192.0.2.1')
    assert.deepEqual(calls.slice(2).map(call => call.input), [META_SAME_ORIGIN_CLIENT_IP_URL])
  }
})

test('returns empty when both sources fail', async () => {
  resetMetaEdgeClientIpForTests()
  const { send } = sender({})
  assert.equal(await fetchMetaClientIp(granted, send), '')
})

test('makes no request without marketing consent', async () => {
  resetMetaEdgeClientIpForTests()
  const { calls, send } = sender({
    [META_EDGE_CLIENT_IP_URL]: () => json({ client_ip_address: '2606:4700:4700::1111' })
  })
  for (const marketing of ['denied', undefined]) {
    assert.equal(await fetchMetaClientIp({ marketing }, send), '')
  }
  assert.equal(calls.length, 0)
})

test('the edge URL is a direct dual-stack host, never utekos.no or /__sgtm', () => {
  const url = new URL(META_EDGE_CLIENT_IP_URL)
  assert.equal(url.origin, 'https://edge.utekos.no')
  assert.doesNotMatch(url.pathname, /sgtm|meta|fb|ip|pixel|track|collect/i)
})
