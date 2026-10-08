import { proxyServerGtmRequest } from '@/lib/analytics/serverGtmGateway/proxyServerGtmRequest'
import { isTrackingOrigin, productionTrackingEnabled } from '@/lib/tracking/environment'

async function gateway(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  if (!productionTrackingEnabled() || !isTrackingOrigin(request.url)) {
    return new Response(null, {
      status: 404,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    })
  }
  return proxyServerGtmRequest(request, context)
}

export const GET = gateway
export const HEAD = gateway
export const POST = gateway
export const OPTIONS = gateway
