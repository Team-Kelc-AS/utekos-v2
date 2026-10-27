import {
  marketingUnsubscribeGet,
  marketingUnsubscribePost
} from '@/lib/email/marketing/marketingUnsubscribeHandler'

export const runtime = 'nodejs'

export function GET(request: Request) {
  return marketingUnsubscribeGet(request)
}

export function POST(request: Request) {
  return marketingUnsubscribePost(request)
}
