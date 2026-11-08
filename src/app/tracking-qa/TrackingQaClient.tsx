'use client'

import { useState } from 'react'
import { createBrowserEvent, dispatchEvent, browserTrackingEnabled } from '@/lib/tracking/runtime'

const syntheticItem = {
  item_id: 'qa-fixture-item', product_id: 'qa-fixture-product',
  variant_id: 'qa-fixture-variant', item_name: 'Synthetic QA fixture',
  product_handle: 'qa-fixture', quantity: 1, unit_price: 0,
  gross_unit_price: 0, tax_amount: 0, tax_rate: 0,
  taxable: false, price_includes_tax: true, available_for_sale: true,
  currently_not_in_stock: false, quantity_available: null,
  selected_options: [], collection_ids: [], collection_titles: []
}

export default function TrackingQaClient() {
  const [result, setResult] = useState('No synthetic checkout event sent.')
  const [busy, setBusy] = useState(false)

  async function run() {
    if (!browserTrackingEnabled()) {
      setResult('QA tracking is not active on this browser/origin.')
      return
    }
    setBusy(true)
    try {
      // The canonical checkout event is synthetic: no Shopify order/payment.
      const event = createBrowserEvent('begin_checkout', {
        currency: 'NOK', value: 0, gross_value: 0, tax_value: 0,
        cart_id: 'qa-cart', checkout_id: 'qa-checkout',
        creation_revision: 'qa-fixture-v1', items: [syntheticItem]
      }, { checkout_method: 'shopify_checkout' })
      const prepared = await dispatchEvent(event)
      setResult([
        'Synthetic canonical event prepared; server receipt must be checked separately.',
        'event_id: ' + prepared.event_id,
        'page_view_id: ' + (prepared.page_view_id ?? 'not attached'),
        'fbc: ' + (prepared.browser_id?.fbc ? 'present' : 'absent'),
        'fbp: ' + (prepared.browser_id?.fbp ? 'present' : 'absent'),
        'environment: ' + prepared.environment,
        'No purchase was attempted.'
      ].join('\n'))
    } catch (error) {
      setResult('QA event failed: ' + (error instanceof Error ? error.message : 'unknown error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">Utekos tracking QA</h1>
      <p className="mt-4">Isolated preview test. Open this page with a synthetic
        fbclid parameter in a clean browser profile to inspect the first
        PageView. This page never initiates a real checkout or sends Meta events.</p>
      <p className="mt-4">To test checkout identity continuity, click once below.
        The event is saved in the isolated Supabase QA ledger only.</p>
      <button className="mt-6 rounded bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-40"
        type="button" disabled={busy} onClick={() => void run()}>
        {busy ? 'Testing…' : 'Send synthetic InitiateCheckout'}
      </button>
      <pre className="mt-6 whitespace-pre-wrap rounded bg-neutral-900 p-4 text-sm text-white"
        role="status">{result}</pre>
      <p className="mt-4 text-sm">This is not proof of server acceptance.
        Verify the event_id in marketing.event_ledger and
        ops.provider_dispatch_attempts in Supabase Preview.</p>
    </main>
  )
}
