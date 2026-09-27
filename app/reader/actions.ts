'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireActionUser } from '@/lib/actionAuth';
import { entityIdSchema, uuidSchema, parseInput } from '@/lib/validation';
import { normalizeReaderContent, type ReaderState, type Bookmark, type Highlight, type ReaderSettings } from '@/lib/reader';

const settingsSchema = z.object({
  font_size: z.enum(['small', 'medium', 'large']),
  font_family: z.enum(['Cairo', 'Amiri', 'sans-serif']),
  theme: z.enum(['light', 'dark', 'sepia']),
  brightness: z.number().int().min(40).max(100),
});
const positionSchema = z.number().int().min(0).max(100_000_000);
const pageSchema = z.number().int().min(1).max(1_000_000);

async function readerUser(expectedUserId: string, bucket?: string) {
  const expected = parseInput(uuidSchema, expectedUserId);
  const auth = await requireActionUser(bucket);
  // A queued save from a previous account must never be applied to the new account.
  if (auth.user.id !== expected) throw new Error('تغير الحساب. أعد فتح القارئ للمزامنة.');
  return auth;
}
async function chapterSource(supabase: Awaited<ReturnType<typeof requireActionUser>>['supabase'], chapterId: string) {
  const { data, error } = await supabase.from('chapters').select('novel_id,content,word_file').eq('id', chapterId).single();
  if (error || !data) throw new Error('تعذر العثور على الفصل.');
  return { novelId: String(data.novel_id), text: normalizeReaderContent(data.content || ''), hasPdf: Boolean(data.word_file) };
}

export async function getReaderState(chapterId: string, expectedUserId: string): Promise<ReaderState> {
  const chapter = parseInput(entityIdSchema, chapterId);
  const { supabase, user } = await readerUser(expectedUserId);
  const results = await Promise.all([
    supabase.from('reader_settings').select('font_size,font_family,theme,brightness').eq('user_id', user.id).maybeSingle(),
    supabase.from('reading_progress').select('position,page_number').eq('user_id', user.id).eq('chapter_id', chapter).maybeSingle(),
    supabase.from('bookmarks').select('id,page_number,position,note').eq('user_id', user.id).eq('chapter_id', chapter).order('created_at', { ascending: false }),
    supabase.from('highlights').select('id,text,color,start_offset,end_offset').eq('user_id', user.id).eq('chapter_id', chapter).order('created_at', { ascending: true }),
  ]);
  if (results.some(result => result.error)) throw new Error('تعذرت مزامنة بيانات القارئ. حاول مجدداً.');
  return { settings: results[0].data as ReaderSettings | null, progress: results[1].data as ReaderState['progress'], bookmarks: (results[2].data || []) as Bookmark[], highlights: (results[3].data || []) as Highlight[] };
}

export async function saveReadingProgress(input: { chapterId: string; novelId: string; position: number; page: number }, expectedUserId: string) {
  const value = parseInput(z.object({ chapterId: entityIdSchema, novelId: entityIdSchema, position: positionSchema, page: pageSchema }), input);
  const { supabase, user } = await readerUser(expectedUserId, 'reader.progress');
  const chapter = await chapterSource(supabase, value.chapterId);
  if (chapter.novelId !== value.novelId || (!chapter.hasPdf && value.position > chapter.text.length)) throw new Error('موضع القراءة غير صالح.');
  const { error } = await supabase.from('reading_progress').upsert({ user_id: user.id, novel_id: value.novelId, chapter_id: value.chapterId, position: value.position, page_number: value.page, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,chapter_id' });
  if (error) throw new Error('لم يتم حفظ موضع القراءة.');
}

export async function saveReaderSettings(input: ReaderSettings, expectedUserId: string) {
  const value = parseInput(settingsSchema, input);
  const { supabase, user } = await readerUser(expectedUserId, 'reader.settings');
  const { error } = await supabase.from('reader_settings').upsert({ ...value, user_id: user.id, updated_at: new Date().toISOString() });
  if (error) throw new Error('لم يتم حفظ إعدادات القارئ.');
}

export async function addBookmark(input: { chapterId: string; page: number; position: number; note: string }, expectedUserId: string): Promise<Bookmark> {
  const value = parseInput(z.object({ chapterId: entityIdSchema, page: pageSchema, position: positionSchema, note: z.string().trim().max(500) }), input);
  const { supabase, user } = await readerUser(expectedUserId, 'reader.bookmark');
  const chapter = await chapterSource(supabase, value.chapterId);
  if (!chapter.hasPdf && value.position > chapter.text.length) throw new Error('موضع الفاصل غير صالح.');
  const { data, error } = await supabase.from('bookmarks').insert({ user_id: user.id, chapter_id: value.chapterId, page_number: value.page, position: value.position, note: value.note }).select('id,page_number,position,note').single();
  if (error) throw new Error('لم تتم إضافة الفاصل.');
  revalidatePath('/profile');
  return data as Bookmark;
}

export async function deleteBookmark(bookmarkId: string, expectedUserId: string) {
  const id = parseInput(uuidSchema, bookmarkId);
  const { supabase, user } = await readerUser(expectedUserId, 'reader.delete');
  const { error } = await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw new Error('لم يتم حذف الفاصل.');
  revalidatePath('/profile');
}

export async function addHighlight(input: { chapterId: string; start: number; end: number; color: Highlight['color'] }, expectedUserId: string): Promise<Highlight> {
  const value = parseInput(z.object({ chapterId: entityIdSchema, start: positionSchema, end: positionSchema, color: z.enum(['yellow', 'green', 'blue', 'pink']) }).refine(data => data.end > data.start && data.end - data.start <= 5000), input);
  const { supabase, user } = await readerUser(expectedUserId, 'reader.highlight');
  const chapter = await chapterSource(supabase, value.chapterId);
  if (value.end > chapter.text.length) throw new Error('النص المحدد غير صالح.');
  const { data, error } = await supabase.from('highlights').insert({ user_id: user.id, chapter_id: value.chapterId, text: chapter.text.slice(value.start, value.end), start_offset: value.start, end_offset: value.end, color: value.color }).select('id,text,color,start_offset,end_offset').single();
  if (error) throw new Error('لم يتم حفظ التظليل.');
  return data as Highlight;
}

export async function deleteHighlight(highlightId: string, expectedUserId: string) {
  const id = parseInput(uuidSchema, highlightId);
  const { supabase, user } = await readerUser(expectedUserId, 'reader.delete');
  const { error } = await supabase.from('highlights').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw new Error('لم يتم حذف التظليل.');
}
