'use client'

import { useRef, useState } from 'react'
import { Ruler } from 'lucide-react'
import type { ProductSizeGuideContent } from '@/lib/products/getProductSizeGuideContent'
import { Button } from './button'

type Props = {
  content: ProductSizeGuideContent
  triggerClassName?: string
  trackingData: Record<string, string>
}
type DialogComponent = typeof import('./SizeGuideDialogContent').default

export function OsCaravanSizeGuideDialog({ content, triggerClassName, trackingData }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [DialogContent, setDialogContent] = useState<DialogComponent | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  async function openGuide() {
    if (loading) return
    if (DialogContent) { setOpen(true); return }
    setLoading(true)
    setFailed(false)
    try {
      const dialogModule = await import('./SizeGuideDialogContent')
      setDialogContent(() => dialogModule.default)
      setOpen(true)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type='button'
        size='lg'
        variant='commerce-primary'
        aria-haspopup='dialog'
        aria-expanded={open}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={openGuide}
        data-track='OsCaravanSizeGuideOpen'
        data-track-data={JSON.stringify(trackingData)}
        className={triggerClassName}
      >
        <span className='truncate'>Størrelsesguide</span>
        <Ruler className='size-4.5' aria-hidden />
      </Button>
      <span role='status' className={failed ? undefined : 'sr-only'}>
        {loading ? 'Laster størrelsesguide …' : failed ? 'Kunne ikke laste størrelsesguiden. Trykk igjen for å prøve på nytt.' : ''}
      </span>
      {DialogContent && <DialogContent content={content} open={open} onOpenChange={setOpen} triggerRef={triggerRef} />}
    </>
  )
}
