# One-step Express checkout

Add one-step Express checkout to your website, configure your page for the Klarna pop-up, and create an order.

Add one-step Express checkout to your website to give customers the fastest, lowest-friction purchase journey.

Not sure if the one-step checkout is right for your online store? Refer to the platform and PSP support article to choose the best checkout experience for your customers.

Creating a one-step Express checkout involves three steps:

1.  Initialize and display Express checkout — load the library, configure your page, and render Express checkout.
2.  Handle the authorization response — read the `authorize()` response and the authorization callback.
3.  Create an order — use the `authorization_token` to create the order.

## Initialize and display Express checkout

Load the Klarna payments JavaScript library on the cart page or a product detail page. Include the library only once to prevent conflicts.

**HTML**

```html
<script defer
  src="https://x.klarnacdn.net/kp/lib/v1/api.js">
</script>
```

A sample script tag to load the Klarna payments library.

### Configure your page for Express checkout

If your site sets security headers, make sure they allow Klarna. These settings apply to every integration — whether you load Express checkout at the top level or inside an iframe.

Content-Security-Policy. Allow Klarna's hosts. These directives extend your existing policy — if you use a default-src policy, make sure these hosts also appear in the corresponding directives.

**MARKUP**

```text
script-src 'self' https://x.klarnacdn.net https://js.klarna.com;
style-src 'self' 'unsafe-inline' https://x.klarnacdn.net;
font-src https://x.klarnacdn.net;
connect-src 'self' https://_.klarna.com https://_.klarnaevt.com https://x.klarnacdn.net;
frame-src https://_.klarna.com https://x.klarnacdn.net;
img-src 'self' data: https://x.klarnacdn.net https://_.klarnaevt.com;
```

Why each of the less obvious entries is needed:

| Entry | What it allows |
| --- | --- |
| `'unsafe-inline' in style-src` | Klarna injects styles for the loading indicators, the overlay, and the scroll lock applied while the pop-up is open. The content varies per purchase, so it can't be covered by a static hash. This applies to styles only — Klarna doesn't require inline script. |
| `'unsafe-inline' in script-src` | Not required. Klarna's scripts load from the hosts above and don't need inline execution. If you use a nonce- or hash-based policy, apply your nonce to the Klarna script tag the same way you do for your own scripts — Klarna needs no exception. |
| `font-src and x.klarnacdn.net in style-src` | Klarna's own typeface, loaded through a stylesheet on the CDN. |
| `data: in img-src` | The Klarna logo on the Express checkout button is embedded directly in the stylesheet. |
| `https://_.klarnaevt.com in img-src` | A fallback used to deliver telemetry when the browser blocks the primary transport. Omitting it degrades silently. |
| `https://_.klarna.com in frame-src` | Covers js.klarna.com, which hosts the mechanism that returns the purchase result to your page if the pop-up connection is lost. Narrowing this to the payment host alone disables it. This recovery needs the page running the Klarna SDK integration to be the top-level document — see the iframe guidance below. |

#### Report-only mode testing

Run the policy in report-only mode first and watch for `securitypolicyviolation` events. It shows you exactly which directives your integration needs before you enforce anything.

Cross-Origin-Opener-Policy. Klarna's purchase flow opens in a pop-up, and Cross-Origin-Opener-Policy controls the relationship between your page and that pop-up. This applies whether you load Klarna at the top level or inside an iframe. Set it to `same-origin-allow-popups`. It gives your page the same isolation from documents you did not open that same-origin gives, and it is the value to use with Klarna. Send it as an HTTP response header — browsers ignore Cross-Origin-Opener-Policy when it's set through a `<meta>` tag.

**Recommended for integration**

Avoid Cross-Origin-Opener-Policy: same-origin. It severs the reference between your page and the Klarna pop-up the moment the pop-up opens, in every browser, and no configuration on your side recovers it. That reference is what re-focuses the pop-up, drives the recovery backdrop, and returns the purchase result to your page. The purchase flow then falls back to rendering in Klarna's own frame instead of a pop-up, which converts less well. `same-origin-allow-popups` gives your page the same isolation from documents you did not open, so use that instead.

#### Check existing COOP header

Many sites send same-origin without deciding to: several security middlewares set it by default, Helmet among them. Check what the page actually returns before assuming it's required — `curl -sI https://your-store.example.com/cart | grep -i cross-origin-opener-policy` answers it in one line.

### Load Express checkout

You can load Express checkout in two ways: at the top level of your page (the first-party context) or inside an iframe. Load it at the top level whenever you can — this is Klarna's recommended approach, gives the most reliable customer experience, and keeps every Express checkout feature available. Only use an iframe if your architecture requires it, and follow the iframe guidance closely.

#### Load Express checkout in the first-party context

Load Express checkout directly in the top-level document of your page. The first-party context avoids the browser restrictions that apply to framed content, so pop-ups, storage access, and cross-origin windows work without extra configuration. It also keeps every Express checkout feature available, including those that require the top-level context.

#### Load Express checkout in an iframe

**Recommended for integration**

Only embed Express checkout in an iframe if your architecture requires it — loading at the top level avoids the browser restrictions that apply to framed content. If you must use an iframe, follow this guidance closely to keep the integration robust and deliver a best-in-class customer experience.

Two different frames come up on this page. Your frame is the one you create when you embed your own page — everything in this section is about that. Klarna's frame is one Klarna creates itself, to render the purchase flow on surfaces where a pop-up isn't possible. You don't configure Klarna's frame; you only need to leave room for it, which is what the full-viewport expansion below is for.

Klarna's purchase flow opens in a pop-up window on top of your page. If you load Express checkout inside an iframe and apply the sandbox attribute, include the tokens below and delegate the payment permission with allow, so the browser can open that pop-up and keep the reference between the pop-up and your page.

**MARKUP**

```html
<iframe
  src="https://your-store.example.com/cart"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-storage-access-by-user-activation"
  allow="payment; camera; clipboard-write; web-share">
</iframe>
```

| sandbox token | Why it's required |
| --- | --- |
| `allow-scripts` | Run the Klarna SDK integration |
| `allow-same-origin` | Keep the iframe's own origin for storage, cookies, and network calls |
| `allow-popups` | Open the Klarna pop-up window |
| `allow-popups-to-escape-sandbox` | Keep the Klarna pop-up out of the frame's sandbox, so narrowing the token list later doesn't silently restrict it |
| `allow-forms` | Submit the payment form |
| `allow-modals` | Show modal dialogs where needed |
| `allow-storage-access-by-user-activation` | Let the framed page request storage access after a customer interaction, which a third-party context requires before it can use storage |

The allow attribute is separate from sandbox — it delegates a browser permission to the framed document.

| allow directive | Why it's required |
| --- | --- |
| `payment` | Delegate the Payment Request API to the iframe. The permission defaults to the top-level document only, so a framed integration has to be granted it explicitly. |
| `camera` | Lets the purchase flow capture an ID document when the customer's journey includes identity verification. |
| `clipboard-write` | Copying reference numbers from the purchase flow. |
| `web-share` | The system share sheet, where the flow offers it. |

**Integration requirement**

Permissions-Policy. If your top-level page sends a Permissions-Policy response header, it has to grant these permissions to your own origin as well as to Klarna's. Delegation starts at your page: if the header doesn't include self, the allow attribute above has nothing to pass on and the framed document is denied whatever the markup says. Klarna's own frames delegate these permissions to specific origins in turn, so the chain has to hold at every level. Klarna renders from https://payments.klarna.com, https://js.klarna.com and https://x.klarnacdn.net, and each origin has to be listed in full — the allowlist doesn't accept wildcards for subdomains. A payment directive that covers all of them reads `payment=(self "https://payments.klarna.com" "https://js.klarna.com" "https://x.klarnacdn.net")`.

**Recommended for integration**

The pop-up recovery path requires the top-level document. The mechanism that returns the purchase result to your page if the pop-up connection is lost runs only when the page hosting the Klarna SDK integration is the top-level document. A framed integration doesn't have it, and neither does a page nested deeper inside a marketplace shell, a platform wrapper, or a second layer of your own. This is the strongest reason to load Klarna at the top level.

##### Same-origin iframe hosting

Where possible, host the iframe on the same origin as your page. It reduces the storage and redirect restrictions that browsers apply in a third-party context. This is a reliability recommendation, not a security boundary — with `allow-scripts` and `allow-same-origin` a same-origin frame can reach its parent, so do not treat the sandbox as an isolation control.

Also, when loading inside an iframe:

- Load Express checkout only once per page — loading it more than once can leave overlapping widgets and lock page scrolling.

- Expand the iframe to full screen while the purchase flow is open — required so Klarna can render the recovery backdrop and, where pop-ups aren't possible, Klarna's frame containing the flow itself. A frame cannot resize itself, so the parent page must apply the resize: have the framed page notify the parent with postMessage when the flow opens and closes, and have the parent expand the frame to the full viewport and restore its inline size afterwards. Validate the origin on both sides — the framed page posts to the exact parent origin, and the parent checks event.origin before it resizes. The example below shows the handshake.

- Some Klarna features are not available inside an iframe — pre-purchase personalization and conversion-boost placements require the top-level context. Use the top-level integration if you rely on them.

From the framed page that hosts Express checkout, tell the parent when Klarna's flow opens and closes. Post to the exact parent origin — never *.

**JAVASCRIPT**

```javascript
const PARENT_ORIGIN = 'https://parent.example.com';

// Wire this into the button's on_click handler.
function onKlarnaClick(authorize) {
// Ask the parent to expand the frame, then start the flow.
window.parent.postMessage({ type: 'klarna:flow-open' }, PARENT_ORIGIN);

authorize({ auto_finalize: true, collect_shipping_address: true }, orderPayload, (result) => {
// Restore the frame once the authorize() callback runs.
window.parent.postMessage({ type: 'klarna:flow-close' }, PARENT_ORIGIN);
```

Expand

The framed page signals the parent around the purchase flow.

From the parent page, expand the iframe to the full viewport while the flow is open, then restore its inline size. Validate `event.origin` before acting on any message.

**JAVASCRIPT**

```javascript
const FRAME_ORIGIN = 'https://your-store.example.com';
const frame = document.getElementById('klarna-frame');
const inlineStyle = frame.getAttribute('style') || '';

window.addEventListener('message', function (event) {
if (event.origin !== FRAME_ORIGIN) return;

if (event.data && event.data.type === 'klarna:flow-open') {
frame.style.cssText =
'position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:2147483647;';
```

Expand

The parent resizes the iframe when the framed page signals.

### Initialize Express checkout

Implement the `klarnaAsyncCallback` function to initialize Express checkout. Implement `klarnaAsyncCallback` before you load the library, so it runs when the library is ready. Within `klarnaAsyncCallback`, include the logic to:

1.  Initialize Klarna's JavaScript SDK with your client identifier as `client_id`. Get your `client_id` from the Klarna Partner Portal. You must also allowlist your integration's origin in the Klarna Partner Portal under Payment settings → Client Identifiers, otherwise the customer sees a "We couldn't load the next screen" error. Refer to the platform and PSP support article for instructions.
2.  Load Express checkout in a chosen container with the `load()` function. To debug issues when it loads, handle the result in the `load()` callback.
3.  Handle the `on_click` event, where you start the payment authorization by calling the `authorize()` function. Keep these best practices in mind:

    - 3.1. Make sure the format of the orderPayload matches the body of the request to create a Klarna payments sessionAPI.

    - 3.2. Always invoke the authorize() callback that you receive in on_click.

    - 3.3. Avoid delays or nested asynchronous calls between the customer clicking Express checkout and calling authorize(), because longer delays cause the browser to block the Klarna pop-up.

#### OrderPayload contents

The `orderPayload` object can contain all information allowed in the Klarna payments APIAPI, for example, merchant references, merchant URLs, and extra merchant data.

**HTML**

```html
<script defer
  src="https://x.klarnacdn.net/kp/lib/v1/api.js">
</script>

<script>
  window.klarnaAsyncCallback = function () {
    window.Klarna.Payments.Buttons.init({
      client_id: 'klarna_client_test...',
    }).load(
    {
```

Expand

A sample that initializes the library and renders Express checkout.

The following table lists the attributes of the `load()` function's configuration object.

| Attribute | Required | Description |
| --- | --- | --- |
| `container` | Yes | The location where you want Express checkout to be displayed. You can specify either a CSS selector, for example, #my-component-id or .my-component-class, or an element-type object directly, for example, document.createElement('div'). |
| `on_click` | Yes | The function that runs when the customer clicks Express checkout. It receives the authorize() function, which you must invoke to start the Express checkout flow. The authorize() function acts like authorize() in a standard Klarna payments integration. |
| `theme` | No | The color theme of the button. The possible values are default, light, and dark. If the value isn't specified, default is used. |
| `shape` | No | The shape of the button. The possible values are default, rect, and pill. If the value isn't specified, default is used. |
| `locale` | No | The language of the button text. If not specified, the browser's language is used. |

#### Locale configuration

The value of locale passed in the `authorize()` function's configuration object defines the language of the button text. The value of localeAPI passed to `authorize()` inside the `orderPayload` defines the language of the purchase flow. Learn more about locale formatsAPI in Klarna APIs.

The following table lists the attributes for the `authorize()` function's configuration object.

| Attribute | Required | Description |
| --- | --- | --- |
| `collect_shipping_address` | No | Informs Express checkout whether you need the customer's shipping address from Klarna. The default value is false; set it to true when you need Klarna to return the customer's shipping address. |
| `auto_finalize` | No | Specifies whether the authorization is automatically finalized when the customer clicks Express checkout. In one-step Express checkout, set auto_finalize to true so the purchase is authorized automatically. The default value is true. |

**Integration requirement**

If you load Express checkout inside an iframe, expand the iframe to fill the full viewport while the purchase flow is open. This lets Klarna render its backdrop — the recovery mechanism that lets the customer reopen or locate the Klarna pop-up if the browser blocked it or the pop-up was lost among their other tabs — and, on surfaces where a pop-up is not possible (such as a WebView), render the purchase flow inside its own frame. If the iframe stays at its inline size, neither recovery path can display and customers who lose the pop-up drop out of the checkout.

#### Mobile browser behavior

On mobile browsers, where pop-ups and cross-origin windows are the most restricted, Klarna's JavaScript SDK works within the browser's restrictions to open the purchase flow. Express checkout has no redirect-based fallback.

### Create the payment session on your server (recommended)

We recommend creating the payment session on your server. Server-side session creation keeps your Klarna API credentials and session setup off the client, which is more secure and reliable. Creating the session client-side — initializing with your `client_id` and passing the `orderPayload` to `authorize()`, as shown above — remains a supported alternative if it better fits your architecture.

To create the payment session on your server, follow these steps:

1. Create a new payment session.
2. Pass the client_token from the create session responseAPI to the Klarna.Payments.Buttons.init function.
3. Omit the order details in the authorize() function.
4. Keep the rest of the implementation the same.

**HTML**

```html
<script>
  window.klarnaAsyncCallback = function () {
    window.Klarna.Payments.Buttons.init({
      client_token: '<client_token>',
    }).load(
    {
      container: '#container',
      theme: 'default',
      shape: 'default',
      locale: 'es-ES',
```

A sample that initializes Express checkout with a `client_token` created on your server.

### Render your own button (optional)

Render your own button to align with your other Express checkout buttons, then start the purchase flow programmatically. Use the same `orderPayload` object described above — it matches the body of the request to create a Klarna payments sessionAPI. Call `authorize()` from your button's click handler, not at load, otherwise the browser blocks the Klarna pop-up.

```javascript
window.klarnaAsyncCallback = function () {
  // Initialize once when the library is ready.
  const button = window.Klarna.Payments.Buttons.init({
    client_id: '<client_id>',
  });

  // Start the purchase flow from the click handler of your own button.
  document.getElementById('my-express-button').addEventListener('click', () => {
    button.authorize(
      {
```

Expand

A sample that starts the purchase flow from your own button's click handler.

## Handle the authorization response

If the authorization is successful, you receive the `authorization_token` from the client-side `authorize()` response, in the authorization callback, or by getting the payment details from the Klarna payments APIAPI.

If `collect_shipping_address` is true, the response includes `collected_shipping_address`. Any `merchant_reference1` and `merchant_reference2` values you provided are echoed back.

**JSON**

```json
{
  "show_form": true,
  "approved": true,
  "finalize_required": false,
  "authorization_token": "1eddf502-f3a0-45bf-b1fd-f2e3a2758200",
  "session_id": "e4b81ca2-0aae-4c16-bcb2-29a0a088a35b",
  "collected_shipping_address": {
    "attention": "Attn",
    "city": "London",
    "country": "GB",
```

Expand

A sample response from the client-side `authorize()` call.

**JSON**

```json
{
  "authorization_token": "1eddf502-f3a0-45bf-b1fd-f2e3a2758200",
  "session_id": "e4b81ca2-0aae-4c16-bcb2-29a0a088a35b",
  "merchant_reference1": "order-1234",
  "merchant_reference2": "customer-5678"
}
```

A sample response from the authorization callback.

## Create an order

Once you have the `authorization_token`, create an orderAPI. When you create the order, make sure the shipping address in the API request matches the collected shipping address returned alongside the `authorization_token`.
