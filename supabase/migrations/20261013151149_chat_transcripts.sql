-- Anonymous chat ownership is a 256-bit capability kept in an HttpOnly cookie.
-- Only its hash is stored; a thread id alone never authorizes access.
create table public.chat_transcripts (
  owner_hash text not null,
  thread_id text not null check (length(thread_id) between 1 and 200),
  messages jsonb not null default '[]'::jsonb
    check (jsonb_typeof(messages) = 'array' and octet_length(messages::text) <= 1048576),
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner_hash, thread_id)
);

alter table public.chat_transcripts enable row level security;
revoke all on public.chat_transcripts from public, anon, authenticated, service_role;

create function public.chat_transcript(
  p_thread_id text,
  p_messages jsonb default null,
  p_expected_version bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_token text;
  owner_id text;
  stored public.chat_transcripts%rowtype;
begin
  session_token := coalesce(nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-utekos-chat-session', '');
  if session_token !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '42501', message = 'chat_session_required';
  end if;
  if p_thread_id is null or length(p_thread_id) not between 1 and 200 then
    raise exception using errcode = '22023', message = 'invalid_chat_thread';
  end if;
  owner_id := encode(extensions.digest(session_token, 'sha256'), 'hex');

  if p_messages is null then
    select * into stored from public.chat_transcripts
      where owner_hash = owner_id and thread_id = p_thread_id;
    if not found then
      return jsonb_build_object('messages', '[]'::jsonb, 'version', 0);
    end if;
  else
    if jsonb_typeof(p_messages) is distinct from 'array'
      or octet_length(p_messages::text) > 1048576
      or jsonb_array_length(p_messages) > 1000
      or p_expected_version is null or p_expected_version < 0 then
      raise exception using errcode = '22023', message = 'invalid_chat_transcript';
    end if;
    insert into public.chat_transcripts(owner_hash, thread_id)
      values (owner_id, p_thread_id) on conflict do nothing;
    select * into stored from public.chat_transcripts
      where owner_hash = owner_id and thread_id = p_thread_id for update;
    if stored.version <> p_expected_version then
      raise exception using errcode = 'PT409', message = 'chat_version_conflict';
    end if;
    update public.chat_transcripts set messages = p_messages,
      version = version + 1, updated_at = now()
      where owner_hash = owner_id and thread_id = p_thread_id
      returning * into stored;
  end if;
  return jsonb_build_object('messages', stored.messages, 'version', stored.version);
end;
$$;

revoke all on function public.chat_transcript(text, jsonb, bigint)
  from public, anon, authenticated, service_role;
grant execute on function public.chat_transcript(text, jsonb, bigint) to anon;
comment on function public.chat_transcript(text, jsonb, bigint) is
  'Read or replace only the transcript owned by the supplied high-entropy chat session capability. Version check prevents stale writes.';
