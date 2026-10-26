import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { comfyBuyNowVariants } from './comfyBuyNow';
import { privateHeaders } from './request';
import { captureProxyMetaCookies } from '@/lib/analytics/server/captureProxyMetaCookies';
import { applyProxyMetaCookies } from '@/lib/analytics/server/applyProxyMetaCookies';
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization';
import { resolveCampaignAttribution } from '@/lib/analytics/campaignAttributionSessionStore';
import { extractFbclidFromFbc } from '@/lib/analytics/extractFbclidFromFbc';
import {
  createCheckoutAttributionSnapshot,
  checkoutAttributionSnapshotToShopifyAttributes,
} from '@/lib/analytics/checkoutAttributionSnapshot';

const clickParameters = [
  'dclid', 'epik', 'fbclid', 'gbraid', 'gclid', 'msclkid',
  'sc_click_id', 'ttclid', 'twclid', 'wbraid',
] as const;
const browserCookies = {
  fbc: '_fbc', fbp: '_fbp', ga_cookie: '_ga',
  uet_session: '_uetsid', uet_visitor: '_uetvid', sc_cookie1: '_scid',
} as const;
const reservedParameters = new Set([
  'channel', 'discount', 'redirect', 'return_to', 'return_url',
  'checkout_url', 'storefront', 'storefront_id', 'access_token', 'key',
]);

function isCheckoutControl(key: string) {
  return reservedParameters.has(key.toLowerCase()) || /^(?:attributes|properties|checkout)(?:\[|$)/i.test(key);
}

function oversizedLink() {
  console.warn('comfy_checkout_redirect_rejected', { reason: 'link_too_large' });
  return new NextResponse('Lenken er for lang.', { status: 414, headers: privateHeaders });
}

// Shopify accepts attributes on cart permalinks. Keep this handoff synchronous:
// no rendered intermediate page, hydration, or Storefront API round trips.
export function GET(request: NextRequest) {
  const match = /^\/(?:comfy(?:robe)?-(xs|xl)|kjop\/comfyrobe\/(xs|xl))\/?$/.exec(request.nextUrl.pathname);
  const size = match?.[1] ?? match?.[2];
  if (size !== 'xs' && size !== 'xl') {
    return new NextResponse('Ugyldig produktvariant.', { status: 404, headers: privateHeaders });
  }
  if (request.url.length > 8000 || [
    ...request.nextUrl.searchParams.values(),
    ...Object.values(browserCookies).map(name => request.cookies.get(name)?.value ?? ''),
  ].some(value => value.length > 3000)) {
    return oversizedLink();
  }

  const cookies = captureProxyMetaCookies(request);
  const fbc = request.cookies.get('_fbc')?.value;
  const fbclid = request.nextUrl.searchParams.get('fbclid') || undefined;
  const clickIds = Object.fromEntries(clickParameters.flatMap(key => {
    const value = request.nextUrl.searchParams.get(key);
    return value ? [[key, value]] : [];
  }));
  const snapchatClickId = request.nextUrl.searchParams.get('ScCid');
  if (snapchatClickId) clickIds.sc_click_id = snapchatClickId;
  const backupMicrosoftClick = request.nextUrl.searchParams.get('backup_msclkid');
  if (!clickIds.msclkid && backupMicrosoftClick && /^[a-fA-F0-9]{32}$/.test(backupMicrosoftClick.replace(/-/g, ''))) {
    clickIds.msclkid = backupMicrosoftClick;
  }
  const snapshot = createCheckoutAttributionSnapshot({
    consent: resolveTrackingAuthorization(),
    browser_id: Object.fromEntries(Object.entries(browserCookies).flatMap(([field, name]) => {
      const value = request.cookies.get(name)?.value;
      return value ? [[field, value]] : [];
    })),
    click_id: clickIds,
    campaign: resolveCampaignAttribution(request.url),
    page_url: request.url,
  });
  const variant = comfyBuyNowVariants[size].split('/').at(-1);
  const checkout = new URL(`https://kasse.utekos.no/cart/${variant}:1`);
  checkout.searchParams.set('channel', 'buy_button');
  checkout.searchParams.set('discount', 'COMFYFRI');
  // Preserve marketing parameters, including repeated values. Checkout controls
  // and order attributes come only from this server's verified handoff.
  for (const [key, value] of request.nextUrl.searchParams) {
    if (!isCheckoutControl(key)) checkout.searchParams.append(key, value);
    if (/^utm_[a-z0-9_]+$/i.test(key) || key === 'ref') {
      checkout.searchParams.set(`attributes[${key}]`, value);
    }
  }
  for (const { key, value } of checkoutAttributionSnapshotToShopifyAttributes(snapshot)) {
    checkout.searchParams.set(`attributes[${key}]`, value);
  }
  checkout.searchParams.set('attributes[utekos_checkout_method]', 'shopify_checkout');
  checkout.searchParams.set('attributes[utekos_checkout_flow]', 'comfyrobe_permalink');
  if (checkout.href.length > 8000) return oversizedLink();
  const response = NextResponse.redirect(checkout, 307);
  response.headers.set('Cache-Control', privateHeaders['Cache-Control']);
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'origin');
  response.headers.set('X-Robots-Tag', 'noindex');
  console.info('comfy_checkout_redirect', {
    size,
    status: response.status,
    has_fbclid: Boolean(fbclid),
    ...(fbclid ? { click_fingerprint: createHash('sha256').update(fbclid).digest('hex').slice(0, 16) } : {}),
    has_fbc: checkout.searchParams.has('attributes[_fbc]'),
    has_fbp: checkout.searchParams.has('attributes[_fbp]'),
    fbc_matches_click: Boolean(fbclid) && extractFbclidFromFbc(fbc) === fbclid,
    has_ad_id: checkout.searchParams.has('attributes[utekos_ad_id]'),
    has_campaign_id: checkout.searchParams.has('attributes[utekos_campaign_id]'),
  });
  return applyProxyMetaCookies(response, request, cookies);
}
