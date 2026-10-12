-- Private inbox. A successful insert is required before acknowledging Meta.
create table public.whatsapp_webhook_receipts (
  event_key text primary key check (event_key ~ '^[a-f0-9]{64}$'),
  waba_id text not null,
  field text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  received_at timestamptz not null default now()
);
alter table public.whatsapp_webhook_receipts enable row level security;
revoke all on public.whatsapp_webhook_receipts from public, anon, authenticated;
grant select, insert, delete on public.whatsapp_webhook_receipts to service_role;
create index whatsapp_webhook_receipts_received_at_idx on public.whatsapp_webhook_receipts (received_at);
comment on table public.whatsapp_webhook_receipts is
  'Private signed WhatsApp webhook inbox. Contains customer data; no browser access. No automated replies or background processing.';
