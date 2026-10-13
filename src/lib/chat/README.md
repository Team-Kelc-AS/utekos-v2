# Chat history

`POST /api/chat` stores the transcript through TanStack `withPersistence`.
`GET /api/chat?threadId=...` reconstructs it for `useChat({ persistence: true })`.
`/api/chat/get` is an alias for history; `/api/chat/resume` uses the same history
with the Gemini adapter for POST requests.

The Supabase `chat_transcript` RPC owns all database access. The table has RLS
enabled and no direct API grants. Each visitor gets a random 256-bit HttpOnly,
SameSite=Lax cookie (`__Host-utekos_chat` over HTTPS). Only its SHA-256 hash is
stored in the database. The same `threadId` under another cookie is a different
conversation. Clearing the cookie loses access; cross-device history requires
a separate authenticated account integration.

Set `CHAT_SUPABASE_URL` and `CHAT_SUPABASE_PUBLISHABLE_KEY` to select a project.
They currently fall back to the existing `WHATSAPP_SUPABASE_URL` and
`WHATSAPP_SUPABASE_PUBLISHABLE_KEY` for the shared Utekos Supabase project.
No service-role key or WhatsApp ingestion credential is used.

The migration in `supabase/migrations/*_chat_transcripts.sql` is required.
Writes replace the full transcript and check its version; stale writers receive
409 instead of overwriting another tab's conversation. Storage failures return
503 before generation starts, or fail the stream if persistence fails later.

This stores transcripts, including periodic partial-response snapshots. It does
not run a model in the background after a disconnect. Old SSE delivery cursors
return 410; clients reload history instead. No Durable Streams server is used.

Verification: `node --test tests/chat-persistence.test.cjs tests/chat-contracts.test.cjs tests/chat-browser.test.cjs`.
