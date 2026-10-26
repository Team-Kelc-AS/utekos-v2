import { randomBytes } from 'node:crypto';
import { z } from 'zod';

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
  const html = `<!DOCTYPE html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>Google Kundeanmeldelser | Utekos</title>
<style nonce="${nonce}">
@font-face{font-family:Google Sans Flex;src:url('/fonts/google-sans-flex-120pt-latin.woff2') format('woff2');font-weight:100 1000;font-display:swap}
*{box-sizing:border-box}body{margin:0;background:#f0eee9;color:#001a18;font-family:Google Sans Flex,sans-serif;font-weight:500;line-height:1.6}
header{background:#f0eee9;border-bottom:1px solid #001a1826;padding:24px max(24px,calc((100vw - 1000px)/2))}header img{display:block;width:140px;height:auto}
main{max-width:680px;padding:clamp(40px,10vh,110px) 24px;margin:auto}.eyebrow{color:#b44701;font-size:14px;letter-spacing:.08em}
h1{font-size:clamp(30px,5vw,44px);font-weight:800;line-height:1.15;margin:16px 0 24px}p{font-size:18px}small{display:block;margin-top:28px;color:#34524d}
a{color:#001a18;text-underline-offset:4px}button{font:inherit;border:1px solid #001a18;border-radius:8px;padding:12px 20px;background:transparent;color:#001a18;cursor:pointer}
button:focus-visible,a:focus-visible{outline:3px solid #b44701;outline-offset:4px}[hidden]{display:none!important}
</style></head><body>
<header><a href="/" aria-label="Utekos – til forsiden"><img src="/assets/logo/wordmark-corporate.svg" alt="Utekos" width="140" height="40"></a></header>
<main><span class="eyebrow">Etter handelen</span><h1>Vil du dele handleopplevelsen din?</h1>
<p>Google spør om du ønsker en e-post med en kort undersøkelse etter forventet levering.</p>
<p>Valget er frivillig. For å vise Googles valg bruker vi ordrenummer, e-postadresse, leveringsland og forventet leveringsdato fra bestillingen din.</p>
<p id="status" role="status">Bekrefter bestillingen …</p><button id="retry" hidden>Prøv igjen</button>
<small>Bestillingen din påvirkes ikke av valget. <a href="/personvern">Les om personvern</a> eller <a href="/">gå tilbake til Utekos</a>.</small>
<noscript><p>Du må tillate JavaScript for å se Googles valg. Dette påvirker ikke bestillingen din.</p></noscript></main>
<script nonce="${nonce}">
(() => {
  const ticket = location.hash.slice(1);
  history.replaceState(null, '', location.pathname);
  const status = document.getElementById('status');
  const retry = document.getElementById('retry');
  function unavailable() {
    status.textContent = 'Lenken er utløpt eller bestillingen kan ikke bekreftes. Åpne valget på nytt fra takkesiden. Dette påvirker ikke bestillingen din.';
    retry.hidden = true;
  }
  if (!/^[A-Za-z0-9_-]{80,2048}$/.test(ticket)) { unavailable(); return; }
  let payload;
  let platform;
  function loadGoogle() {
    if (!platform) {
      platform = new Promise((resolve, reject) => {
        window.renderUtekosReviewOptIn = () => resolve();
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/platform.js?onload=renderUtekosReviewOptIn';
        script.async = true; script.nonce = ${JSON.stringify(nonce)};
        script.onerror = () => { platform = undefined; script.remove(); reject(new Error('Google unavailable')); };
        document.body.append(script);
      });
    }
    return platform;
  }
  async function showChoice() {
    retry.hidden = true;
    status.textContent = 'Åpner Googles valg …';
    try {
      if (!payload) {
        const response = await fetch(location.pathname, {method:'POST',headers:{'Content-Type':'text/plain'},body:ticket,cache:'no-store'});
        if (!response.ok) { unavailable(); return; }
        payload = await response.json();
      }
      await loadGoogle();
      window.gapi.load('surveyoptin', {callback:() => {
        window.gapi.surveyoptin.render(payload);
        status.textContent = 'Velg om du vil delta i dialogboksen fra Google. Du kan lukke denne siden når du er ferdig.';
      }, timeout:15000, ontimeout:() => { status.textContent = 'Google brukte for lang tid. Du kan prøve igjen.'; retry.hidden = false; }});
    } catch {
      status.textContent = 'Vi kunne ikke åpne Google akkurat nå. Du kan prøve igjen.';
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', showChoice);
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
