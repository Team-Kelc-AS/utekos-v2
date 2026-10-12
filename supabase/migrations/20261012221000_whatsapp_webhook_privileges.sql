-- Supabase default privileges may grant ALL to service_role on new tables.
revoke all on public.whatsapp_webhook_receipts from service_role;
grant select, insert, delete on public.whatsapp_webhook_receipts to service_role;
