'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  uuidSchema,
  entityIdSchema,
  parseInput,
} from '@/lib/validation';

/* ==========================================================
   1) المستخدمون
   ========================================================== */
export async function getUsers() {
  try {
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Auth error in getUsers:', authError);
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authUsers || !authUsers.users) return [];

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Profiles error in getUsers:', profilesError);
      throw new Error(`Profiles error: ${profilesError.message}`);
    }

    const users = authUsers.users.map((authUser) => {
      const profile = profiles?.find((p) => p.id === authUser.id) || {};
      return {
        id: authUser.id,
        email: authUser.email || '',
        username:
          profile.username ||
          authUser.email?.split('@')[0] ||
          'مستخدم',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        role: profile.role || 'user',
        created_at: profile.created_at || authUser.created_at,
      };
    });

    return users.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error: any) {
    console.error('Unexpected error in getUsers:', error);
    throw new Error(error.message || 'فشل تحميل المستخدمين');
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  const uid = parseInput(uuidSchema, userId);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', uid);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteUser(userId: string) {
  const uid = parseInput(uuidSchema, userId);

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', uid);

  if (profileError) throw new Error(profileError.message);

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(uid);
  if (authError) throw new Error(authError.message);

  return { success: true };
}

/* ==========================================================
   2) الروايات
   ========================================================== */
export async function getNovels() {
  const { data, error } = await supabaseAdmin
    .from('novels')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createNovel(novel: any) {
  const { data, error } = await supabaseAdmin
    .from('novels')
    .insert([novel])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateNovel(id: string | number, novel: any) {
  const nid = parseInput(entityIdSchema, id);

  const { data, error } = await supabaseAdmin
    .from('novels')
    .update(novel)
    .eq('id', nid)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteNovel(id: string | number) {
  const nid = parseInput(entityIdSchema, id);

  const { error } = await supabaseAdmin
    .from('novels')
    .delete()
    .eq('id', nid);

  if (error) throw new Error(error.message);
  return { success: true };
}

/* ==========================================================
   3) الفصول
   ========================================================== */
export async function getChapters(novelId: string | number) {
  const nid = parseInput(entityIdSchema, novelId);

  const { data, error } = await supabaseAdmin
    .from('chapters')
    .select('*')
    .eq('novel_id', nid)
    .order('chapter_number', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createChapter(chapter: any) {
  const { data, error } = await supabaseAdmin
    .from('chapters')
    .insert([chapter])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateChapter(id: string | number, chapter: any) {
  const cid = parseInput(entityIdSchema, id);

  const { data, error } = await supabaseAdmin
    .from('chapters')
    .update(chapter)
    .eq('id', cid)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteChapter(id: string | number) {
  const cid = parseInput(entityIdSchema, id);

  const { error } = await supabaseAdmin
    .from('chapters')
    .delete()
    .eq('id', cid);

  if (error) throw new Error(error.message);
  return { success: true };
}

/* ==========================================================
   4) الاقتراحات
   ========================================================== */
export async function getSuggestions() {
  const { data, error } = await supabaseAdmin
    .from('suggestions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteSuggestion(id: number) {
  const { error } = await supabaseAdmin
    .from('suggestions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

/* ==========================================================
   5) الرسائل
   ========================================================== */
export async function getMessages() {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateMessageStatus(id: number, status: string) {
  const { error } = await supabaseAdmin
    .from('messages')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteMessage(id: number) {
  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

/* ==========================================================
   6) رفع الملفات
   ========================================================== */
function sanitizeFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  const name = lastDot === -1 ? fileName : fileName.slice(0, lastDot);
  const ext = lastDot === -1 ? '' : fileName.slice(lastDot);
  const cleanName = name
    .replace(/[^\w\u0600-\u06FF\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}_${cleanName || 'file'}${ext}`;
}

export async function uploadCover(file: File): Promise<string> {
  console.log('Starting uploadCover for file:', file.name, 'size:', file.size);

  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) {
    console.error('listBuckets error:', listError);
    throw new Error(
      'فشل الاتصال بـ Supabase Storage: ' + listError.message
    );
  }

  const bucketExists = buckets?.some((b) => b.name === 'covers');
  if (!bucketExists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      'covers',
      { public: true }
    );
    if (createError) {
      console.error('createBucket error:', createError);
      throw new Error(
        "Bucket 'covers' غير موجود ولم نتمكن من إنشائه: " +
          createError.message
      );
    }
  }

  const safeName = sanitizeFileName(file.name);
  const { error: uploadError } = await supabaseAdmin.storage
    .from('covers')
    .upload(safeName, file);

  if (uploadError) {
    console.error('upload error:', uploadError);
    throw new Error(uploadError.message);
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from('covers')
    .getPublicUrl(safeName);

  return publicUrl.publicUrl;
}

export async function uploadChapterFile(file: File): Promise<string> {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (!listError && !buckets?.some((b) => b.name === 'chapters')) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      'chapters',
      { public: true }
    );
    if (createError) {
      console.error('createBucket error for chapters:', createError);
    }
  }

  const safeName = sanitizeFileName(file.name);
  const { error } = await supabaseAdmin.storage
    .from('chapters')
    .upload(safeName, file);

  if (error) throw new Error(error.message);

  const { data: publicUrl } = supabaseAdmin.storage
    .from('chapters')
    .getPublicUrl(safeName);

  return publicUrl.publicUrl;
}

export async function uploadChapterImage(file: File): Promise<string> {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (!listError && !buckets?.some((b) => b.name === 'chapter-images')) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      'chapter-images',
      { public: true }
    );
    if (createError) {
      console.error(
        'createBucket error for chapter-images:',
        createError
      );
      throw new Error(
        'لم نتمكن من إنشاء bucket لصور الفصول: ' + createError.message
      );
    }
  }

  const safeName = sanitizeFileName(file.name);
  const { error } = await supabaseAdmin.storage
    .from('chapter-images')
    .upload(safeName, file);

  if (error) throw new Error(error.message);

  const { data: publicUrl } = supabaseAdmin.storage
    .from('chapter-images')
    .getPublicUrl(safeName);

  return publicUrl.publicUrl;
}

/* ==========================================================
   7) المفضلات
   ========================================================== */
export async function getFavorites(userId: string) {
  const uid = parseInput(uuidSchema, userId);

  const { data, error } = await supabaseAdmin
    .from('favorites')
    .select(
      `
      id,
      novel_id,
      created_at,
      novels (
        id,
        title,
        author,
        cover,
        category,
        chapters_count
      )
    `
    )
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((item: any) => ({
    id: item.id,
    novel_id: item.novel_id,
    created_at: item.created_at,
    novels: item.novels,
  }));
}

export async function addFavorite(
  userId: string,
  novelId: string | number
) {
  const uid = parseInput(uuidSchema, userId);
  const nid = parseInput(entityIdSchema, novelId);

  const { error } = await supabaseAdmin
    .from('favorites')
    .insert({ user_id: uid, novel_id: nid });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function removeFavorite(
  userId: string,
  novelId: string | number
) {
  const uid = parseInput(uuidSchema, userId);
  const nid = parseInput(entityIdSchema, novelId);

  const { error } = await supabaseAdmin
    .from('favorites')
    .delete()
    .eq('user_id', uid)
    .eq('novel_id', nid);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function isFavorite(
  userId: string,
  novelId: string | number
) {
  const uid = parseInput(uuidSchema, userId);
  const nid = parseInput(entityIdSchema, novelId);

  const { data, error } = await supabaseAdmin
    .from('favorites')
    .select('id')
    .eq('user_id', uid)
    .eq('novel_id', nid)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}