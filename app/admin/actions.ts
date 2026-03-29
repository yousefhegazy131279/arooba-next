"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// ---- المستخدمين ----
export async function getUsers() {
  const { data, error } = await supabaseAdmin
    .from("users_with_emails")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateUserRole(userId: string, newRole: string) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteUser(userId: string) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ---- الروايات ----
export async function getNovels() {
  const { data, error } = await supabaseAdmin
    .from("novels")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createNovel(novel: any) {
  const { data, error } = await supabaseAdmin
    .from("novels")
    .insert([novel])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateNovel(id: string, novel: any) {
  const { data, error } = await supabaseAdmin
    .from("novels")
    .update(novel)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteNovel(id: string) {
  const { error } = await supabaseAdmin
    .from("novels")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ---- الفصول ----
export async function getChapters(novelId: string) {
  const { data, error } = await supabaseAdmin
    .from("chapters")
    .select("*")
    .eq("novel_id", novelId)
    .order("chapter_number", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createChapter(chapter: any) {
  const { data, error } = await supabaseAdmin
    .from("chapters")
    .insert([chapter])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteChapter(id: string) {
  const { error } = await supabaseAdmin
    .from("chapters")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ---- الاقتراحات ----
export async function getSuggestions() {
  const { data, error } = await supabaseAdmin
    .from("suggestions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteSuggestion(id: number) {
  const { error } = await supabaseAdmin
    .from("suggestions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ---- الرسائل ----
export async function getMessages() {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateMessageStatus(id: number, status: string) {
  const { error } = await supabaseAdmin
    .from("messages")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteMessage(id: number) {
  const { error } = await supabaseAdmin
    .from("messages")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ---- رفع الملفات ----
// دالة مساعدة لتنظيف اسم الملف
function sanitizeFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  const name = lastDot === -1 ? fileName : fileName.slice(0, lastDot);
  const ext = lastDot === -1 ? '' : fileName.slice(lastDot);
  // تنظيف الاسم: إزالة الأحرف غير المسموح بها (يحافظ على العربية واللاتينية والأرقام)
  const cleanName = name
    .replace(/[^\w\u0600-\u06FF\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}_${cleanName || 'file'}${ext}`;
}

export async function uploadCover(file: File): Promise<string> {
  console.log("Starting uploadCover for file:", file.name, "size:", file.size);

  // التحقق من وجود bucket
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    console.error("listBuckets error:", listError);
    throw new Error("فشل الاتصال بـ Supabase Storage: " + listError.message);
  }
  const bucketExists = buckets?.some(b => b.name === "covers");
  if (!bucketExists) {
    // محاولة إنشاء bucket
    const { error: createError } = await supabaseAdmin.storage.createBucket("covers", { public: true });
    if (createError) {
      console.error("createBucket error:", createError);
      throw new Error("Bucket 'covers' غير موجود ولم نتمكن من إنشائه: " + createError.message);
    }
  }

  const safeName = sanitizeFileName(file.name);
  const { error: uploadError } = await supabaseAdmin.storage
    .from("covers")
    .upload(safeName, file);
  if (uploadError) {
    console.error("upload error:", uploadError);
    throw new Error(uploadError.message);
  }

  const { data: publicUrl } = supabaseAdmin.storage.from("covers").getPublicUrl(safeName);
  return publicUrl.publicUrl;
}

export async function uploadChapterFile(file: File): Promise<string> {
  // التحقق من وجود bucket chapters (اختياري)
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (!listError && !buckets?.some(b => b.name === "chapters")) {
    const { error: createError } = await supabaseAdmin.storage.createBucket("chapters", { public: true });
    if (createError) {
      console.error("createBucket error for chapters:", createError);
      // لا نلقي خطأ، فقط نكمل محاولة الرفع (سيظهر خطأ لاحقاً إذا لم ينجح)
    }
  }

  const safeName = sanitizeFileName(file.name);
  const { error } = await supabaseAdmin.storage
    .from("chapters")
    .upload(safeName, file);
  if (error) throw new Error(error.message);
  const { data: publicUrl } = supabaseAdmin.storage.from("chapters").getPublicUrl(safeName);
  return publicUrl.publicUrl;
}