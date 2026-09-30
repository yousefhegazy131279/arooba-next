import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const migrations = await Promise.all([
  '../migrations/202609270001_community_reader.sql',
  '../migrations/202609290001_community_creators.sql',
  '../migrations/202609300001_social_direct_messages.sql',
].map(path => readFile(new URL(path, import.meta.url), 'utf8')));
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const eve = '33333333-3333-4333-8333-333333333333';

async function as(db, actor, sql, params = []) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)", [actor || '', actor ? 'authenticated' : 'anon']);
  await db.exec(`set role ${actor ? 'authenticated' : 'anon'}`);
  return db.query(sql, params);
}

test('private messaging enforces membership, media ownership, read receipts and blocking', async () => {
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
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb default '{}'::jsonb);
      alter table storage.objects enable row level security;
      grant usage on schema auth,public,storage to anon,authenticated,service_role;
      grant insert,select,delete on storage.objects to authenticated;
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
    for (const migration of migrations) await db.exec(migration);
    await assert.rejects(as(db, alice, 'insert into user_follows(follower_id,followed_id) values($1,$2)', [bob, eve]), /row-level security/);
    await as(db, alice, 'insert into user_follows(follower_id,followed_id) values($1,$2)', [alice, bob]);
    assert.equal((await as(db, bob, "select count(*)::int as n from notifications where type='follow'")).rows[0].n, 1);
    const conversation = (await as(db, alice, 'select start_direct_conversation($1) as id', [bob])).rows[0].id;
    assert.equal((await as(db, eve, 'select * from direct_conversations')).rows.length, 0);
    await assert.rejects(as(db, eve, 'select start_direct_conversation($1)', [eve]), /Invalid conversation/);
    const message = (await as(db, alice, "insert into direct_messages(conversation_id,sender_id,body) values($1,$2,'Hello') returning id,recipient_id", [conversation, alice])).rows[0];
    assert.equal(message.recipient_id, bob);
    assert.equal((await as(db, eve, 'select * from direct_messages')).rows.length, 0);
    await assert.rejects(as(db, eve, "insert into direct_messages(conversation_id,sender_id,body) values($1,$2,'Intrusion')", [conversation, eve]), /Conversation unavailable|row-level security/);
    assert.equal((await as(db, alice, 'update direct_messages set is_read=true where id=$1 returning id', [message.id])).rows.length, 0);
    assert.equal((await as(db, bob, 'update direct_messages set is_read=true where id=$1 returning is_read', [message.id])).rows[0].is_read, true);
    const mediaPath = `${conversation}/${alice}/44444444-4444-4444-8444-444444444444.pdf`;
    await as(db, alice, 'insert into storage.objects(bucket_id,name,owner_id,metadata) values($1,$2,$3,$4::jsonb)', ['direct-media', mediaPath, alice, JSON.stringify({ mimetype: 'application/pdf' })]);
    assert.equal((await as(db, eve, 'select * from storage.objects where bucket_id=$1', ['direct-media'])).rows.length, 0);
    await assert.rejects(as(db, bob, 'insert into direct_messages(conversation_id,sender_id,attachment_path,attachment_name,attachment_kind,attachment_size) values($1,$2,$3,$4,$5,$6)', [conversation, bob, mediaPath, 'stolen.pdf', 'pdf', 100]), /Invalid message attachment/);
    await as(db, alice, 'insert into direct_messages(conversation_id,sender_id,attachment_path,attachment_name,attachment_kind,attachment_size) values($1,$2,$3,$4,$5,$6)', [conversation, alice, mediaPath, 'story.pdf', 'pdf', 100]);
    await as(db, bob, 'insert into user_blocks(blocker_id,blocked_id) values($1,$2)', [bob, alice]);
    assert.equal((await as(db, alice, 'select * from user_follows')).rows.length, 0);
    await assert.rejects(as(db, alice, "insert into direct_messages(conversation_id,sender_id,body) values($1,$2,'Blocked')", [conversation, alice]), /Messaging unavailable/);
    await assert.rejects(as(db, alice, 'insert into user_follows(follower_id,followed_id) values($1,$2)', [alice, bob]), /Follow unavailable/);
  } finally { await db.close(); }
});
