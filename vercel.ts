import type { VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  headers: [
    {
      source: '/__sgtm/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0'
        },
        {
          key: 'CDN-Cache-Control',
          value: 'no-store'
        },
        {
          key: 'Vercel-CDN-Cache-Control',
          value: 'no-store'
        }
      ]
    }
  ],
  regions: ['arn1']
}
