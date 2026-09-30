-- Personal inbox clearing and a member-selected favorite novel.
begin;

alter table public.direct_conversations
  add column cleared_for_low_at timestamptz,
  add column cleared_for_high_at timestamptz;
alter table public.direct_messages alter column created_at set default clock_timestamp();

create view public.my_direct_inbox with (security_invoker = true) as
select id, user_low, user_high, last_message_at, last_message_preview, created_at
from public.direct_conversations
where (user_low = auth.uid() and (cleared_for_low_at is null or last_message_at > cleared_for_low_at))
   or (user_high = auth.uid() and (cleared_for_high_at is null or last_message_at > cleared_for_high_at));
revoke all on public.my_direct_inbox from public, anon;
grant select on public.my_direct_inbox to authenticated, service_role;

create or replace function public.clear_direct_conversation(p_conversation uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); cleared_at timestamptz := clock_timestamp();
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  update public.direct_conversations set
    cleared_for_low_at = case when user_low = actor then cleared_at else cleared_for_low_at end,
    cleared_for_high_at = case when user_high = actor then cleared_at else cleared_for_high_at end
    where id = p_conversation and actor in (user_low, user_high);
  if not found then raise exception 'Conversation unavailable' using errcode = '42501'; end if;
  update public.direct_messages set is_read = true
    where conversation_id = p_conversation and recipient_id = actor and created_at <= cleared_at and not is_read;
end $$;
revoke all on function public.clear_direct_conversation(uuid) from public, anon;
grant execute on function public.clear_direct_conversation(uuid) to authenticated;

drop policy direct_messages_participants_read on public.direct_messages;
create policy direct_messages_participants_read on public.direct_messages for select to authenticated
  using (exists (select 1 from public.direct_conversations c where c.id = conversation_id and
    ((auth.uid() = c.user_low and (c.cleared_for_low_at is null or direct_messages.created_at > c.cleared_for_low_at)) or
     (auth.uid() = c.user_high and (c.cleared_for_high_at is null or direct_messages.created_at > c.cleared_for_high_at)))));

drop policy direct_media_read on storage.objects;
create policy direct_media_read on storage.objects for select to authenticated
  using (bucket_id = 'direct-media' and exists (
    select 1 from public.direct_messages m where m.attachment_path = name));

alter table public.profiles add column favorite_novel_id integer references public.novels(id) on delete set null;

create or replace function private.clear_removed_favorite_novel() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set favorite_novel_id = null
    where id = old.user_id and favorite_novel_id = old.novel_id;
  return old;
end $$;
create trigger profile_favorite_removed after delete on public.favorites
  for each row execute function private.clear_removed_favorite_novel();
revoke all on function private.clear_removed_favorite_novel() from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
