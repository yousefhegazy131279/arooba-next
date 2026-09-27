import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../migrations/202609270001_community_reader.sql', import.meta.url), 'utf8');
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';

async function database(keyType = 'bigint') {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$
      select nullif(current_setting('request.jwt.claim.role',true),'') $$;
    grant usage on schema auth, public to anon,authenticated,service_role;
    create table public.profiles(id uuid primary key references auth.users(id),role text default 'user',username text,full_name text,avatar_url text);
    create table public.novels(id ${keyType} primary key);
    create table public.chapters(id ${keyType} primary key,novel_id ${keyType} references public.novels(id),content text);
    grant select on public.profiles, public.novels, public.chapters to anon,authenticated;
    grant insert,update on public.profiles to authenticated;
    alter table public.profiles enable row level security;
    create policy profiles_read on public.profiles for select using(true);
    create policy profiles_insert on public.profiles for insert with check(auth.uid()=id);
    create policy profiles_update on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
    insert into auth.users(id) values ('${alice}'),('${bob}'),('${admin}');
    insert into profiles(id,role,username) values ('${alice}','user','alice'),('${bob}','user','bob'),('${admin}','admin','admin');
  `);
  await db.exec(migration);
  return db;
}

async function as(db, actor, sql, params = []) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)", [actor || '', actor ? 'authenticated' : 'anon']);
  await db.exec(`set role ${actor ? 'authenticated' : 'anon'}`);
  return db.query(sql, params);
}

test('community and reader authorization run against a real PostgreSQL engine', async t => {
  const db = await database();
  let post; let comment; let report;
  try {
    await t.test('anonymous reads allowed, anonymous writes denied', async () => {
      assert.deepEqual((await as(db, null, 'select * from posts')).rows, []);
      await assert.rejects(as(db, null, "insert into posts(content) values ('anonymous')"), /permission denied/);
      await assert.rejects(as(db, null, "select consume_action_rate_limit('reader.progress')"), /permission denied/);
    });
    await t.test('verified owner insert succeeds; impersonation and counter spoofing fail', async () => {
      post = (await as(db, alice, "insert into posts(user_id,content) values ($1,'First post') returning id", [alice])).rows[0].id;
      await assert.rejects(as(db, bob, "insert into posts(user_id,content) values ($1,'Forged')", [alice]), /row-level security/);
      await assert.rejects(as(db, alice, "insert into posts(user_id,content,likes_count) values ($1,'Fake count',99)", [alice]), /permission denied/);
      await assert.rejects(as(db, alice, 'update posts set likes_count=99 where id=$1', [post]), /permission denied/);
      await assert.rejects(as(db, alice, 'update posts set is_hidden=true where id=$1', [post]), /permission denied/);
    });
    await t.test('owners can edit content, unrelated actors cannot change or delete it', async () => {
      assert.equal((await as(db, bob, "update posts set content='Stolen' where id=$1 returning id", [post])).rows.length, 0);
      assert.equal((await as(db, bob, 'delete from posts where id=$1 returning id', [post])).rows.length, 0);
      assert.equal((await as(db, alice, "update posts set content='Edited' where id=$1 returning content", [post])).rows[0].content, 'Edited');
    });
    await t.test('atomic like toggle updates counter and generates one deduplicated notice', async () => {
      assert.deepEqual((await as(db, bob, 'select * from toggle_community_like($1)', [post])).rows[0], { liked: true, likes_count: 1 });
      assert.deepEqual((await as(db, bob, 'select * from toggle_community_like($1)', [post])).rows[0], { liked: false, likes_count: 0 });
      assert.deepEqual((await as(db, bob, 'select * from toggle_community_like($1)', [post])).rows[0], { liked: true, likes_count: 1 });
      assert.equal((await as(db, alice, 'select * from notifications')).rows.length, 1);
      assert.equal((await as(db, bob, 'select * from notifications')).rows.length, 0);
      await assert.rejects(as(db, bob, 'insert into likes(user_id,post_id) values($1,$2)', [bob, post]), /duplicate key/);
      assert.equal((await as(db, bob, 'select likes_count from posts where id=$1', [post])).rows[0].likes_count, 1);
    });
    await t.test('comments maintain exact counts; failed deletion cannot decrement counts', async () => {
      comment = (await as(db, bob, "insert into comments(user_id,post_id,content) values($1,$2,'Comment') returning id", [bob, post])).rows[0].id;
      assert.equal((await as(db, alice, 'select comments_count from posts where id=$1', [post])).rows[0].comments_count, 1);
      assert.equal((await as(db, alice, 'delete from comments where id=$1 returning id', [comment])).rows.length, 0);
      assert.equal((await as(db, alice, 'select comments_count from posts where id=$1', [post])).rows[0].comments_count, 1);
      assert.equal((await as(db, alice, 'select * from notifications')).rows.length, 2);
    });
    await t.test('notification clients may mark read but may not forge contents or ownership', async () => {
      await as(db, alice, 'update notifications set is_read=true');
      assert.ok((await as(db, alice, 'select is_read from notifications')).rows.every(row => row.is_read));
      await assert.rejects(as(db, alice, "update notifications set content='Forged'"), /permission denied/);
      await assert.rejects(as(db, alice, "insert into notifications(user_id,type) values($1,'system')", [alice]), /permission denied/);
    });
    await t.test('reports are unique, actor-bound and set derived flags', async () => {
      report = (await as(db, bob, "insert into reports(reporter_id,post_id,reason) values($1,$2,'Spam report') returning id", [bob, post])).rows[0].id;
      assert.equal((await as(db, bob, 'select is_reported from posts where id=$1', [post])).rows[0].is_reported, true);
      await assert.rejects(as(db, bob, "insert into reports(reporter_id,post_id,reason) values($1,$2,'Again')", [bob, post]), /duplicate key/);
      await assert.rejects(as(db, alice, "update reports set status='reviewed' where id=$1", [report]), /permission denied/);
      assert.equal((await as(db, alice, 'select * from reports')).rows.length, 0);
    });
    await t.test('profile role escalation and non-admin moderation are rejected', async () => {
      await assert.rejects(as(db, bob, "update profiles set role='admin' where id=$1", [bob]), /Role changes require/);
      await assert.rejects(as(db, bob, "select moderate_community_report($1,'hide')", [report]), /Administrator required/);
      await as(db, admin, "select moderate_community_report($1,'hide')", [report]);
    });
    await t.test('hidden posts, likes, comments and related notices do not leak', async () => {
      for (const actor of [null, alice, bob]) {
        for (const table of ['posts', 'comments', 'likes']) {
          assert.equal((await as(db, actor, `select * from ${table}`)).rows.length, 0);
        }
      }
      assert.equal((await as(db, alice, 'select * from notifications')).rows.length, 0);
      await assert.rejects(as(db, bob, 'select * from toggle_community_like($1)', [post]), /Post unavailable/);
      await assert.rejects(as(db, bob, "insert into comments(user_id,post_id,content) values($1,$2,'Hidden')", [bob, post]), /row-level security/);
      assert.equal((await as(db, admin, 'select * from posts')).rows.length, 1);
      assert.equal((await as(db, admin, 'select * from comments')).rows.length, 0);
      await as(db, admin, "select moderate_community_report($1,'restore')", [report]);
      assert.equal((await as(db, null, 'select * from posts')).rows.length, 1);
    });
    await t.test('private durable quota denies excess requests and isolates users', async () => {
      await assert.rejects(as(db, bob, 'select * from private.action_rate_limits'), /permission denied/);
      const results = (await as(db, bob, "select consume_action_rate_limit('reader.progress') as accepted from generate_series(1,121)")).rows;
      assert.equal(results.filter(row => row.accepted).length, 120);
      assert.equal(results[120].accepted, false);
      assert.equal((await as(db, alice, "select consume_action_rate_limit('reader.progress') as accepted")).rows[0].accepted, true);
      await assert.rejects(as(db, bob, "select consume_action_rate_limit('attacker_unlimited')"), /Unknown action/);
      await assert.rejects(as(db, bob, 'select increment_likes_count($1)', [post]), /does not exist/);
    });
    await t.test('database text validation rejects whitespace, oversize and bad report status', async () => {
      await assert.rejects(as(db, alice, "insert into posts(user_id,content) values($1,'   ')", [alice]), /check constraint/);
      await assert.rejects(as(db, alice, "insert into posts(user_id,content) values($1,repeat('a',2001))", [alice]), /check constraint/);
      await assert.rejects(as(db, alice, "insert into comments(user_id,post_id,content) values($1,$2,repeat('a',501))", [alice, post]), /check constraint/);
    });
    await t.test('reader data is private and chapter/novel relationships are validated', async () => {
      await db.exec('reset role');
      await db.exec("insert into novels values(1),(2); insert into chapters values(10,1,'Reader text');");
      await as(db, alice, 'insert into reading_progress(user_id,novel_id,chapter_id,page_number,position) values($1,1,10,2,5)', [alice]);
      assert.equal((await as(db, alice, 'select * from reading_progress')).rows.length, 1);
      assert.equal((await as(db, bob, 'select * from reading_progress')).rows.length, 0);
      await assert.rejects(as(db, bob, 'insert into reading_progress(user_id,novel_id,chapter_id) values($1,1,10)', [alice]), /row-level security/);
      await assert.rejects(as(db, bob, 'insert into reading_progress(user_id,novel_id,chapter_id) values($1,2,10)', [bob]), /Chapter does not belong/);
      await assert.rejects(as(db, alice, 'update reading_progress set user_id=$1', [bob]), /row-level security/);
      await as(db, alice, "insert into bookmarks(user_id,chapter_id,page_number,position,note) values($1,10,1,0,'Note')", [alice]);
      await as(db, alice, "insert into highlights(user_id,chapter_id,text,start_offset,end_offset) values($1,10,'Read',0,4)", [alice]);
      await as(db, alice, 'insert into reader_settings(user_id) values($1)', [alice]);
      for (const table of ['bookmarks', 'highlights', 'reader_settings']) assert.equal((await as(db, bob, `select * from ${table}`)).rows.length, 0);
      await assert.rejects(as(db, alice, "update reader_settings set theme='invalid'"), /check constraint/);
      await assert.rejects(as(db, null, 'select * from reading_progress'), /permission denied/);
    });
    await t.test('delete cascades remove interactions without counter drift', async () => {
      await as(db, bob, 'delete from comments where id=$1', [comment]);
      assert.equal((await as(db, alice, 'select comments_count from posts where id=$1', [post])).rows[0].comments_count, 0);
      await as(db, alice, 'delete from posts where id=$1', [post]);
      await db.exec('reset role');
      for (const table of ['posts', 'likes', 'comments', 'notifications', 'reports']) assert.equal((await db.query(`select * from ${table}`)).rows.length, 0);
    });
  } finally { await db.close(); }
});

test('migration also accepts UUID chapter and novel primary keys', async () => {
  const db = await database('uuid');
  try {
    const columns = await db.query("select data_type from information_schema.columns where table_name='reading_progress' and column_name in ('novel_id','chapter_id')");
    assert.deepEqual(columns.rows.map(row => row.data_type), ['uuid', 'uuid']);
  } finally { await db.close(); }
});
