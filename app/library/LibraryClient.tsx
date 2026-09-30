'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/lib/toast';
import styles from './Library.module.css';

type Shelf = 'want_to_read' | 'reading' | 'finished';
type Item = { novel_id: string; shelf: Shelf; updated_at: string };
type Progress = { novel_id: string; chapter_id: string; page_number: number; last_read_at: string };
type Novel = { id: string; title: string; author: string | null; cover: string | null; category: string | null };
type Work = { id: string; title: string; description: string; updated_at: string; community_post_id: string | null };

function coverUrl(value: string | null) {
  if (!value) return null;
  return value.startsWith('https://') || value.startsWith('/') ? value : `/covers/${value}`;
}

export default function LibraryClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?redirectTo=/library');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let live = true;
    const load = async () => {
      setLoading(true);
      const [saved, recent, liked, manuscripts] = await Promise.all([
        supabase.from('library_items').select('novel_id,shelf,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('reading_progress').select('novel_id,chapter_id,page_number,last_read_at').eq('user_id', user.id).order('last_read_at', { ascending: false }).limit(100),
        supabase.from('favorites').select('novel_id').eq('user_id', user.id),
        supabase.from('writer_works').select('id,title,description,updated_at,community_post_id').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ]);
      if (!live) return;
      if (saved.error || recent.error || liked.error || manuscripts.error) {
        setError('تعذر تحميل مكتبتك. أعد تحميل الصفحة.'); setLoading(false); return;
      }
      const allIds = [...new Set([...(saved.data || []).map(row => String(row.novel_id)), ...(recent.data || []).map(row => String(row.novel_id)), ...(liked.data || []).map(row => String(row.novel_id))])];
      const books = allIds.length ? await supabase.from('novels').select('id,title,author,cover,category').in('id', allIds) : { data: [], error: null };
      if (!live) return;
      if (books.error) { setError('تعذر تحميل تفاصيل الروايات.'); setLoading(false); return; }
      setItems((saved.data || []).map(row => ({ ...row, novel_id: String(row.novel_id) })) as Item[]);
      setProgress((recent.data || []).map(row => ({ ...row, novel_id: String(row.novel_id), chapter_id: String(row.chapter_id) })) as Progress[]);
      setFavorites((liked.data || []).map(row => String(row.novel_id)));
      setWorks((manuscripts.data || []) as Work[]);
      setNovels((books.data || []).map(row => ({ ...row, id: String(row.id) })) as Novel[]);
      setError(''); setLoading(false);
    };
    void load();
    return () => { live = false; };
  }, [user]);

  const bookMap = useMemo(() => new Map(novels.map(novel => [novel.id, novel])), [novels]);
  const latest = useMemo(() => {
    const seen = new Set<string>();
    return progress.filter(row => { if (seen.has(row.novel_id)) return false; seen.add(row.novel_id); return bookMap.has(row.novel_id); });
  }, [progress, bookMap]);
  const reading = items.filter(item => item.shelf === 'reading' && bookMap.has(item.novel_id) && !latest.some(row => row.novel_id === item.novel_id));
  const later = items.filter(item => item.shelf === 'want_to_read' && bookMap.has(item.novel_id));
  const finished = items.filter(item => item.shelf === 'finished' && bookMap.has(item.novel_id));

  async function updateShelf(item: Item, shelf: Shelf | null) {
    if (!user) return;
    setBusyId(item.novel_id);
    const result = shelf
      ? await supabase.from('library_items').update({ shelf, updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('novel_id', item.novel_id)
      : await supabase.from('library_items').delete().eq('user_id', user.id).eq('novel_id', item.novel_id);
    setBusyId(null);
    if (result.error) { showToast.error('تعذر تحديث المكتبة'); return; }
    setItems(previous => shelf ? previous.map(row => row.novel_id === item.novel_id ? { ...row, shelf } : row) : previous.filter(row => row.novel_id !== item.novel_id));
    showToast.success(shelf === 'finished' ? 'انتقلت إلى الكتب المكتملة' : shelf ? 'تم تحديث القائمة' : 'أُزيلت من مكتبتك');
  }

  function card(novelId: string, extra?: React.ReactNode) {
    const novel = bookMap.get(novelId);
    if (!novel) return null;
    const cover = coverUrl(novel.cover);
    return <article className={styles.bookCard} key={novelId}>
      <Link className={styles.cover} href={`/stories/${novelId}`}>{cover ? <img src={cover} alt="" /> : <span>📖</span>}</Link>
      <div className={styles.bookInfo}><Link href={`/stories/${novelId}`} className={styles.bookTitle}>{novel.title}</Link><p>{novel.author || 'كاتب عُروبة'}</p>{extra}</div>
    </article>;
  }

  return <main className={styles.page} dir="rtl">
    <div className={styles.shell}>
      <header className={styles.hero}><div><span className={styles.eyebrow}>مساحتك في عُروبة</span><h1>مكتبتي</h1><p>ارجع إلى الصفحة التي توقفت عندها، نظّم ما تريد قراءته، وواصل كتابة أعمالك.</p></div><Link href="/write" className={styles.primary}>✦ افتح مساحة الكتابة</Link></header>
      {loading ? <p className={styles.state}>جارٍ ترتيب رفوف مكتبتك…</p> : error ? <p className={styles.state} role="alert">{error}</p> : <>
        <section className={styles.section}><div className={styles.sectionHeading}><div><span>01 / رحلتك</span><h2>أكمل القراءة</h2></div><Link href="/novels">استكشف الروايات ←</Link></div>{latest.length || reading.length ? <div className={styles.grid}>{latest.map(row => card(row.novel_id, <div className={styles.cardActions}><span>وصلت إلى صفحة {row.page_number}</span><Link className={styles.action} href={`/stories/${row.novel_id}/chapters/${row.chapter_id}#page=${row.page_number}`}>تابع من هنا</Link></div>))}{reading.map(item => card(item.novel_id, <div className={styles.cardActions}><Link className={styles.action} href={`/stories/${item.novel_id}`}>افتح الرواية</Link><button disabled={busyId === item.novel_id} onClick={() => void updateShelf(item, 'finished')}>أنهيتها</button></div>))}</div> : <p className={styles.empty}>ابدأ أي رواية وستجد موضع قراءتك هنا تلقائيًا.</p>}</section>
        <section className={styles.section}><div className={styles.sectionHeading}><div><span>02 / قائمة الانتظار</span><h2>أقرأها لاحقًا</h2></div></div>{later.length ? <div className={styles.grid}>{later.map(item => card(item.novel_id, <div className={styles.cardActions}><button disabled={busyId === item.novel_id} onClick={() => void updateShelf(item, 'reading')}>أقرأها الآن</button><button disabled={busyId === item.novel_id} onClick={() => void updateShelf(item, 'finished')}>أنهيتها</button><button disabled={busyId === item.novel_id} onClick={() => void updateShelf(item, null)}>إزالة</button></div>))}</div> : <p className={styles.empty}>احفظ رواية من صفحتها لتجدها هنا عندما يحين وقتها.</p>}</section>
        <section className={styles.section}><div className={styles.sectionHeading}><div><span>03 / اختياراتك</span><h2>المفضلة والمكتملة</h2></div><Link href="/profile/favorites">كل المفضلة ←</Link></div>{favorites.length || finished.length ? <div className={styles.grid}>{[...new Set([...favorites, ...finished.map(item => item.novel_id)])].map(id => card(id, <div className={styles.cardActions}>{favorites.includes(id) && <span>♥ من المفضلة</span>}{finished.some(item => item.novel_id === id) && <span>✓ مكتملة</span>}</div>))}</div> : <p className={styles.empty}>الروايات التي تحبها وتكملها ستظهر في هذا الرف.</p>}</section>
        <section className={styles.section}><div className={styles.sectionHeading}><div><span>04 / على مكتب الكاتب</span><h2>كتاباتي</h2></div><Link href="/write">إدارة الأعمال ←</Link></div>{works.length ? <div className={styles.grid}>{works.map(work => <article className={styles.workCard} key={work.id}><span className={styles.workMark}>✍</span><h3>{work.title}</h3><p>{work.description || 'مسودة محفوظة في مكتبتك الخاصة.'}</p><small>آخر تعديل {new Date(work.updated_at).toLocaleDateString('ar-EG')}</small><div className={styles.cardActions}><Link className={styles.action} href={`/write/${work.id}`}>تابع الكتابة</Link>{work.community_post_id && <Link href={`/community/post/${work.community_post_id}`}>المنشور</Link>}</div></article>)}</div> : <div className={styles.empty}>ابدأ عملك الأول، قسّمه إلى فصول واحفظه هنا بأمان. <Link href="/write">ابدأ الكتابة</Link></div>}</section>
      </>}
    </div>
  </main>;
}
