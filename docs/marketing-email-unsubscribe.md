# Marketing email unsubscribe

The marketing campaign uses Resend's `/emails` API with consent-filtered contacts.
Broadcast delivery is currently blocked by the account's Marketing contact quota.
This does not make the messages transactional in purpose.

`/api/email/marketing/unsubscribe` supports human confirmation and RFC 8058
one-click unsubscribe. GET is read-only so link scanners do not change consent.
POST acknowledges success only after the Resend contact is saved as unsubscribed
and read back. Invalid signatures, duplicate tokens, oversized bodies, provider
errors and missing configuration fail closed. Responses are not cached.

Configure `MARKETING_UNSUBSCRIBE_SECRET` in production. Keep this dedicated secret
stable: rotating it invalidates existing links. Tokens contain a contact UUID and
a purpose-bound HMAC, never an email address. The existing Resend integration key
must be allowed to read and update Contacts. It is never sent to the browser.

`sendMarketingEmail` checks the current contact ID, address and unsubscribe flag
immediately before sending. It replaces the visible HTML/plain-text unsubscribe
placeholder and sends matching `List-Unsubscribe` and `List-Unsubscribe-Post`
headers. It does not schedule messages. Future sends must repeat the status check
at delivery time. Do not use raw delayed `/emails` sends that bypass that check.

Resend API idempotency lasts 24 hours. Maintain a durable receipt ledger for each
campaign/contact and do not re-send accepted recipients after that window.
Future Shopify imports must preserve Resend opt-outs. This route does not modify
Shopify marketing consent. A Resend `unsubscribed:false` value is a suppression
check, not independent evidence of consent.

Validation: 10 unit tests, focused ESLint and full TypeScript check passed.
Production GET, one-click POST and persisted contact state must be verified before
the campaign is released. Creating this route never starts a campaign.

Sources:
- https://resend.com/pricing
- https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails
- https://resend.com/docs/api-reference/contacts/update-contact
- https://resend.com/docs/api-reference/emails/send-email
- https://datatracker.ietf.org/doc/html/rfc8058
