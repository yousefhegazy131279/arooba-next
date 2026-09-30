import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../migrations/202609300003_library_writer.sql', import.meta.url), 'utf8');
const richMigration = await readFile(new URL('../migrations/202609300004_writer_rich_text.sql', import.meta.url), 'utf8');
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';

async function as(db, actor, sql, params = []) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [actor || '']);
  await db.exec(`set role ${actor ? 'authenticated' : 'anon'}`);
  return db.query(sql, params);
}

test('library shelves and manuscripts stay private to their owner', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth, public to anon,authenticated,service_role;
      create table public.novels(id bigint primary key);
      create table public.posts(id uuid primary key);
      insert into auth.users(id) values ('${alice}'),('${bob}');
      insert into novels(id) values (4);
    `);
    await db.exec(migration);
    await db.exec(richMigration);
    const shelf = await as(db, alice, 'insert into library_items(user_id,novel_id) values($1,4) returning shelf', [alice]);
    assert.equal(shelf.rows[0].shelf, 'want_to_read');
    assert.equal((await as(db, bob, 'select * from library_items')).rows.length, 0);
    await assert.rejects(as(db, bob, 'insert into library_items(user_id,novel_id) values($1,4)', [alice]), /row-level security/);
    await assert.rejects(as(db, null, 'select * from library_items'), /permission denied/);

    const work = (await as(db, alice, "insert into writer_works(user_id,title) values($1,'رواية خاصة') returning id", [alice])).rows[0].id;
    const chapter = (await as(db, alice, "insert into writer_chapters(work_id,position,title,body) values($1,1,'الفصل الأول','النص') returning id", [work])).rows[0].id;
    assert.equal((await as(db, bob, 'select * from writer_works')).rows.length, 0);
    assert.equal((await as(db, bob, 'select * from writer_chapters')).rows.length, 0);
    await assert.rejects(as(db, bob, "insert into writer_chapters(work_id,position,title) values($1,2,'مسروق')", [work]), /row-level security/);
    assert.equal((await as(db, bob, "update writer_chapters set body='تعديل' where id=$1 returning id", [chapter])).rows.length, 0);
    assert.equal((await as(db, alice, "update writer_chapters set body='نص جديد' where id=$1 returning body", [chapter])).rows[0].body, 'نص جديد');
    const rich = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'نص جديد', marks: [{ type: 'bold' }] }] }] };
    assert.deepEqual((await as(db, alice, 'update writer_chapters set body_rich=$2 where id=$1 returning body_rich', [chapter, rich])).rows[0].body_rich, rich);
    assert.equal((await as(db, bob, 'select body_rich from writer_chapters where id=$1', [chapter])).rows.length, 0);
    await assert.rejects(as(db, alice, "insert into writer_chapters(work_id,position,title,body) values($1,2,'طويل',$2)", [work, 'x'.repeat(500001)]), /check constraint/);
  } finally {
    await db.close();
  }
});
