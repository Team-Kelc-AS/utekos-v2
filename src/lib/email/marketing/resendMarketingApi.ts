import 'server-only'

// Keep credentials on the server, using the existing production integration.
export async function marketingApi(
  path: string,
  options: { method?: string; body?: unknown; idempotencyKey?: string } = {}
): Promise<Record<string, unknown>> {
  const apiKey = process.env.RESEND_HEADLESS_API_KEY_RESEND_API_KEY || process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('marketing_api_not_configured')
  const response = await fetch(`https://api.resend.com${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {})
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    signal: AbortSignal.timeout(10000),
    cache: 'no-store'
  })
  if (!response.ok) throw new Error(`marketing_provider_http_${response.status}`)
  const data: unknown = await response.json()
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('marketing_provider_invalid_response')
  return data as Record<string, unknown>
}

export async function sendMarketingMessage(input: {
  from: string; to: string; subject: string; html: string; text: string;
  idempotencyKey: string; replyTo?: string; headers: Record<string, string>
}): Promise<{ ok: true; id: string }> {
  const { idempotencyKey, replyTo, ...body } = input
  const data = await marketingApi('/emails', {
    method: 'POST', idempotencyKey,
    body: { ...body, ...(replyTo ? { reply_to: replyTo } : {}) }
  })
  if (typeof data.id !== 'string' || !data.id)
    throw new Error('marketing_send_receipt_missing')
  return { ok: true, id: data.id }
}
