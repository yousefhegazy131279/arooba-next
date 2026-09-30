'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/lib/toast';
import styles from './Write.module.css';

type Work = { id: string; title: string; description: string; updated_at: string; community_post_id: string | null };

export default function WriteHome() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const [works, setWorks] = useState<Work[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (!authLoading && !user) router.replace('/login?redirectTo=/write'); }, [authLoading, user, router]);
  useEffect(() => {
    if (!user) return;
    let live = true;
    void supabase.from('writer_works').select('id,title,description,updated_at,community_post_id').eq('user_id', user.id).order('updated_at', { ascending: false })
      .then(({ data, error: issue }) => { if (!live) return; if (issue) setError('تعذر تحميل أعمالك. أعد تحميل الصفحة.'); else setWorks((data || []) as Work[]); setLoading(false); });
    return () => { live = false; };
  }, [user]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!user || pending) return;
    if (!title.trim() || title.trim().length > 160) { setError('اكتب عنوانًا لا يتجاوز ١٦٠ حرفًا.'); return; }
    setPending(true); setError('');
    const { data, error: issue } = await supabase.from('writer_works').insert({ user_id: user.id, title: title.trim(), description: description.trim() }).select('id').single();
    if (issue || !data) { setError('تعذر إنشاء العمل. حاول مرة أخرى.'); setPending(false); return; }
    showToast.success('أُنشئت مسودتك الخاصة');
    router.push(`/write/${data.id}`);
  }

  return <main className={styles.page} dir="rtl"><div className={styles.shell}>
    <div className={styles.topline}><Link href="/library">← مكتبتي</Link><span>من الفكرة الأولى إلى النسخة المنشورة</span></div>
    <header className={styles.hero}><span className={styles.eyebrow}>استوديو عُروبة</span><h1>مساحة الكتابة</h1><p>كل عمل يبقى في مكتبتك الخاصة. قسّمه إلى فصول، عد إليه متى شئت، ثم نزّله كملف Word أو شاركه مع قرّاء المجتمع.</p></header>
    <div className={styles.homeGrid}>
      <form className={styles.panel} onSubmit={event => void create(event)}><h2>ابدأ عملًا جديدًا</h2><p className={styles.hint}>عنوان مؤقت يكفي؛ يمكنك تغييره أثناء الكتابة.</p><label htmlFor="work-title">عنوان العمل</label><input id="work-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder="مثلًا: ما وراء النهر" required /><label htmlFor="work-description">نبذة قصيرة (اختيارية)</label><textarea id="work-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={2000} rows={4} placeholder="عن ماذا يدور عملك؟" />{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary} disabled={pending || !title.trim()}>{pending ? 'جارٍ الإنشاء…' : 'إنشاء المسودة'}</button></form>
      <section className={styles.panel}><div className={styles.panelHead}><h2>أعمالي</h2><span>{works.length} عمل</span></div>{loading ? <p className={styles.hint}>جارٍ تحميل أعمالك…</p> : works.length ? <div className={styles.workList}>{works.map(work => <Link key={work.id} href={`/write/${work.id}`} className={styles.workRow}><span className={styles.workIcon}>✍</span><span><strong>{work.title}</strong><small>{work.description || 'مسودة خاصة'} · آخر تعديل {new Date(work.updated_at).toLocaleDateString('ar-EG')}</small></span><span className={styles.rowArrow}>←</span></Link>)}</div> : <p className={styles.hint}>ستظهر مسوداتك هنا بمجرد بدء العمل الأول.</p>}</section>
    </div>
  </div></main>;
}
