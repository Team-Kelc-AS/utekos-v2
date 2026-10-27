import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createMarketingUnsubscribeToken,
  createMarketingUnsubscribeUrl,
  verifyMarketingUnsubscribeToken
} from '../../../../src/lib/email/marketing/marketingUnsubscribeToken'
import {
  marketingUnsubscribeGet,
  marketingUnsubscribePost
} from '../../../../src/lib/email/marketing/marketingUnsubscribeHandler'
import { sendMarketingEmail } from '../../../../src/lib/email/marketing/sendMarketingEmail'

const secret = 'test-only-secret-not-for-production-1234567890'
const id = '11111111-1111-4111-8111-111111111111'
const secondId = '22222222-2222-4222-8222-222222222222'
const token = createMarketingUnsubscribeToken(id, secret)
const url = createMarketingUnsubscribeUrl(id, {
  secret,
  baseUrl: 'https://utekos.no'
})
const verifyToken = (value: string) =>
  verifyMarketingUnsubscribeToken(value, secret)
const post = (
  body = 'List-Unsubscribe=One-Click',
  target = url
) =>
  new Request(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })
const input = {
  contactId: id,
  expectedEmail: 'test@example.com',
  from: 'Utekos <kundeservice@utekos.no>',
  subject: 'Test',
  html: '<p>Innhold</p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Meld deg av</a>',
  text: 'Innhold\nMeld deg av {{{RESEND_UNSUBSCRIBE_URL}}}',
  idempotencyKey: 'test-campaign/test-recipient'
}

test('tokens bind the exact recipient and purpose, and survive retries', () => {
  assert.equal(verifyToken(token), id)
  assert.equal(
    createMarketingUnsubscribeToken(id, secret),
    token
  )
  for (const invalid of [
    token.replace(id, secondId),
    token + '.extra',
    token.replace('m1.', 'u1.'),
    token.slice(0, -1),
    token + 'x',
    token.replace(/.$/, '!')
  ]) {
    assert.throws(() => verifyToken(invalid))
  }
  assert.throws(() =>
    verifyMarketingUnsubscribeToken(
      token,
      'another-secret-at-least-thirty-two-bytes'
    )
  )
  assert.throws(() =>
    createMarketingUnsubscribeToken(id, 'short')
  )
  assert.throws(() =>
    createMarketingUnsubscribeToken('test@example.com', secret)
  )
  assert.throws(() =>
    createMarketingUnsubscribeUrl(id, {
      secret,
      baseUrl: 'http://utekos.no'
    })
  )
  assert.throws(() =>
    createMarketingUnsubscribeUrl(id, {
      secret,
      baseUrl: 'https://user:pass@utekos.no'
    })
  )
  assert.equal(
    new URL(url).pathname,
    '/api/email/marketing/unsubscribe'
  )
  assert.ok(!url.includes('example.com'))
})

test('GET renders confirmation without changing subscription state', async () => {
  let mutations = 0
  const response = await marketingUnsubscribeGet(
    new Request(url),
    {
      verifyToken,
      unsubscribe: async () => {
        mutations++
      }
    }
  )
  assert.equal(response.status, 200)
  assert.match(await response.text(), /method="post"/)
  assert.equal(mutations, 0)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.equal(
    response.headers.get('Referrer-Policy'),
    'no-referrer'
  )
})

test('forged and duplicate tokens never reach the persistence layer', async () => {
  let mutations = 0
  const dependencies = {
    verifyToken,
    unsubscribe: async () => {
      mutations++
    }
  }
  for (const target of [
    url.replace(id, secondId),
    url + '&token=' + token,
    'https://utekos.no/api/email/marketing/unsubscribe'
  ]) {
    assert.equal(
      (
        await marketingUnsubscribeGet(
          new Request(target),
          dependencies
        )
      ).status,
      400
    )
    assert.equal(
      (
        await marketingUnsubscribePost(
          post(undefined, target),
          dependencies
        )
      ).status,
      400
    )
  }
  assert.equal(mutations, 0)
})

test('one-click POST does not need cookies or login and acknowledges only after persistence', async () => {
  const calls: string[] = []
  const response = await marketingUnsubscribePost(post(), {
    verifyToken,
    unsubscribe: async recipient => {
      calls.push(recipient)
    }
  })
  assert.equal(response.status, 200)
  assert.equal(await response.text(), '')
  assert.deepEqual(calls, [id])
})

test('multipart one-click bodies are supported', async () => {
  const form = new FormData()
  form.set('List-Unsubscribe', 'One-Click')
  const response = await marketingUnsubscribePost(
    new Request(url, { method: 'POST', body: form }),
    { verifyToken, unsubscribe: async () => {} }
  )
  assert.equal(response.status, 200)
  assert.equal(await response.text(), '')
})

test('manual confirmation shows success; provider failure remains retryable', async () => {
  const success = await marketingUnsubscribePost(
    post('confirm=yes'),
    { verifyToken, unsubscribe: async () => {} }
  )
  assert.equal(success.status, 200)
  assert.match(await success.text(), /Du er meldt av/)
  const failure = await marketingUnsubscribePost(post(), {
    verifyToken,
    unsubscribe: async () => {
      throw new Error(
        'provider failure containing private information'
      )
    }
  })
  assert.equal(failure.status, 503)
  assert.ok(
    !(await failure.text()).includes('private information')
  )
})

test('invalid and oversized POST bodies do not mutate contacts', async () => {
  let mutations = 0
  const dependencies = {
    verifyToken,
    unsubscribe: async () => {
      mutations++
    }
  }
  assert.equal(
    (await marketingUnsubscribePost(post(''), dependencies))
      .status,
    400
  )
  assert.equal(
    (
      await marketingUnsubscribePost(
        post('x'.repeat(8193)),
        dependencies
      )
    ).status,
    413
  )
  assert.equal(
    (
      await marketingUnsubscribePost(
        new Request(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        }),
        dependencies
      )
    ).status,
    415
  )
  assert.equal(mutations, 0)
})

test('delivery replaces both placeholders and uses the same URL in headers', async () => {
  let sent = 0
  const response = await sendMarketingEmail(input, {
    getContact: async () => ({
      id,
      email: input.expectedEmail,
      unsubscribed: false
    }),
    createUrl: () => url,
    send: async payload => {
      sent++
      assert.deepEqual(payload.headers, {
        'List-Unsubscribe': `<${url}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      })
      assert.ok('html' in payload)
      assert.match(payload.html, /Meld deg av/)
      assert.ok(payload.html.includes(url))
      assert.ok(payload.text.includes(url))
      assert.ok(!payload.html.includes('{{{'))
      assert.equal(payload.to, input.expectedEmail)
      assert.equal(payload.idempotencyKey, input.idempotencyKey)
      return { ok: true, id: 'test-send' }
    }
  })
  assert.equal(response.ok, true)
  assert.equal(sent, 1)
})

test('unsubscription prevents the next delivery and repeated requests remain safe', async () => {
  let unsubscribed = false
  let sends = 0
  const delivery = {
    getContact: async () => ({
      id,
      email: input.expectedEmail,
      unsubscribed
    }),
    createUrl: () => url,
    send: async () => {
      sends++
      return { ok: true as const, id: 'test-send' }
    }
  }
  await sendMarketingEmail(input, delivery)
  for (let i = 0; i < 2; i++) {
    assert.equal(
      (
        await marketingUnsubscribePost(post(), {
          verifyToken,
          unsubscribe: async () => {
            unsubscribed = true
          }
        })
      ).status,
      200
    )
  }
  assert.deepEqual(await sendMarketingEmail(input, delivery), {
    ok: false,
    reason: 'unsubscribed'
  })
  assert.equal(sends, 1)
})

test('lookup failures, changed recipients and unexpanded placeholders abort sending', async () => {
  let sends = 0
  const defaults = {
    getContact: async () => ({
      id,
      email: input.expectedEmail,
      unsubscribed: false
    }),
    createUrl: () => url,
    send: async () => {
      sends++
      return { ok: true as const, id: 'test-send' }
    }
  }
  await assert.rejects(
    sendMarketingEmail(input, {
      ...defaults,
      getContact: async () => {
        throw new Error('unavailable')
      }
    })
  )
  await assert.rejects(
    sendMarketingEmail(input, {
      ...defaults,
      getContact: async () => ({
        id,
        email: 'changed@example.com',
        unsubscribed: false
      })
    })
  )
  await assert.rejects(
    sendMarketingEmail(
      { ...input, html: 'missing link' },
      defaults
    )
  )
  await assert.rejects(
    sendMarketingEmail(
      { ...input, text: input.text + '{{{FIRST_NAME}}}' },
      defaults
    )
  )
  assert.equal(sends, 0)
})
