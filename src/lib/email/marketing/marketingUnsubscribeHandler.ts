import 'server-only'

import { unsubscribeMarketingContact } from './marketingContact'
import {
  MARKETING_UNSUBSCRIBE_PATH,
  verifyMarketingUnsubscribeToken
} from './marketingUnsubscribeToken'

type Dependencies = {
  verifyToken: (token: string) => string
  unsubscribe: (id: string) => Promise<void>
}
const defaults: Dependencies = {
  verifyToken: verifyMarketingUnsubscribeToken,
  unsubscribe: unsubscribeMarketingContact
}
const headers = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy':
    'default-src \'none\'; style-src \'unsafe-inline\'; form-action \'self\'; base-uri \'none\'; frame-ancestors \'none\''
}

function page(
  title: string,
  content: string,
  status = 200
): Response {
  return new Response(
    `<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – Utekos</title><style>html{font-size:100%;color-scheme:dark}body{margin:0;padding:2rem 1rem;background:#262934;color:#f0eee9;font:1rem/1.55 Arial,sans-serif}main{max-width:32rem;margin:3rem auto}h1{font-size:1.75rem;line-height:1.25}button{font:inherit;color:#262934;background:#f0eee9;border:0;border-radius:.5rem;padding:.8rem 1.2rem;cursor:pointer}button:focus-visible{outline:3px solid #f0eee9;outline-offset:4px}a{color:inherit}</style></head><body><main><h1>${title}</h1>${content}</main></body></html>`,
    {
      status,
      headers: {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8'
      }
    }
  )
}

function invalid(): Response {
  return page(
    'Lenken er ugyldig',
    '<p>Bruk avmeldingslenken i e-posten du mottok, eller kontakt <a href="mailto:kundeservice@utekos.no">kundeservice@utekos.no</a>.</p>',
    400
  )
}

function recipient(
  request: Request,
  dependencies: Dependencies
) {
  const tokens = new URL(request.url).searchParams.getAll(
    'token'
  )
  if (
    tokens.length !== 1 ||
    !tokens[0] ||
    tokens[0].length > 128
  )
    throw new Error('invalid_token')
  return {
    token: tokens[0],
    id: dependencies.verifyToken(tokens[0])
  }
}

export async function marketingUnsubscribeGet(
  request: Request,
  dependencies = defaults
): Promise<Response> {
  let token: string
  try {
    ;({ token } = recipient(request, dependencies))
  } catch {
    return invalid()
  }
  // GET is read-only: email scanners and link previews cannot unsubscribe anyone.
  const action = `${MARKETING_UNSUBSCRIBE_PATH}?token=${encodeURIComponent(token)}`
  return page(
    'Meld deg av',
    `<p>Vil du slutte å motta nyhetsbrev og tilbud fra Utekos? Ordre- og leveringsinformasjon påvirkes ikke.</p><form method="post" action="${action}"><input type="hidden" name="confirm" value="yes"><button type="submit">Meld meg av</button></form>`
  )
}

export async function marketingUnsubscribePost(
  request: Request,
  dependencies = defaults
): Promise<Response> {
  let id: string
  try {
    ;({ id } = recipient(request, dependencies))
  } catch {
    return invalid()
  }
  const contentType = request.headers
    .get('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase()
  if (
    contentType !== 'application/x-www-form-urlencoded' &&
    contentType !== 'multipart/form-data'
  ) {
    return new Response(null, { status: 415, headers })
  }
  // Bound streamed input as well as Content-Length; never buffer arbitrary bodies.
  if (Number(request.headers.get('content-length')) > 8192)
    return new Response(null, { status: 413, headers })
  const reader = request.body?.getReader()
  if (!reader)
    return new Response(null, { status: 400, headers })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 8192) {
        await reader.cancel()
        return new Response(null, { status: 413, headers })
      }
      chunks.push(value)
    }
  } catch {
    return new Response(null, { status: 400, headers })
  }
  let form: FormData
  try {
    form = await new Response(Buffer.concat(chunks), {
      headers: {
        'Content-Type': request.headers.get('content-type')!
      }
    }).formData()
  } catch {
    return new Response(null, { status: 400, headers })
  }
  const oneClick = form.get('List-Unsubscribe') === 'One-Click'
  if (!oneClick && form.get('confirm') !== 'yes')
    return new Response(null, { status: 400, headers })
  try {
    await dependencies.unsubscribe(id)
  } catch {
    return page(
      'Prøv igjen',
      '<p>Vi kunne ikke registrere avmeldingen nå. Prøv igjen, eller kontakt <a href="mailto:kundeservice@utekos.no">kundeservice@utekos.no</a>.</p>',
      503
    )
  }
  return oneClick ?
      new Response(null, { status: 200, headers })
    : page(
        'Du er meldt av',
        '<p>Du vil ikke lenger motta nyhetsbrev og tilbud fra Utekos via denne kontaktlisten.</p>'
      )
}
