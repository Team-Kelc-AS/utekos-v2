import 'server-only'

/* eslint-disable @next/next/no-before-interactive-script-outside-document -- Rendered only by the App Router root layout. Next's App Router supports beforeInteractive there. */

import Script from 'next/script'
import { productionTrackingEnabled } from './environment'
import { GOOGLE_TAG_MANAGER_BOOTSTRAP } from './googleTagManagerBootstrap'
import { STAPE_CUSTOM_LOADER } from './stapeCustomLoader'

// A production artifact can also be opened through a preview/deployment alias.
// Guard the untouched, generated loader before it can use its absolute URLs.
const PRODUCTION_ORIGIN_GUARD =
  "window.location.origin==='https://utekos.no'||window.location.origin==='https://www.utekos.no'"

export function StapeScripts() {
  if (!productionTrackingEnabled()) return null

  return (
    <>
      <Script
        id="_next-gtm-consent-defaults"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: `if(${PRODUCTION_ORIGIN_GUARD}){${GOOGLE_TAG_MANAGER_BOOTSTRAP}}` }}
      />
      <Script
        id="_next-stape-custom-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: `if(${PRODUCTION_ORIGIN_GUARD}){${STAPE_CUSTOM_LOADER}}` }}
      />
    </>
  )
}
