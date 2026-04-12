import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { NovelDetails } from './components/NovelDetails';
import { ChapterList } from './components/ChapterList';
import styles from './story-page.module.css';
import 'aos/dist/aos.css';
import { createClient } from '@/lib/supabaseServer';

// دالة لجلب تفاصيل الرواية مع منع التخزين المؤقت
async function getNovel(novelId: string) {
  const supabase = await createClient();

  const { data: novel, error: novelError } = await supabase
    .from('novels')
    .select('*')
    .eq('id', novelId)
    .single();

  if (novelError || !novel) return null;

  const { data: ratings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('novel_id', novelId);

  let averageRating = null;
  if (ratings && ratings.length > 0) {
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    averageRating = sum / ratings.length;
  }

  const { count: chaptersCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })
    .eq('novel_id', novelId);

  return {
    ...novel,
    average_rating: averageRating,
    chapters_count: chaptersCount || 0,
  };
}

// دالة لجلب الفصول
async function getChapters(novelId: string) {
  const supabase = await createClient();

  const { data: chapters, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .order('chapter_number', { ascending: true });

  if (error || !chapters) return [];

  const chaptersWithRatings = await Promise.all(
    chapters.map(async (chapter) => {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('chapter_id', chapter.id);

      let averageRating = null;
      if (ratings && ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        averageRating = sum / ratings.length;
      }

      return {
        ...chapter,
        average_rating: averageRating,
        total_ratings: ratings?.length || 0,
      };
    })
  );

  return chaptersWithRatings;
}

// الصفحة الرئيسية مع منع التخزين المؤقت
export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const novel = await getNovel(id);
  if (!novel) notFound();

  const chapters = await getChapters(id);

  return (
    <div className={styles.storyPage}>
      <div className={styles.animatedBg}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
        <div className={styles.floatingParticles}></div>
      </div>

      <div className={styles.container}>
        <Suspense fallback={<div className={styles.loadingState}>جاري تحميل تفاصيل الرواية...</div>}>
          <NovelDetails novel={novel} />
        </Suspense>
        <Suspense fallback={<div className={styles.loadingState}>جاري تحميل الفصول...</div>}>
          <ChapterList chapters={chapters} novelId={id} />
        </Suspense>
      </div>
    </div>
  );
}

// منع التخزين المؤقت للصفحة
export const dynamic = 'force-dynamic';
export const revalidate = 0;