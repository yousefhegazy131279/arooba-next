import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import { pageMetadata } from '@/lib/seo';
import ReaderClient from '@/app/components/reader/ReaderClient';

type Props = { params: Promise<{ id: string; chapterId: string }> };

async function getChapter(id: string, chapterId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('chapters').select('id,novel_id,title,content,word_file').eq('id', chapterId).eq('novel_id', id).maybeSingle();
  if (error || !data) return null;
  const { data: novel } = await supabase.from('novels').select('title').eq('id', id).maybeSingle();
  return { ...data, novelTitle: novel?.title || 'عُروبة' };
}

export async function generateMetadata({ params }: Props) {
  const { id, chapterId } = await params;
  const chapter = await getChapter(id, chapterId);
  return pageMetadata(chapter ? `${chapter.title} — ${chapter.novelTitle}` : 'الفصل غير موجود', 'اقرأ الفصل في قارئ عُروبة التفاعلي مع تقليب الصفحات وحفظ التقدم.', `/stories/${id}/chapters/${chapterId}`);
}

export default async function ChapterReaderPage({ params }: Props) {
  const { id, chapterId } = await params;
  const chapter = await getChapter(id, chapterId);
  if (!chapter) notFound();
  return <main style={{ minHeight: 'calc(100vh - 90px)', padding: '24px 0' }}>
    <nav style={{ maxWidth: 1232, margin: '0 auto 8px', padding: '0 24px', display: 'flex', gap: 18, flexWrap: 'wrap' }} aria-label="روابط الفصل">
      <Link href={`/stories/${id}`}>العودة إلى الرواية</Link>
      {chapter.word_file && <a href={chapter.word_file} target="_blank" rel="noopener noreferrer">فتح الملف الأصلي</a>}
    </nav>
    <ReaderClient content={chapter.content || ''} wordFile={chapter.word_file || null} chapterTitle={chapter.title} novelTitle={chapter.novelTitle} chapterId={String(chapter.id)} novelId={String(chapter.novel_id)} />
  </main>;
}
