-- Community creators, books, reactions and live notifications.
begin;

alter table public.profiles add column if not exists community_role text;
alter table public.profiles add constraint profiles_community_role_check
  check (community_role in ('reader', 'writer'));

alter table public.posts add column if not exists author_kind text not null default 'reader';
alter table public.posts add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table public.posts add constraint posts_author_kind_check check (author_kind in ('reader', 'writer'));
alter table public.posts add constraint posts_attachments_shape check (
  jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 4
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', true, 41943040,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm',
        'application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy community_media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_media_remove on storage.objects for delete to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function private.guard_community_post() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); chosen text; item jsonb; media_path text; media_type text;
begin
  if actor is null or new.user_id <> actor then raise exception 'Authentication required' using errcode = '42501'; end if;
  select community_role into chosen from public.profiles where id = actor;
  if chosen not in ('reader','writer') or chosen is null then
    raise exception 'Choose reader or writer before publishing' using errcode = '42501';
  end if;
  new.author_kind := chosen;
  if jsonb_typeof(new.attachments) <> 'array' or jsonb_array_length(new.attachments) > 4 then
    raise exception 'Invalid attachments' using errcode = '22023';
  end if;
  for item in select * from jsonb_array_elements(new.attachments) loop
    media_path := item->>'path'; media_type := item->>'type';
    if media_path !~ ('^' || actor::text || '/[0-9a-f-]{36}[.](jpg|png|webp|gif|mp4|webm|pdf|docx)$')
      or media_type not in ('image','video','pdf','docx')
      or char_length(coalesce(item->>'name','')) not between 1 and 160
      or not exists (select 1 from storage.objects
        where bucket_id = 'community-media' and name = media_path and owner_id = actor::text)
    then raise exception 'Invalid attachment ownership or format' using errcode = '42501'; end if;
    if media_type in ('pdf','docx') and chosen <> 'writer' then
      raise exception 'Only writers may publish books' using errcode = '42501';
    end if;
  end loop;
  return new;
end $$;
create trigger community_post_guard before insert on public.posts
  for each row execute function private.guard_community_post();
grant insert(user_id, content, attachments) on public.posts to authenticated;

create table public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('approve','meh','boo')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_reactions_kind_idx on public.post_reactions(post_id, reaction);
alter table public.post_reactions enable row level security;
create policy reactions_visible on public.post_reactions for select to anon,authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden));
create policy reactions_reader_insert on public.post_reactions for insert to authenticated
  with check (user_id = auth.uid() and
    exists (select 1 from public.profiles where id = auth.uid() and community_role = 'reader') and
    exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden and p.author_kind = 'writer' and p.user_id <> auth.uid()));
create policy reactions_reader_update on public.post_reactions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and
    exists (select 1 from public.profiles where id = auth.uid() and community_role = 'reader') and
    exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden and p.author_kind = 'writer' and p.user_id <> auth.uid()));
create policy reactions_reader_delete on public.post_reactions for delete to authenticated
  using (user_id = auth.uid());
revoke all on public.post_reactions from anon,authenticated;
grant select on public.post_reactions to anon,authenticated;
grant insert(post_id,user_id,reaction),update(reaction),delete on public.post_reactions to authenticated;
grant all on public.post_reactions to service_role;

create or replace function private.community_reaction_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.consume_action_rate_limit('community.like') then
    raise exception 'rate_limit_exceeded';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;
create trigger community_reaction_limit before insert or update or delete on public.post_reactions
  for each row execute function private.community_reaction_limit();

create or replace function private.community_reaction_notice() returns trigger
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id and not exists (
    select 1 from public.notifications where post_id = new.post_id and actor_id = new.user_id and type = 'system' and content = 'قيّم أحد القرّاء عملك'
  ) then
    insert into public.notifications(user_id,type,post_id,actor_id,content)
      values (owner_id,'system',new.post_id,new.user_id,'قيّم أحد القرّاء عملك');
  end if;
  return null;
end $$;
create trigger community_reaction_notice after insert on public.post_reactions
  for each row execute function private.community_reaction_notice();

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

revoke all on function private.guard_community_post() from public,anon,authenticated;
revoke all on function private.community_reaction_notice() from public,anon,authenticated;
revoke all on function private.community_reaction_limit() from public,anon,authenticated;
commit;
