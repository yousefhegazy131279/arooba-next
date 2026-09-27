import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import { pageMetadata } from '@/lib/seo';
import ReaderClient from '@/app/components/reader/ReaderClient';

type Props = { params: Promise<{ id: string; chapterId: string }> };

async function getChapter(id: string, chapterId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('chapters').select('id,novel_id,title,content').eq('id', chapterId).eq('novel_id', id).maybeSingle();
  if (error || !data) return null;
  const { data: novel } = await supabase.from('novels').select('title').eq('id', id).maybeSingle();
  return { ...data, novelTitle: novel?.title || 'عُروبة' };
}

export async function generateMetadata({ params }: Props) {
  const { id, chapterId } = await params;
  const chapter = await getChapter(id, chapterId);
  return pageMetadata(chapter ? `${chapter.title} — ${chapter.novelTitle}` : 'الفصل غير موجود', 'قارئ عُروبة التفاعلي', `/stories/${id}/chapters/${chapterId}`, true);
}

export default async function ChapterReaderPage({ params }: Props) {
  const { id, chapterId } = await params;
  const chapter = await getChapter(id, chapterId);
  if (!chapter) notFound();
  return <main style={{ minHeight: 'calc(100vh - 90px)', padding: '24px 0' }}><ReaderClient content={chapter.content || ''} chapterTitle={chapter.title} novelTitle={chapter.novelTitle} chapterId={chapter.id} novelId={chapter.novel_id} /></main>;
}
