-- Readers, writers, follows and private direct messages.
begin;

create table public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index user_blocks_blocked_idx on public.user_blocks(blocked_id, blocker_id);
alter table public.user_blocks enable row level security;
create policy blocks_own_read on public.user_blocks for select to authenticated using (blocker_id = auth.uid());
create policy blocks_own_insert on public.user_blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy blocks_own_delete on public.user_blocks for delete to authenticated using (blocker_id = auth.uid());
revoke all on public.user_blocks from anon, authenticated;
grant select, insert(blocker_id, blocked_id), delete on public.user_blocks to authenticated;
grant all on public.user_blocks to service_role;

create table public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
create index user_follows_followed_idx on public.user_follows(followed_id, created_at desc);
alter table public.user_follows enable row level security;
create policy follows_public_read on public.user_follows for select to anon, authenticated using (true);
create policy follows_own_insert on public.user_follows for insert to authenticated with check (follower_id = auth.uid());
create policy follows_own_delete on public.user_follows for delete to authenticated using (follower_id = auth.uid());
revoke all on public.user_follows from anon, authenticated;
grant select on public.user_follows to anon, authenticated;
grant insert(follower_id, followed_id), delete on public.user_follows to authenticated;
grant all on public.user_follows to service_role;

create or replace function private.guard_follow() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.user_blocks b where
    (b.blocker_id = new.follower_id and b.blocked_id = new.followed_id) or
    (b.blocker_id = new.followed_id and b.blocked_id = new.follower_id)) then
    raise exception 'Follow unavailable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger social_follow_guard before insert on public.user_follows
  for each row execute function private.guard_follow();

create or replace function private.follow_notice() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id, type, actor_id, content)
    values (new.followed_id, 'follow', new.follower_id, 'يتابعك عضو جديد في مجتمع عُروبة');
  return null;
end $$;
create trigger social_follow_notice after insert on public.user_follows
  for each row execute function private.follow_notice();

create or replace function private.block_removes_follows() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.user_follows where
    (follower_id = new.blocker_id and followed_id = new.blocked_id) or
    (follower_id = new.blocked_id and followed_id = new.blocker_id);
  return null;
end $$;
create trigger social_block_follows after insert on public.user_blocks
  for each row execute function private.block_removes_follows();

create table public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_message_preview text,
  unique (user_low, user_high),
  check (user_low < user_high)
);
create index direct_conversations_low_idx on public.direct_conversations(user_low, last_message_at desc nulls last);
create index direct_conversations_high_idx on public.direct_conversations(user_high, last_message_at desc nulls last);
alter table public.direct_conversations enable row level security;
create policy conversations_participants_read on public.direct_conversations for select to authenticated
  using (auth.uid() in (user_low, user_high));
revoke all on public.direct_conversations from anon, authenticated;
grant select on public.direct_conversations to authenticated;
grant all on public.direct_conversations to service_role;

create or replace function public.start_direct_conversation(p_other uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); low_id uuid; high_id uuid; result uuid;
begin
  if actor is null or p_other is null or actor = p_other then
    raise exception 'Invalid conversation' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_other) then
    raise exception 'Member unavailable' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.user_blocks b where
    (b.blocker_id = actor and b.blocked_id = p_other) or
    (b.blocker_id = p_other and b.blocked_id = actor)) then
    raise exception 'Conversation unavailable' using errcode = '42501';
  end if;
  if not public.consume_action_rate_limit('community.create') then
    raise exception 'rate_limit_exceeded' using errcode = '42501';
  end if;
  low_id := least(actor, p_other); high_id := greatest(actor, p_other);
  insert into public.direct_conversations(user_low, user_high) values (low_id, high_id)
    on conflict (user_low, user_high) do nothing returning id into result;
  if result is null then
    select id into result from public.direct_conversations where user_low = low_id and user_high = high_id;
  end if;
  return result;
end $$;
revoke all on function public.start_direct_conversation(uuid) from public, anon;
grant execute on function public.start_direct_conversation(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('direct-media', 'direct-media', false, 41943040,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm',
        'application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/webm','audio/mp4','audio/ogg','audio/mpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy direct_media_read on storage.objects for select to authenticated
  using (bucket_id = 'direct-media' and exists (
    select 1 from public.direct_conversations c where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.user_low, c.user_high)));
create policy direct_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'direct-media' and owner_id = auth.uid()::text
    and (storage.foldername(name))[2] = auth.uid()::text and exists (
      select 1 from public.direct_conversations c where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user_low, c.user_high)));
create policy direct_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'direct-media' and owner_id = auth.uid()::text
    and (storage.foldername(name))[2] = auth.uid()::text);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 5000),
  attachment_path text,
  attachment_name text,
  attachment_kind text check (attachment_kind in ('image','video','pdf','docx','voice')),
  attachment_size integer check (attachment_size between 1 and 41943040),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check (char_length(btrim(body)) > 0 or attachment_path is not null),
  check ((attachment_path is null and attachment_name is null and attachment_kind is null and attachment_size is null)
      or (attachment_path is not null and attachment_name is not null and attachment_kind is not null and attachment_size is not null))
);
create index direct_messages_thread_idx on public.direct_messages(conversation_id, created_at desc, id desc);
create index direct_messages_unread_idx on public.direct_messages(recipient_id, created_at desc) where not is_read;
alter table public.direct_messages enable row level security;
create policy direct_messages_participants_read on public.direct_messages for select to authenticated
  using (exists (select 1 from public.direct_conversations c where c.id = conversation_id and auth.uid() in (c.user_low, c.user_high)));
create policy direct_messages_sender_insert on public.direct_messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (
    select 1 from public.direct_conversations c where c.id = conversation_id and auth.uid() in (c.user_low, c.user_high)));
create policy direct_messages_recipient_read on public.direct_messages for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy direct_messages_sender_delete on public.direct_messages for delete to authenticated
  using (sender_id = auth.uid());
revoke all on public.direct_messages from anon, authenticated;
grant select on public.direct_messages to authenticated;
grant insert(conversation_id, sender_id, body, attachment_path, attachment_name, attachment_kind, attachment_size),
  update(is_read), delete on public.direct_messages to authenticated;
grant all on public.direct_messages to service_role;

create table private.direct_message_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null
);
alter table private.direct_message_quotas enable row level security;

create or replace function private.guard_direct_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); recipient uuid; media_owner text; media_mime text;
  minute_start timestamptz := date_trunc('minute', clock_timestamp()); accepted boolean;
begin
  if actor is null or new.sender_id <> actor then
    raise exception 'Message sender unavailable' using errcode = '42501';
  end if;
  select case when user_low = actor then user_high when user_high = actor then user_low else null end
    into recipient from public.direct_conversations where id = new.conversation_id;
  if recipient is null then raise exception 'Conversation unavailable' using errcode = '42501'; end if;
  if exists (select 1 from public.user_blocks b where
    (b.blocker_id = actor and b.blocked_id = recipient) or
    (b.blocker_id = recipient and b.blocked_id = actor)) then
    raise exception 'Messaging unavailable' using errcode = '42501';
  end if;
  new.recipient_id := recipient;
  if new.attachment_path is not null then
    if new.attachment_path !~ ('^' || new.conversation_id::text || '/' || actor::text || '/[0-9a-f-]{36}[.](jpg|png|webp|gif|mp4|webm|pdf|docx|ogg|mp3)$')
      or char_length(coalesce(new.attachment_name, '')) not between 1 and 160 then
      raise exception 'Invalid message attachment' using errcode = '42501';
    end if;
    select owner_id, metadata->>'mimetype' into media_owner, media_mime from storage.objects
      where bucket_id = 'direct-media' and name = new.attachment_path;
    if media_owner is distinct from actor::text or media_mime is null or not (
      (new.attachment_kind = 'image' and media_mime in ('image/jpeg','image/png','image/webp','image/gif') and new.attachment_path ~ '[.](jpg|png|webp|gif)$') or
      (new.attachment_kind = 'video' and media_mime in ('video/mp4','video/webm') and new.attachment_path ~ '[.](mp4|webm)$') or
      (new.attachment_kind = 'pdf' and media_mime = 'application/pdf' and new.attachment_path ~ '[.]pdf$') or
      (new.attachment_kind = 'docx' and media_mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' and new.attachment_path ~ '[.]docx$') or
      (new.attachment_kind = 'voice' and media_mime in ('audio/webm','audio/mp4','audio/ogg','audio/mpeg') and new.attachment_path ~ '[.](webm|mp4|ogg|mp3)$')
    ) then raise exception 'Invalid message attachment' using errcode = '42501'; end if;
  end if;
  insert into private.direct_message_quotas(user_id, window_start, requests)
    values(actor, minute_start, 1)
    on conflict(user_id) do update set window_start = excluded.window_start,
      requests = case when private.direct_message_quotas.window_start = excluded.window_start
        then private.direct_message_quotas.requests + 1 else 1 end
    returning requests <= 30 into accepted;
  if not accepted then raise exception 'rate_limit_exceeded' using errcode = '42501'; end if;
  return new;
end $$;
create trigger direct_message_guard before insert on public.direct_messages
  for each row execute function private.guard_direct_message();

create or replace function private.touch_direct_conversation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.direct_conversations set last_message_at = new.created_at,
    last_message_preview = case when char_length(btrim(new.body)) > 0 then left(new.body, 120)
      else case new.attachment_kind when 'voice' then 'رسالة صوتية' when 'image' then 'صورة'
        when 'video' then 'فيديو' else 'ملف: ' || coalesce(new.attachment_name, '') end end
    where id = new.conversation_id;
  return null;
end $$;
create trigger direct_message_conversation after insert on public.direct_messages
  for each row execute function private.touch_direct_conversation();

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'direct_messages'
  ) then alter publication supabase_realtime add table public.direct_messages; end if;
end $$;

revoke all on function private.guard_follow() from public, anon, authenticated;
revoke all on function private.follow_notice() from public, anon, authenticated;
revoke all on function private.block_removes_follows() from public, anon, authenticated;
revoke all on function private.guard_direct_message() from public, anon, authenticated;
revoke all on function private.touch_direct_conversation() from public, anon, authenticated;
revoke all on private.direct_message_quotas from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
