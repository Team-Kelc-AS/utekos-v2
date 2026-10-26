import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import shell from '@/lib/google-customer-reviews/shell.generated.json';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
};

const surveySchema = z.object({
  merchant_id: z.literal(5806691920),
  order_id: z.string().regex(/^[1-9][0-9]{0,24}$/),
  email: z.email(),
  delivery_country: z.literal('NO'),
  estimated_delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  opt_in_style: z.literal('CENTER_DIALOG'),
  products: z.array(z.object({ gtin: z.string().regex(/^\d{8,14}$/) })).max(100).optional(),
}).strict();

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'review_unavailable' }, { status: 403, headers: privateHeaders });
  }
  const token = await request.text();
  if (!/^[A-Za-z0-9_-]{80,2048}$/.test(token)) {
    return Response.json({ error: 'review_unavailable' }, { status: 403, headers: privateHeaders });
  }
  try {
    const response = await fetch('https://utekos-shopify-platform-app.vercel.app/api/customer-reviews/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: token,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
    });
    if (!response.ok) {
      return Response.json({ error: 'review_unavailable' }, {
        status: response.status === 503 ? 503 : 403, headers: privateHeaders,
      });
    }
    const payload = surveySchema.safeParse(await response.json());
    if (!payload.success) throw new Error('Invalid Customer Reviews payload');
    return Response.json(payload.data, { headers: privateHeaders });
  } catch {
    console.error('Customer Reviews order verification unavailable');
    return Response.json({ error: 'review_unavailable' }, { status: 503, headers: privateHeaders });
  }
}

// This standalone confirmation page deliberately has no storefront analytics.
// The encrypted access ticket lives in the fragment, never in a request URL.
export function GET(): Response {
  const nonce = randomBytes(18).toString('base64');
  const views = JSON.stringify(shell.views).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>Google Kundeanmeldelser | Utekos</title>
<style nonce="${nonce}">${shell.css}</style></head><body class="google-review-page">
<main class="review-frame">
<a href="/" aria-label="Utekos – til forsiden"><img class="review-wordmark" src="/assets/logo/wordmark-corporate.svg" alt="Utekos" width="461" height="112"></a>
<div id="review-content">${shell.views.loading}</div>
<noscript>Slå på JavaScript for å åpne Googles valg.</noscript></main>
<script nonce="${nonce}">
(() => {
  const ticket = location.hash.slice(1);
  history.replaceState(null, '', location.pathname);
  const views = ${views};
  const content = document.getElementById('review-content');
  function setView(view) {
    content.innerHTML = views[view];
    document.getElementById('retry')?.addEventListener('click', showChoice);
  }
  if (!/^[A-Za-z0-9_-]{80,2048}$/.test(ticket)) { setView('unavailable'); return; }
  let payload;
  let platform;
  let busy = false;
  function loadGoogle() {
    if (!platform) {
      platform = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { platform = undefined; reject(new Error('Google timeout')); }, 15000);
        window.___gcfg = {lang:'no'};
        window.renderUtekosReviewOptIn = () => { clearTimeout(timeout); resolve(); };
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/platform.js?onload=renderUtekosReviewOptIn';
        script.async = true; script.nonce = ${JSON.stringify(nonce)};
        script.onerror = () => { clearTimeout(timeout); platform = undefined; script.remove(); reject(new Error('Google unavailable')); };
        document.body.append(script);
      });
    }
    return platform;
  }
  async function showChoice() {
    if (busy) return;
    busy = true;
    setView('loading');
    try {
      if (!payload) {
        const response = await fetch(location.pathname, {method:'POST',headers:{'Content-Type':'text/plain'},body:ticket,cache:'no-store'});
        if (!response.ok) { setView(response.status === 503 ? 'error' : 'unavailable'); return; }
        payload = await response.json();
      }
      await loadGoogle();
      await new Promise((resolve, reject) => {
        window.gapi.load('surveyoptin', {callback:resolve, timeout:15000, ontimeout:reject});
      });
      setView('ready');
      window.gapi.surveyoptin.render(payload);
    } catch {
      setView('error');
    } finally {
      busy = false;
    }
  }
  showChoice();
})();
</script></body></html>`;
  return new Response(html, { headers: {
    ...privateHeaders,
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://www.gstatic.com; style-src 'unsafe-inline'; img-src 'self' https://*.google.com https://*.gstatic.com data:; font-src 'self'; connect-src 'self' https://*.google.com https://*.googleapis.com https://*.gstatic.com; frame-src https://*.google.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  } });
}
