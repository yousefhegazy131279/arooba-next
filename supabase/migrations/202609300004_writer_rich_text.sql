-- Keep the original plain text for older manuscripts and search, while storing
-- the editor document separately so formatting survives future edits.
alter table public.writer_chapters
  add column if not exists body_rich jsonb;

alter table public.writer_chapters
  add constraint writer_chapters_body_rich_size
  check (body_rich is null or (jsonb_typeof(body_rich) = 'object' and octet_length(body_rich::text) <= 2000000));
