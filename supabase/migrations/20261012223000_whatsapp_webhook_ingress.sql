-- Only this secret-authenticated RPC can insert inbox receipts with a publishable API key.
create function public.ingest_whatsapp_webhook_receipts(p_receipts jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
  inserted integer;
begin
  token := coalesce(nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-utekos-whatsapp-token', '');
  if length(token) <> 43 or encode(extensions.digest(token, 'sha256'), 'hex') <> '83ae2d83b11538a0699f686c7f7708ff8e0fd117d17c4abed6ad8f01dd18e4fb' then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;
  if jsonb_typeof(p_receipts) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'invalid_receipts';
  end if;
  if jsonb_array_length(p_receipts) not between 1 and 1000 or octet_length(p_receipts::text) > 8 * 1024 * 1024 then
    raise exception using errcode = '22023', message = 'invalid_receipts';
  end if;
  insert into public.whatsapp_webhook_receipts(event_key, waba_id, field, payload)
  select r.event_key, r.waba_id, r.field, r.payload
  from jsonb_to_recordset(p_receipts) as r(event_key text, waba_id text, field text, payload jsonb)
  on conflict(event_key) do nothing;
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;
revoke all on function public.ingest_whatsapp_webhook_receipts(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.ingest_whatsapp_webhook_receipts(jsonb) to anon;
comment on function public.ingest_whatsapp_webhook_receipts(jsonb) is
  'Insert-only WhatsApp inbox ingress. Requires dedicated high-entropy header secret. No read or update access.';

