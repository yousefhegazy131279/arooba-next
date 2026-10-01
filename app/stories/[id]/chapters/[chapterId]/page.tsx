import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import { pageMetadata } from '@/lib/seo';
import ReaderClient from '@/app/components/reader/ReaderClient';
import styles from './chapter-reader.module.css';

type Props = { params: Promise<{ id: string; chapterId: string }> };

async function getChapter(id: string, chapterId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chapters')
    .select('id,novel_id,title,content,word_file')
    .eq('id', chapterId)
    .eq('novel_id', id)
    .maybeSingle();

  if (error || !data) return null;

  const { data: novel } = await supabase
    .from('novels')
    .select('title')
    .eq('id', id)
    .maybeSingle();

  return { ...data, novelTitle: novel?.title || 'عُروبة' };
}

export async function generateMetadata({ params }: Props) {
  const { id, chapterId } = await params;
  const chapter = await getChapter(id, chapterId);
  return pageMetadata(
    chapter ? `${chapter.title} — ${chapter.novelTitle}` : 'الفصل غير موجود',
    'اقرأ الفصل في قارئ عُروبة التفاعلي مع تقليب الصفحات وحفظ التقدم.',
    `/stories/${id}/chapters/${chapterId}`
  );
}

/* ==========================================================
   أيقونات SVG
   ========================================================== */
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const OpenFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default async function ChapterReaderPage({ params }: Props) {
  const { id, chapterId } = await params;
  const chapter = await getChapter(id, chapterId);
  if (!chapter) notFound();

  return (
    <main className={styles.page}>
      {/* ===== خلفية خفيفة ===== */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgGlow} />
      </div>

      <div className={styles.shell}>
        {/* ===== شريط التنقل العلوي ===== */}
        <nav className={styles.topNav} aria-label="روابط الفصل">
          <Link href={`/stories/${id}`} className={styles.backLink}>
            <BackIcon />
            <span>العودة إلى الرواية</span>
          </Link>

          {chapter.word_file && (
            <a
              href={chapter.word_file}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fileLink}
            >
              <OpenFileIcon />
              <span>فتح الملف الأصلي</span>
            </a>
          )}
        </nav>

        {/* ===== القارئ ===== */}
        <div className={styles.readerWrap}>
          <ReaderClient
            content={chapter.content || ''}
            wordFile={chapter.word_file || null}
            chapterTitle={chapter.title}
            novelTitle={chapter.novelTitle}
            chapterId={String(chapter.id)}
            novelId={String(chapter.novel_id)}
          />
        </div>
      </div>
    </main>
  );
}