// Explicit production smoke test with disposable accounts. Run: node --env-file=.env.local supabase/tests/live-library-writer-smoke.mjs --live
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Document, Packer, Paragraph } from 'docx';

if (!process.argv.includes('--live')) throw new Error('Pass --live to create and remove disposable QA accounts.');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error('Supabase environment is incomplete.');
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const nonce = randomUUID().slice(0, 8);
const password = `WriterQA!${randomUUID()}z9`;
const ids = [];
const mediaPaths = [];
async function member(index) {
  const email = `qa-library-${nonce}-${index}@example.com`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username: `qa_library_${nonce}_${index}` } });
  assert.ifError(created.error);
  ids.push(created.data.user.id);
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const signed = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signed.error);
  return { client, id: created.data.user.id };
}
try {
  const { data: novels, error: novelsError } = await admin.from('novels').select('id').limit(1);
  assert.ifError(novelsError);
  assert.ok(novels?.length, 'No novels available for the saved shelf test');
  const first = await member(1);
  const second = await member(2);
  const saved = await first.client.from('library_items').insert({ user_id: first.id, novel_id: novels[0].id }).select('shelf').single();
  assert.ifError(saved.error);
  assert.equal(saved.data.shelf, 'want_to_read');
  const hiddenShelf = await second.client.from('library_items').select('novel_id');
  assert.ifError(hiddenShelf.error);
  assert.equal(hiddenShelf.data.length, 0);
  const work = await first.client.from('writer_works').insert({ user_id: first.id, title: 'رواية اختبار خاصة' }).select('id').single();
  assert.ifError(work.error);
  const chapter = await first.client.from('writer_chapters').insert({ work_id: work.data.id, position: 1, title: 'البداية', body: 'نص عربي للاختبار', body_rich: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'نص عربي للاختبار', marks: [{ type: 'bold' }] }] }] } }).select('id,body_rich').single();
  assert.ifError(chapter.error);
  assert.equal(chapter.data.body_rich.content[0].content[0].marks[0].type, 'bold');
  const stolen = await second.client.from('writer_chapters').select('body').eq('work_id', work.data.id);
  assert.ifError(stolen.error);
  assert.equal(stolen.data.length, 0);
  const forged = await second.client.from('writer_chapters').insert({ work_id: work.data.id, position: 2, title: 'فصل مزور' });
  assert.ok(forged.error);
  const updated = await first.client.from('writer_chapters').update({ body: 'نص عربي جديد' }).eq('id', chapter.data.id).select('body').single();
  assert.ifError(updated.error);
  assert.equal(updated.data.body, 'نص عربي جديد');
  const role = await first.client.from('profiles').update({ community_role: 'writer' }).eq('id', first.id).select('community_role').single();
  assert.ifError(role.error);
  const document = new Document({ sections: [{ children: [new Paragraph('رواية اختبار'), new Paragraph('نص عربي جديد')] }] });
  const path = `${first.id}/${randomUUID()}.docx`;
  const upload = await first.client.storage.from('community-media').upload(path, await Packer.toBuffer(document), { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', upsert: false });
  assert.ifError(upload.error);
  mediaPaths.push(path);
  const published = await first.client.from('posts').insert({ user_id: first.id, content: 'رواية اختبار مؤقتة', attachments: [{ path, name: 'رواية-اختبار.docx', type: 'docx' }] }).select('id,attachments').single();
  assert.ifError(published.error);
  assert.equal(published.data.attachments[0].path, path);
  const linked = await first.client.from('writer_works').update({ community_post_id: published.data.id }).eq('id', work.data.id).select('community_post_id').single();
  assert.ifError(linked.error);
  assert.equal(linked.data.community_post_id, published.data.id);
  console.log('PASS live saved shelf, private manuscript, owner writes and community DOCX publishing');
} finally {
  for (const path of mediaPaths) await admin.storage.from('community-media').remove([path]);
  for (const id of ids.reverse()) {
    const deleted = await admin.auth.admin.deleteUser(id);
    if (deleted.error) console.error(`QA cleanup failed for ${id}: ${deleted.error.message}`);
  }
}
