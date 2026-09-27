import { cache } from 'react';
import { pageMetadata } from '@/lib/seo';
import ListSkeleton from '@/app/components/ListSkeleton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { NovelDetails } from './components/NovelDetails';
import { ChapterList } from './components/ChapterList';
import styles from './story-page.module.css';
import 'aos/dist/aos.css';
import { createClient } from '@/lib/supabaseServer';

// دالة لجلب تفاصيل الرواية مع منع التخزين المؤقت
const getNovel = cache(async (novelId: string) => {
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
});

// دالة لجلب الفصول
async function getChapters(novelId: string) {
  const supabase = await createClient();

  const { data: chapters, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .order('chapter_number', { ascending: true });

  if (error || !chapters) return [];

  const ids = chapters.map(chapter => chapter.id);
  const { data: ratings } = ids.length ? await supabase.from('ratings').select('chapter_id,rating').in('chapter_id', ids) : { data: [] };
  const chaptersWithRatings = chapters.map(chapter => {
    const values = (ratings || []).filter(r => r.chapter_id === chapter.id);
    return { ...chapter, average_rating: values.length ? values.reduce((sum, r) => sum + r.rating, 0) / values.length : null, total_ratings: values.length };
  });

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
        <Suspense fallback={<ListSkeleton label="جاري تحميل الفصول" />}>
          <ChapterList chapters={chapters} novelId={id} />
        </Suspense>
      </div>
    </div>
  );
}

// منع التخزين المؤقت للصفحة
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params; const novel = await getNovel(id);
 return pageMetadata(novel?.title || 'الرواية غير موجودة', (novel?.description || 'رواية من مكتبة عُروبة').slice(0,160), '/stories/' + id);
}
