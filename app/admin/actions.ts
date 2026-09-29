'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireActionUser, requireAdmin } from '@/lib/actionAuth';
import { entityIdSchema, uuidSchema, parseInput } from '@/lib/validation';

const text = (max: number) => z.string().trim().min(1).max(max);
const mediaUrl = z.union([z.literal(''), z.string().url().refine(url => url.startsWith('https://')), z.string().regex(/^\/(?!\/)/)]);
const novelSchema = z.object({ title: text(250), author: z.string().trim().max(250), category: z.string().trim().max(100), description: z.string().trim().max(20000), cover: mediaUrl, chapters_count: z.number().int().min(0).optional() });
const chapterSchema = z.object({ novel_id: entityIdSchema, chapter_number: z.number().int().min(1), title: text(250), content: text(500000), word_file: mediaUrl.nullable().optional(), image: mediaUrl.nullable().optional() });
function refreshCatalog() { revalidatePath('/'); revalidatePath('/novels'); revalidatePath('/stories', 'layout'); revalidatePath('/sitemap.xml'); revalidatePath('/admin'); }
function fail(error: { message: string } | null) { if (error) throw new Error('تعذّر حفظ أو تحميل البيانات. يرجى المحاولة مجددًا.'); }

export async function getCommunityStats() {
  await requireAdmin('admin.read');
  const queries = [
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('community_role', 'reader'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('community_role', 'writer'),
    supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('author_kind', 'writer').eq('is_hidden', false),
    supabaseAdmin.from('comments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('post_reactions').select('*', { count: 'exact', head: true }).eq('reaction', 'approve'),
    supabaseAdmin.from('post_reactions').select('*', { count: 'exact', head: true }).eq('reaction', 'meh'),
    supabaseAdmin.from('post_reactions').select('*', { count: 'exact', head: true }).eq('reaction', 'boo'),
    supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
  ];
  const results = await Promise.all(queries);
  for (const result of results) fail(result.error);
  const [readers, writers, posts, works, comments, approved, meh, boo, pendingReports, unreadNotifications] = results.map(result => result.count || 0);
  return { readers, writers, posts, works, comments, approved, meh, boo, pendingReports, unreadNotifications };
}

export async function getUsers() {
  await requireAdmin('admin.read');
  const { data: profiles, error } = await supabaseAdmin.from('profiles').select('id,username,full_name,avatar_url,role,created_at');
  fail(error);
  const result = [];
  for (let page = 1; ; page++) {
    const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    fail(authError);
    for (const user of data.users) {
      const profile = profiles?.find(p => p.id === user.id);
      result.push({ id: user.id, email: user.email || '', username: profile?.username || 'مستخدم', full_name: profile?.full_name || '', avatar_url: profile?.avatar_url || '', role: profile?.role || 'user', created_at: profile?.created_at || user.created_at });
    }
    if (data.users.length < 1000) break;
  }
  return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export async function updateUserRole(userId: string, newRole: string) {
  const { user } = await requireAdmin('admin.write');
  const id = parseInput(uuidSchema, userId);
  const role = parseInput(z.enum(['user', 'admin']), newRole);
  if (id === user.id && role !== 'admin') throw new Error('لا يمكنك إزالة صلاحياتك الإدارية من هنا.');
  const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', id);
  fail(error); revalidatePath('/admin'); return { success: true };
}
export async function deleteUser(userId: string) {
  const { user } = await requireAdmin('admin.write');
  const id = parseInput(uuidSchema, userId);
  if (id === user.id) throw new Error('لا يمكنك حذف حسابك من لوحة الإدارة.');
  // Auth foreign keys cascade once; avoid partial profile deletion on failure.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  fail(error); revalidatePath('/admin'); return { success: true };
}
export async function getNovels() {
  await requireAdmin('admin.read');
  const { data, error } = await supabaseAdmin.from('novels').select('*').order('created_at', { ascending: false });
  fail(error); return data || [];
}
export async function createNovel(novel: unknown) {
  await requireAdmin('admin.write');
  const { data, error } = await supabaseAdmin.from('novels').insert(parseInput(novelSchema, novel)).select().single();
  fail(error); refreshCatalog(); return data;
}
export async function updateNovel(id: string, novel: unknown) {
  await requireAdmin('admin.write');
  const { data, error } = await supabaseAdmin.from('novels').update(parseInput(novelSchema.partial(), novel)).eq('id', parseInput(entityIdSchema, id)).select().single();
  fail(error); refreshCatalog(); return data;
}
export async function deleteNovel(id: string) {
  await requireAdmin('admin.write');
  const { error } = await supabaseAdmin.from('novels').delete().eq('id', parseInput(entityIdSchema, id));
  fail(error); refreshCatalog(); return { success: true };
}
export async function getChapters(novelId: string) {
  await requireAdmin('admin.read');
  const { data, error } = await supabaseAdmin.from('chapters').select('*').eq('novel_id', parseInput(entityIdSchema, novelId)).order('chapter_number');
  fail(error); return data || [];
}
export async function createChapter(chapter: unknown) {
  await requireAdmin('admin.write');
  const { data, error } = await supabaseAdmin.from('chapters').insert(parseInput(chapterSchema, chapter)).select().single();
  fail(error); refreshCatalog(); return data;
}
export async function updateChapter(id: string, chapter: unknown) {
  await requireAdmin('admin.write');
  const { data, error } = await supabaseAdmin.from('chapters').update(parseInput(chapterSchema.partial(), chapter)).eq('id', parseInput(entityIdSchema, id)).select().single();
  fail(error); refreshCatalog(); return data;
}
export async function deleteChapter(id: string) {
  await requireAdmin('admin.write');
  const { error } = await supabaseAdmin.from('chapters').delete().eq('id', parseInput(entityIdSchema, id));
  fail(error); refreshCatalog(); return { success: true };
}
export async function getSuggestions() {
  await requireAdmin('admin.read');
  const { data, error } = await supabaseAdmin.from('suggestions').select('*').order('created_at', { ascending: false });
  fail(error); return data || [];
}
export async function deleteSuggestion(id: number) {
  await requireAdmin('admin.write');
  const { error } = await supabaseAdmin.from('suggestions').delete().eq('id', parseInput(z.number().int().positive(), id));
  fail(error); revalidatePath('/admin'); return { success: true };
}
export async function getMessages() {
  await requireAdmin('admin.read');
  const { data, error } = await supabaseAdmin.from('messages').select('*').order('created_at', { ascending: false });
  fail(error); return data || [];
}
export async function updateMessageStatus(id: number, status: string) {
  await requireAdmin('admin.write');
  const { error } = await supabaseAdmin.from('messages').update({ status: parseInput(z.enum(['unread', 'read', 'replied']), status) }).eq('id', parseInput(z.number().int().positive(), id));
  fail(error); revalidatePath('/admin'); return { success: true };
}
export async function deleteMessage(id: number) {
  await requireAdmin('admin.write');
  const { error } = await supabaseAdmin.from('messages').delete().eq('id', parseInput(z.number().int().positive(), id));
  fail(error); revalidatePath('/admin'); return { success: true };
}
async function upload(file: File, bucket: string, document = false) {
  await requireAdmin('admin.upload');
  if (!(file instanceof File) || file.size === 0 || file.size > 4 * 1024 * 1024) throw new Error('الحد الأقصى للملف 4 ميجابايت.');
  const allowed = document ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) throw new Error('نوع الملف غير مدعوم.');
  const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'text/plain': 'txt' };
  const path = crypto.randomUUID() + '.' + extensions[file.type];
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, file, { contentType: file.type });
  fail(error);
  return supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
export async function uploadCover(file: File) { return upload(file, 'covers'); }
export async function uploadChapterFile(file: File) { return upload(file, 'chapters', true); }
export async function uploadChapterImage(file: File) { return upload(file, 'chapter-images'); }

async function favoriteContext(requestedUserId: string, write = false) {
  const ctx = await requireActionUser(write ? 'favorites.write' : undefined);
  if (parseInput(uuidSchema, requestedUserId) !== ctx.user.id) throw new Error('غير مصرح.');
  return ctx;
}
export async function getFavorites(userId: string) {
  const { supabase, user } = await favoriteContext(userId);
  const { data, error } = await supabase.from('favorites').select('id,novel_id,created_at,novels(id,title,author,cover,category,chapters_count)').eq('user_id', user.id).order('created_at', { ascending: false });
  fail(error);
  type Novel = { id: string; title: string; author: string; cover: string; category: string; chapters_count: number };
  return (data || []).flatMap(item => {
    const novel = Array.isArray(item.novels) ? item.novels[0] : item.novels;
    return novel ? [{ id: item.id as string, novel_id: item.novel_id as string, created_at: item.created_at as string, novels: novel as Novel }] : [];
  });
}
export async function addFavorite(userId: string, novelId: string) {
  const { supabase, user } = await favoriteContext(userId, true);
  const { error } = await supabase.from('favorites').insert({ user_id: user.id, novel_id: parseInput(entityIdSchema, novelId) });
  if (error?.code !== '23505') fail(error);
  revalidatePath('/profile/favorites'); return { success: true };
}
export async function removeFavorite(userId: string, novelId: string) {
  const { supabase, user } = await favoriteContext(userId, true);
  const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('novel_id', parseInput(entityIdSchema, novelId));
  fail(error); revalidatePath('/profile/favorites'); return { success: true };
}
export async function isFavorite(userId: string, novelId: string) {
  const { supabase, user } = await favoriteContext(userId);
  const { data, error } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('novel_id', parseInput(entityIdSchema, novelId)).maybeSingle();
  fail(error); return !!data;
}

