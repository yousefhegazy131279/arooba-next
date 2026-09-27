-- Apply through Supabase migrations/SQL Editor after taking a database backup.
-- Requires the existing profiles, novels, chapters and Supabase auth schemas.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- The source project had no schema snapshot. Match existing story/chapter keys
-- instead of assuming UUIDs and breaking installations with bigint identities.
do $$
declare novel_type text; chapter_type text;
begin
  select format_type(atttypid, atttypmod) into novel_type from pg_attribute
    where attrelid = 'public.novels'::regclass and attname = 'id' and not attisdropped;
  select format_type(atttypid, atttypmod) into chapter_type from pg_attribute
    where attrelid = 'public.chapters'::regclass and attname = 'id' and not attisdropped;
  if novel_type not in ('uuid', 'integer', 'bigint', 'text', 'character varying')
     or chapter_type not in ('uuid', 'integer', 'bigint', 'text', 'character varying') then
    raise exception 'Unsupported existing novel/chapter primary key type';
  end if;
  execute format('create table public.reading_progress (
    id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
    novel_id %s not null references public.novels(id) on delete cascade,
    chapter_id %s not null references public.chapters(id) on delete cascade,
    page_number integer not null default 1 check(page_number between 1 and 1000000),
    position integer not null default 0 check(position between 0 and 100000000),
    last_read_at timestamptz not null default now(), unique(user_id, chapter_id))', novel_type, chapter_type);
  execute format('create table public.bookmarks (
    id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
    chapter_id %s not null references public.chapters(id) on delete cascade,
    page_number integer not null check(page_number between 1 and 1000000),
    position integer not null default 0 check(position between 0 and 100000000),
    note text check(char_length(note) <= 500), created_at timestamptz not null default now(),
    unique(user_id, chapter_id, position))', chapter_type);
  execute format('create table public.highlights (
    id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
    chapter_id %s not null references public.chapters(id) on delete cascade,
    text text not null check(char_length(btrim(text)) between 1 and 5000),
    color text not null default ''yellow'' check(color in (''yellow'', ''green'', ''blue'', ''pink'')),
    start_offset integer not null check(start_offset between 0 and 100000000),
    end_offset integer not null check(end_offset > start_offset and end_offset <= 100000000),
    created_at timestamptz not null default now(), unique(user_id, chapter_id, start_offset, end_offset))', chapter_type);
end $$;

create table public.reader_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  font_size text not null default 'medium' check(font_size in ('small','medium','large','xlarge')),
  font_family text not null default 'Cairo' check(font_family in ('Cairo','Amiri','Noto Naskh Arabic','Tajawal','sans-serif')),
  theme text not null default 'light' check(theme in ('light','dark','sepia')),
  brightness integer not null default 100 check(brightness between 40 and 100),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check(char_length(btrim(content)) between 1 and 2000),
  likes_count integer not null default 0 check(likes_count >= 0),
  comments_count integer not null default 0 check(comments_count >= 0),
  is_reported boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index posts_feed_idx on public.posts(created_at desc, id desc) where not is_hidden;
create index posts_user_idx on public.posts(user_id, created_at desc, id desc);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(), unique(user_id,post_id)
);
create index likes_post_idx on public.likes(post_id);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null check(char_length(btrim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments(post_id,created_at,id);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check(type in ('like','comment','follow','system')),
  post_id uuid references public.posts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  content text, is_read boolean not null default false, created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where not is_read;
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid default auth.uid() references auth.users(id) on delete set null,
  post_id uuid not null references public.posts(id) on delete cascade,
  reason text not null check(char_length(btrim(reason)) between 3 and 500),
  status text not null default 'pending' check(status in ('pending','reviewed','dismissed')),
  created_at timestamptz not null default now(), unique(reporter_id,post_id)
);
create index reports_status_idx on public.reports(status,created_at desc);

-- Only trusted service requests / SQL administration may change authorization.
-- In particular, an authenticated client may not promote its own profile.
create or replace function private.guard_profile_role() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), '') in ('anon','authenticated') then
    if tg_op = 'INSERT' and coalesce(new.role::text, 'user') <> 'user' then
      raise exception 'Role changes require administrator service access' using errcode = '42501';
    elsif tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'Role changes require administrator service access' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger arooba_protect_profile_role before insert or update on public.profiles
  for each row execute function private.guard_profile_role();

create or replace function public.is_community_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_community_admin() from public, anon;
grant execute on function public.is_community_admin() to authenticated;

create table private.action_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null, window_start timestamptz not null, requests integer not null,
  primary key(user_id,action)
);
alter table private.action_rate_limits enable row level security;

-- Quotas are chosen by the server/database, never by caller-supplied limits.
-- A single atomic UPSERT serializes concurrent requests across Vercel instances.
create or replace function public.consume_action_rate_limit(p_action text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); quota integer; accepted boolean;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  quota := case p_action
    when 'community.create' then 5 when 'community.update' then 20 when 'community.delete' then 30
    when 'community.like' then 60 when 'community.comment' then 20 when 'community.report' then 10
    when 'community.notification' then 30 when 'community.moderation' then 60
    when 'reader.progress' then 120 when 'reader.bookmark' then 30 when 'reader.highlight' then 30
    when 'reader.settings' then 30 when 'reader.delete' then 60
    when 'admin.read' then 120 when 'admin.write' then 60 when 'admin.upload' then 20
    when 'favorites.write' then 60 when 'ratings.write' then 30 else null end;
  if quota is null then raise exception 'Unknown action' using errcode='22023'; end if;
  insert into private.action_rate_limits(user_id,action,window_start,requests)
    values(actor,p_action,date_trunc('minute',clock_timestamp()),1)
    on conflict(user_id,action) do update set
      window_start = excluded.window_start,
      requests = case when private.action_rate_limits.window_start = excluded.window_start
        then private.action_rate_limits.requests + 1 else 1 end
    returning requests <= quota into accepted;
  return accepted;
end $$;
revoke all on function public.consume_action_rate_limit(text) from public, anon;
grant execute on function public.consume_action_rate_limit(text) to authenticated;

-- A SQL caller cannot bypass community rate limits by avoiding Next.js actions.
create or replace function private.community_write_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare bucket text;
begin
  if auth.uid() is not null and pg_trigger_depth() = 1 then
    bucket := case tg_table_name
      when 'posts' then case tg_op when 'INSERT' then 'community.create' when 'UPDATE' then 'community.update' else 'community.delete' end
      when 'likes' then 'community.like'
      when 'comments' then case tg_op when 'INSERT' then 'community.comment' else 'community.delete' end
      when 'reports' then 'community.report' end;
    if not public.consume_action_rate_limit(bucket) then
      raise exception 'rate_limit_exceeded' using errcode='P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;
create trigger community_post_limit before insert or update or delete on public.posts for each row execute function private.community_write_limit();
create trigger community_like_limit before insert or delete on public.likes for each row execute function private.community_write_limit();
create trigger community_comment_limit before insert or delete on public.comments for each row execute function private.community_write_limit();
create trigger community_report_limit before insert on public.reports for each row execute function private.community_write_limit();

create or replace function private.post_content_timestamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.content is distinct from old.content then new.updated_at := now(); end if;
  return new;
end $$;
create trigger post_content_timestamp before update on public.posts for each row execute function private.post_content_timestamp();

-- Only trigger functions change counters; counters and notifications commit or
-- roll back in the same transaction as the interaction that caused them.
create or replace function private.community_interaction() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target uuid; owner_id uuid; actor uuid; kind text;
begin
  if tg_op = 'INSERT' then target := new.post_id; actor := new.user_id;
  else target := old.post_id; actor := old.user_id; end if;
  kind := case tg_table_name when 'likes' then 'like' else 'comment' end;
  if tg_table_name = 'likes' then
    update public.posts set likes_count = greatest(0,likes_count + case when tg_op='INSERT' then 1 else -1 end)
      where id = target returning user_id into owner_id;
  else
    update public.posts set comments_count = greatest(0,comments_count + case when tg_op='INSERT' then 1 else -1 end)
      where id = target returning user_id into owner_id;
  end if;
  if tg_op = 'INSERT' and owner_id is not null and actor <> owner_id then
    -- Repeated unlike/like does not flood the recipient with duplicate notices.
    if kind = 'comment' or not exists(select 1 from public.notifications where post_id=target and actor_id=actor and type='like') then
      insert into public.notifications(user_id,type,post_id,actor_id,content)
      values(owner_id,kind,target,actor,case kind when 'like' then 'أُعجب بمنشورك' else 'أضاف تعليقاً على منشورك' end);
    end if;
  end if;
  return null;
end $$;
create trigger likes_counter_notification after insert or delete on public.likes for each row execute function private.community_interaction();
create trigger comments_counter_notification after insert or delete on public.comments for each row execute function private.community_interaction();

create or replace function private.report_flag() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.posts set is_reported = exists(select 1 from public.reports r where r.post_id = coalesce(new.post_id,old.post_id) and r.status='pending')
    where id = coalesce(new.post_id,old.post_id);
  return null;
end $$;
create trigger reports_flag after insert or update or delete on public.reports for each row execute function private.report_flag();

create or replace function public.toggle_community_like(p_post_id uuid)
returns table(liked boolean,likes_count integer)
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); removed integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  -- Serializes concurrent toggles for this post and cooperates with moderation.
  perform 1 from public.posts where id=p_post_id and not is_hidden for update;
  if not found then raise exception 'Post unavailable' using errcode='42501'; end if;
  delete from public.likes where post_id=p_post_id and user_id=actor;
  get diagnostics removed = row_count;
  if removed = 0 then insert into public.likes(user_id,post_id) values(actor,p_post_id); end if;
  return query select removed=0,p.likes_count from public.posts p where p.id=p_post_id;
end $$;
revoke all on function public.toggle_community_like(uuid) from public, anon;
grant execute on function public.toggle_community_like(uuid) to authenticated;

create or replace function public.moderate_community_report(p_report_id uuid,p_action text) returns void
language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  if not public.is_community_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
  if p_action not in ('hide','dismiss','restore') then raise exception 'Invalid moderation action' using errcode='22023'; end if;
  if not public.consume_action_rate_limit('community.moderation') then raise exception 'rate_limit_exceeded'; end if;
  select post_id into target from public.reports where id=p_report_id for update;
  if target is null then raise exception 'Report unavailable' using errcode='P0002'; end if;
  if p_action <> 'dismiss' then update public.posts set is_hidden=(p_action='hide') where id=target; end if;
  update public.reports set status=case when p_action='hide' then 'reviewed' else 'dismissed' end
    where id=p_report_id or (p_action='hide' and post_id=target and status='pending');
end $$;
revoke all on function public.moderate_community_report(uuid,text) from public, anon;
grant execute on function public.moderate_community_report(uuid,text) to authenticated;

-- Remove the unsafe, caller-directed counter APIs from the initial proposal.
drop function if exists public.increment_likes_count(uuid);
drop function if exists public.decrement_likes_count(uuid);
drop function if exists public.increment_comments_count(uuid);
drop function if exists public.decrement_comments_count(uuid);

alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

create policy posts_visible on public.posts for select to anon,authenticated using(not is_hidden);
create policy posts_moderation on public.posts for select to authenticated using(public.is_community_admin());
create policy posts_create on public.posts for insert to authenticated with check(auth.uid()=user_id and likes_count=0 and comments_count=0 and not is_reported and not is_hidden);
create policy posts_edit on public.posts for update to authenticated using(auth.uid()=user_id and not is_hidden) with check(auth.uid()=user_id and not is_hidden);
create policy posts_delete on public.posts for delete to authenticated using(auth.uid()=user_id or public.is_community_admin());
create policy likes_visible on public.likes for select to anon,authenticated using(exists(select 1 from public.posts p where p.id=post_id and not p.is_hidden));
create policy likes_create on public.likes for insert to authenticated with check(auth.uid()=user_id and exists(select 1 from public.posts p where p.id=post_id and not p.is_hidden));
create policy likes_delete on public.likes for delete to authenticated using(auth.uid()=user_id);
create policy comments_visible on public.comments for select to anon,authenticated using(exists(select 1 from public.posts p where p.id=post_id and not p.is_hidden));
create policy comments_create on public.comments for insert to authenticated with check(auth.uid()=user_id and exists(select 1 from public.posts p where p.id=post_id and not p.is_hidden));
create policy comments_delete on public.comments for delete to authenticated using(auth.uid()=user_id or public.is_community_admin());
create policy notifications_own on public.notifications for select to authenticated using(auth.uid()=user_id and (post_id is null or exists(select 1 from public.posts p where p.id=post_id and not p.is_hidden)));
create policy notifications_read on public.notifications for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy reports_create on public.reports for insert to authenticated with check(auth.uid()=reporter_id and status='pending' and exists(select 1 from public.posts p where p.id=post_id and not p.is_hidden));
create policy reports_own on public.reports for select to authenticated using(auth.uid()=reporter_id or public.is_community_admin());

-- Table-level UPDATE/INSERT grants from default privileges would defeat column
-- restrictions, so explicitly remove them before granting the minimal columns.
revoke all on public.posts,public.likes,public.comments,public.notifications,public.reports from anon,authenticated;
grant select on public.posts,public.likes,public.comments to anon,authenticated;
grant insert(user_id,content),update(content),delete on public.posts to authenticated;
grant insert(user_id,post_id),delete on public.likes to authenticated;
grant insert(user_id,post_id,content),delete on public.comments to authenticated;
grant select,update(is_read) on public.notifications to authenticated;
grant select,insert(reporter_id,post_id,reason) on public.reports to authenticated;

alter table public.reading_progress enable row level security;
alter table public.bookmarks enable row level security;
alter table public.highlights enable row level security;
alter table public.reader_settings enable row level security;
create policy progress_own on public.reading_progress for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy bookmarks_own on public.bookmarks for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy highlights_own on public.highlights for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy settings_own on public.reader_settings for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
revoke all on public.reading_progress,public.bookmarks,public.highlights,public.reader_settings from anon,authenticated;
grant select,insert,update,delete on public.reading_progress,public.bookmarks,public.highlights,public.reader_settings to authenticated;
create index progress_user_recent_idx on public.reading_progress(user_id,last_read_at desc);
create index bookmarks_user_chapter_idx on public.bookmarks(user_id,chapter_id);
create index highlights_user_chapter_idx on public.highlights(user_id,chapter_id);

create or replace function private.validate_progress_chapter() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from public.chapters c where c.id=new.chapter_id and c.novel_id=new.novel_id) then
    raise exception 'Chapter does not belong to this novel' using errcode='23514';
  end if;
  new.last_read_at := now();
  return new;
end $$;
create trigger progress_chapter before insert or update on public.reading_progress for each row execute function private.validate_progress_chapter();

grant all on public.posts,public.likes,public.comments,public.notifications,public.reports,
  public.reading_progress,public.bookmarks,public.highlights,public.reader_settings to service_role;
revoke all on all functions in schema private from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
