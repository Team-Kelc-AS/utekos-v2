import { notFound } from 'next/navigation'
import { previewTrackingEnabled } from '@/lib/tracking/environment'
import TrackingQaClient from './TrackingQaClient'

export default function TrackingQaPage() {
  if (!previewTrackingEnabled()) notFound()
  return <TrackingQaClient />
}
