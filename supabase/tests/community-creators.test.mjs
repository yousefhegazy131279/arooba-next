import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const base = await readFile(new URL('../migrations/202609270001_community_reader.sql', import.meta.url), 'utf8');
const creators = await readFile(new URL('../migrations/202609290001_community_creators.sql', import.meta.url), 'utf8');
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const eve = '33333333-3333-4333-8333-333333333333';

async function as(db, actor, sql, params = []) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)", [actor || '', actor ? 'authenticated' : 'anon']);
  await db.exec(`set role ${actor ? 'authenticated' : 'anon'}`);
  return db.query(sql, params);
}

test('creator migration enforces publishing, media ownership and reader votes', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role',true),'') $$;
      create function storage.foldername(path text) returns text[] language sql immutable as $$ select string_to_array(path, '/') $$;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
      alter table storage.objects enable row level security;
      grant usage on schema auth,public,storage to anon,authenticated,service_role;
      grant insert,delete on storage.objects to authenticated;
      create table public.profiles(id uuid primary key references auth.users(id),role text default 'user',username text,full_name text,avatar_url text);
      create table public.novels(id bigint primary key);
      create table public.chapters(id bigint primary key,novel_id bigint references novels(id),content text);
      grant select on public.profiles,public.novels,public.chapters to anon,authenticated;
      grant insert,update on public.profiles to authenticated;
      alter table public.profiles enable row level security;
      create policy profiles_read on public.profiles for select using(true);
      create policy profiles_update on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
      insert into auth.users(id) values ('${alice}'),('${bob}'),('${eve}');
      insert into profiles(id,role,username) values ('${alice}','user','alice'),('${bob}','user','bob'),('${eve}','user','eve');
    `);
    await db.exec(base);
    await db.exec(creators);
    await assert.rejects(as(db, alice, "insert into posts(user_id,content) values($1,'Before choice')", [alice]), /Choose reader or writer/);
    await as(db, alice, "update profiles set community_role='writer' where id=$1", [alice]);
    await as(db, bob, "update profiles set community_role='reader' where id=$1", [bob]);
    await as(db, eve, "update profiles set community_role='writer' where id=$1", [eve]);
    const pdfPath = `${alice}/44444444-4444-4444-8444-444444444444.pdf`;
    await as(db, alice, 'insert into storage.objects(bucket_id,name,owner_id) values($1,$2,$3)', ['community-media', pdfPath, alice]);
    const attachment = JSON.stringify([{ path: pdfPath, name: 'روايتي.pdf', type: 'pdf' }]);
    const post = (await as(db, alice, "insert into posts(user_id,content,attachments) values($1,'My book',$2::jsonb) returning id,author_kind", [alice, attachment])).rows[0];
    assert.equal(post.author_kind, 'writer');
    await assert.rejects(as(db, eve, "insert into posts(user_id,content,attachments) values($1,'Stolen',$2::jsonb)", [eve, attachment]), /Invalid attachment ownership/);
    const readerPath = `${bob}/55555555-5555-4555-8555-555555555555.pdf`;
    await as(db, bob, 'insert into storage.objects(bucket_id,name,owner_id) values($1,$2,$3)', ['community-media', readerPath, bob]);
    await assert.rejects(as(db, bob, "insert into posts(user_id,content,attachments) values($1,'Reader book',$2::jsonb)", [bob, JSON.stringify([{ path: readerPath, name: 'Test.pdf', type: 'pdf' }])]), /Only writers/);
    await assert.rejects(as(db, alice, 'insert into post_reactions(post_id,user_id,reaction) values($1,$2,$3)', [post.id, alice, 'approve']), /row-level security/);
    await as(db, bob, 'insert into post_reactions(post_id,user_id,reaction) values($1,$2,$3)', [post.id, bob, 'approve']);
    assert.equal((await as(db, alice, "select count(*)::int as n from notifications where type='system'")).rows[0].n, 1);
    await as(db, bob, 'update post_reactions set reaction=$1 where post_id=$2', ['meh', post.id]);
    assert.equal((await as(db, null, 'select reaction from post_reactions')).rows[0].reaction, 'meh');
    assert.equal((await as(db, eve, 'update post_reactions set reaction=$1 where post_id=$2 returning post_id', ['boo', post.id])).rows.length, 0);
  } finally { await db.close(); }
});
