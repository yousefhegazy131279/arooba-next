// Explicit, disposable production smoke test. Run with: node --env-file=.env.local supabase/tests/live-social-smoke.mjs --live
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

if (!process.argv.includes('--live')) throw new Error('Pass --live to create and remove disposable QA accounts.');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error('Supabase environment is incomplete.');
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const nonce = randomUUID().slice(0, 8);
const password = `SocialQA!${randomUUID()}z9`;
const ids = [];
const mediaPaths = [];
async function member(index) {
  const email = `qa-social-${nonce}-${index}@example.com`;
  const username = `qa_social_${nonce}_${index}`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username, full_name: `QA Social ${index}` } });
  assert.ifError(created.error);
  ids.push(created.data.user.id);
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const signed = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signed.error);
  return { client, id: created.data.user.id };
}
try {
  const first = await member(1);
  const second = await member(2);
  const follows = await first.client.from('user_follows').insert({ follower_id: first.id, followed_id: second.id });
  assert.ifError(follows.error);
  const notice = await second.client.from('notifications').select('id').eq('user_id', second.id).eq('type', 'follow');
  assert.ifError(notice.error);
  assert.ok(notice.data.length > 0, 'follow notification missing');
  const opened = await first.client.rpc('start_direct_conversation', { p_other: second.id });
  assert.ifError(opened.error);
  assert.ok(opened.data);
  const text = await first.client.from('direct_messages').insert({ conversation_id: opened.data, sender_id: first.id, body: 'رسالة اختبار من عُروبة' }).select('id,recipient_id').single();
  assert.ifError(text.error);
  assert.equal(text.data.recipient_id, second.id);
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF');
  const path = `${opened.data}/${first.id}/${randomUUID()}.pdf`;
  const upload = await first.client.storage.from('direct-media').upload(path, pdf, { contentType: 'application/pdf', upsert: false });
  assert.ifError(upload.error);
  mediaPaths.push(path);
  const attached = await first.client.from('direct_messages').insert({ conversation_id: opened.data, sender_id: first.id, body: '', attachment_path: path, attachment_name: 'رواية-اختبار.pdf', attachment_kind: 'pdf', attachment_size: pdf.length }).select('id').single();
  assert.ifError(attached.error);
  const inbox = await second.client.from('direct_messages').select('id,attachment_path,is_read').eq('conversation_id', opened.data);
  assert.ifError(inbox.error);
  assert.equal(inbox.data.length, 2);
  const signedUrl = await second.client.storage.from('direct-media').createSignedUrl(path, 60);
  assert.ifError(signedUrl.error);
  assert.ok(signedUrl.data.signedUrl);
  const read = await second.client.from('direct_messages').update({ is_read: true }).eq('recipient_id', second.id).eq('conversation_id', opened.data);
  assert.ifError(read.error);
  const receipt = await first.client.from('direct_messages').select('is_read').eq('id', text.data.id).single();
  assert.ifError(receipt.error);
  assert.equal(receipt.data.is_read, true);
  const block = await second.client.from('user_blocks').insert({ blocker_id: second.id, blocked_id: first.id });
  assert.ifError(block.error);
  const forbidden = await first.client.from('direct_messages').insert({ conversation_id: opened.data, sender_id: first.id, body: 'يجب رفض هذه الرسالة' });
  assert.ok(forbidden.error, 'blocked member could send');
  console.log('PASS live follow, notification, private PDF, message, read receipt and block');
} finally {
  for (const path of mediaPaths) await admin.storage.from('direct-media').remove([path]);
  for (const id of ids.reverse()) {
    const deleted = await admin.auth.admin.deleteUser(id);
    if (deleted.error) console.error(`QA cleanup failed for ${id}: ${deleted.error.message}`);
  }
}
