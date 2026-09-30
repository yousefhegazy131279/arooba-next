-- Personal reading shelves and private, chapter-based manuscripts.
begin;

do $$
declare novel_type text;
begin
  select format_type(atttypid, atttypmod) into novel_type from pg_attribute
    where attrelid = 'public.novels'::regclass and attname = 'id' and not attisdropped;
  if novel_type not in ('uuid', 'integer', 'bigint', 'text', 'character varying') then
    raise exception 'Unsupported novel primary key type';
  end if;
  execute format('create table public.library_items (
    user_id uuid not null references auth.users(id) on delete cascade,
    novel_id %s not null references public.novels(id) on delete cascade,
    shelf text not null default ''want_to_read'' check (shelf in (''want_to_read'',''reading'',''finished'')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, novel_id)
  )', novel_type);
end $$;
create index library_items_recent_idx on public.library_items(user_id, updated_at desc);
alter table public.library_items enable row level security;
create policy library_items_owner on public.library_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.library_items from anon, authenticated;
grant select, insert, update, delete on public.library_items to authenticated;
grant all on public.library_items to service_role;

create table public.writer_works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'عمل بلا عنوان' check (char_length(btrim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  community_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index writer_works_recent_idx on public.writer_works(user_id, updated_at desc);
alter table public.writer_works enable row level security;
create policy writer_works_owner on public.writer_works for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.writer_works from anon, authenticated;
grant select, insert, update, delete on public.writer_works to authenticated;
grant all on public.writer_works to service_role;

create table public.writer_chapters (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.writer_works(id) on delete cascade,
  position integer not null check (position between 1 and 500),
  title text not null default 'فصل بلا عنوان' check (char_length(btrim(title)) between 1 and 160),
  body text not null default '' check (char_length(body) <= 500000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_id, position)
);
create index writer_chapters_work_idx on public.writer_chapters(work_id, position);
alter table public.writer_chapters enable row level security;
create policy writer_chapters_owner on public.writer_chapters for all to authenticated
  using (exists (select 1 from public.writer_works w where w.id = work_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.writer_works w where w.id = work_id and w.user_id = auth.uid()));
revoke all on public.writer_chapters from anon, authenticated;
grant select, insert, update, delete on public.writer_chapters to authenticated;
grant all on public.writer_chapters to service_role;

commit;
