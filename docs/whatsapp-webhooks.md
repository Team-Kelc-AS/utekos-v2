# WhatsApp webhooks

App: Utekos App Master (`1154247890253046`). Intended production callback:
`https://utekos.no/api/whatsapp/webhook`.

The GET handler compares `hub.verify_token` with `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
and returns the exact `hub.challenge` only for `hub.mode=subscribe`.
The POST handler verifies `X-Hub-Signature-256` against the raw request bytes
using `WHATSAPP_APP_SECRET`, bounds bodies to 3 MiB and stores events in the
private Supabase `public.whatsapp_webhook_receipts` inbox before returning 200.
Missing configuration or failed storage returns 503 so Meta can retry.

Messages/statuses are split into individual receipts. Database primary-key
uniqueness deduplicates concurrent retries and changed batching. Sent, delivered
and read statuses are separate receipts. Other fields retain their full change
payload. Payloads are customer data: RLS is enabled with no browser policies;
only the service role has direct inbox privileges. The insert-only RPC requires
a dedicated secret header and validates its SHA-256 hash before inserting.
It exposes no read or update operation. Tokens and payloads are never logged.
There are no automatic replies, outgoing messages, cron jobs or background jobs.
Retention/deletion is manual; no automated expiry is configured.

## Configuration

Production needs `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`,
`WHATSAPP_SUPABASE_URL`, `WHATSAPP_SUPABASE_PUBLISHABLE_KEY` and
`WHATSAPP_WEBHOOK_INGEST_TOKEN`. These are dedicated production Vercel variables.
The existing shared service-role key returned 401, and the Supabase API readback
showed the legacy anon key disabled. WhatsApp therefore uses an enabled modern
publishable key plus its own insert-only secret-authenticated RPC.
The app secret is from Utekos App Master;
the verify token is an independently generated 256-bit random value. Never put
either value in Git or this document. Local copies are in ignored `.env.local`.

Apply all `2026101222*_whatsapp_webhook_*.sql` migrations in order once. To rotate
the ingestion token, replace the expected SHA-256 hash in the RPC through a new
migration and update the sensitive Vercel variable together.
Deploy only through the project's `pnpm run sync` workflow. That command stages
all changes, so review the entire dirty tree before invoking it.

After production readback verifies the route and storage, register the callback
under `whatsapp_business_account` with these fields:

- `messages`
- `account_alerts`, `account_review_update`, `account_update`
- `business_capability_update`
- `message_template_status_update`, `message_template_quality_update`, `message_template_components_update`
- `phone_number_name_update`, `phone_number_quality_update`
- `security`, `user_preferences`

Then verify the app's subscription to the intended WABA (not only the app-level
webhook configuration). Confirm any WABA/phone-level callback overrides. Use
Meta's webhook test and check a durable synthetic receipt without exposing its
payload. Natural message receipt is a separate final verification.

## Verification

### Setup readback, 2026-10-12

- Local implementation: nine tests, lint, typecheck and production build passed.
- Vercel: both dedicated variables saved and read back as sensitive, production-only.
- Supabase project `hkoawfbomhnzupcsdggb`: both migrations applied; RLS and
  service-role-only SELECT/INSERT/DELETE verified. A synthetic duplicate insert
  produced one row in a rolled-back transaction.
- Deployment pending: public callback returned 404. App-level WhatsApp fields,
  WABA subscription, live REST storage and Meta test delivery remain unverified.
- `pnpm run sync` would also publish unrelated existing worktree changes.

`NODE_OPTIONS='--conditions=react-server' pnpm exec tsx --test tests/whatsapp-webhook.test.ts`

The tests cover verification, raw-byte signatures, malformed payloads, body
limits, storage failure, batching and status deduplication. They do not prove
production deployment, WABA subscription or natural delivery.

## Sources

- https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview/
- https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint/
- https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages
- https://supabase.com/docs/guides/database/secure-data
