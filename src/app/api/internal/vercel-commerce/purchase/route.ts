import { track } from '@vercel/analytics/server'
import { verifyVercelOidcToken } from '@vercel/oidc'
import { z } from 'zod'
import { isTrackingOrigin, productionTrackingEnabled } from '@/lib/tracking/environment'

const AUDIENCE = 'https://utekos.no/api/internal/vercel-commerce/purchase'
const SOURCE_PROJECT_ID = 'prj_EHFI28tMUlIQsNguxjcKHPlLAlFE'
const SOURCE_OWNER_ID = 'team_0B8gWWIxT2hGVIJnK8CwanAi'
const MAX_BODY_BYTES = 512

const purchaseProjectionSchema = z.strictObject({
  event_id: z.uuid(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  value: z.number().finite().nonnegative()
})

function response(status: number, error: string) {
  return Response.json({ error }, {
    status,
    headers: { 'Cache-Control': 'private, no-store' }
  })
}

export async function POST(request: Request): Promise<Response> {
  if (!productionTrackingEnabled() || !isTrackingOrigin(request.url)) {
    return response(403, 'tracking_environment_disabled')
  }

  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ') || authorization.length > 16384) {
    return response(401, 'unauthorized')
  }

  try {
    await verifyVercelOidcToken(authorization.slice(7), {
      audience: AUDIENCE,
      projectId: SOURCE_PROJECT_ID,
      ownerId: SOURCE_OWNER_ID,
      environment: 'production',
      algorithms: ['RS256'],
      requiredClaims: ['iss', 'aud', 'exp', 'iat', 'sub', 'project_id', 'owner_id', 'environment']
    })
  } catch {
    return response(401, 'unauthorized')
  }

  if (request.headers.get('content-type')?.split(';', 1)[0]?.trim() !== 'application/json') {
    return response(415, 'unsupported_media_type')
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    return response(413, 'payload_too_large')
  }

  const body = await request.text()
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return response(413, 'payload_too_large')
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return response(400, 'invalid_json')
  }
  const parsed = purchaseProjectionSchema.safeParse(payload)
  if (!parsed.success) return response(400, 'invalid_event')

  await track('purchase', {
    currency: parsed.data.currency,
    value: parsed.data.value
  }, {
    headers: { 'user-agent': 'Utekos paid-order projection' }
  })

  return Response.json({ event_id: parsed.data.event_id, status: 'submitted_unverified' }, {
    status: 202,
    headers: { 'Cache-Control': 'private, no-store' }
  })
}
