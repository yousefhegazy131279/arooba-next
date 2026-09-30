'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPost, getCommunityRole, setCommunityRole } from '@/app/community/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import { askConfirmation } from '@/lib/confirm';
import { showToast } from '@/lib/toast';
import { downloadWork, makeWorkDocx, workFileName } from '@/lib/writerExport';
import { countWords, type RichNode } from '@/lib/writerDocument';
import type { CommunityRole } from '@/lib/community-types';
import WriterRichEditor from './WriterRichEditor';
import styles from '../Write.module.css';

type Work = { id: string; title: string; description: string; community_post_id: string | null; updated_at: string };
type Chapter = { id: string; work_id: string; position: number; title: string; body: string; body_rich: RichNode | null; updated_at: string };
type SaveSnapshot = { work: Work; chapter: Chapter | null; version: number };

export default function WriterEditor({ workId }: { workId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const [work, setWork] = useState<Work | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [role, setRole] = useState<CommunityRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState('جارٍ تحميل المسودة…');
  const [error, setError] = useState('');
  const workRef = useRef<Work | null>(null);
  const chaptersRef = useRef<Chapter[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const versionRef = useRef(0);
  const persistedVersion = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => { if (!authLoading && !user) router.replace(`/login?redirectTo=${encodeURIComponent(`/write/${workId}`)}`); }, [authLoading, user, workId, router]);

  useEffect(() => {
    if (!user) return;
    let live = true;
    const load = async () => {
      const [manuscript, sections, membership] = await Promise.all([
        supabase.from('writer_works').select('id,title,description,community_post_id,updated_at').eq('id', workId).eq('user_id', user.id).single(),
        supabase.from('writer_chapters').select('id,work_id,position,title,body,body_rich,updated_at').eq('work_id', workId).order('position'),
        getCommunityRole().catch(() => null),
      ]);
      if (!live) return;
      if (manuscript.error || !manuscript.data || sections.error) { setError('هذا العمل غير موجود في مكتبتك أو تعذر تحميله.'); setLoading(false); return; }
      const value = manuscript.data as Work;
      const list = (sections.data || []) as Chapter[];
      workRef.current = value; chaptersRef.current = list; activeIdRef.current = list[0]?.id || null;
      setWork(value); setChapters(list); setActiveId(activeIdRef.current); setRole(membership); setLoading(false); setStatus('المسودة محفوظة في مكتبتك');
    };
    void load();
    return () => { live = false; };
  }, [user, workId]);

  const active = chapters.find(chapter => chapter.id === activeId) || null;
  const wordCount = useMemo(() => chapters.reduce((sum, chapter) => sum + countWords(chapter.body), 0), [chapters]);

  function changed() { versionRef.current += 1; setDirty(true); setStatus('تغييرات لم تُحفظ بعد…'); }
  function editWork(patch: Partial<Work>) {
    if (!workRef.current) return;
    const next = { ...workRef.current, ...patch };
    workRef.current = next; setWork(next); changed();
  }
  function editChapter(patch: Partial<Chapter>) {
    const id = activeIdRef.current;
    if (!id) return;
    const next = chaptersRef.current.map(chapter => chapter.id === id ? { ...chapter, ...patch } : chapter);
    chaptersRef.current = next; setChapters(next); changed();
  }

  const save = useCallback(async (): Promise<boolean> => {
    if (!user || !workRef.current) return false;
    const snapshot: SaveSnapshot = {
      work: { ...workRef.current },
      chapter: chaptersRef.current.find(chapter => chapter.id === activeIdRef.current) || null,
      version: versionRef.current,
    };
    if (snapshot.version <= persistedVersion.current) return true;
    setStatus('جارٍ حفظ المسودة…');
    const operation = saveQueue.current.catch(() => {}).then(async () => {
      if (snapshot.version <= persistedVersion.current) return;
      const timestamp = new Date().toISOString();
      const workUpdate = await supabase.from('writer_works').update({ title: snapshot.work.title.trim() || 'عمل بلا عنوان', description: snapshot.work.description.trim(), updated_at: timestamp }).eq('id', workId).eq('user_id', user.id).select('id').single();
      if (workUpdate.error) throw workUpdate.error;
      if (snapshot.chapter) {
        const chapterUpdate = await supabase.from('writer_chapters').update({ title: snapshot.chapter.title.trim() || 'فصل بلا عنوان', body: snapshot.chapter.body, body_rich: snapshot.chapter.body_rich, updated_at: timestamp }).eq('id', snapshot.chapter.id).eq('work_id', workId).select('id').single();
        if (chapterUpdate.error) throw chapterUpdate.error;
      }
      persistedVersion.current = snapshot.version;
    });
    saveQueue.current = operation;
    try {
      await operation;
      if (versionRef.current === snapshot.version) { setDirty(false); setStatus('حُفظت المسودة في مكتبتك'); }
      return true;
    } catch {
      setStatus('تعذر الحفظ؛ مسودتك ما زالت مفتوحة هنا. حاول مجددًا.');
      setError('تعذر حفظ التغييرات. تحقق من الاتصال ثم اضغط حفظ.');
      return false;
    }
  }, [user, workId]);

  useEffect(() => {
    if (!dirty || loading) return;
    const timer = window.setTimeout(() => { void save(); }, 1400);
    return () => window.clearTimeout(timer);
  }, [dirty, loading, work, chapters, activeId, save]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [save]);

  async function selectChapter(id: string) {
    if (id === activeIdRef.current) return;
    if (dirty && !(await save())) return;
    activeIdRef.current = id; setActiveId(id); setPreview(false); setError('');
  }

  async function addChapter() {
    if (!user || busy) return;
    if (dirty && !(await save())) return;
    if (chaptersRef.current.length >= 500) { setError('الحد الأقصى ٥٠٠ فصل للعمل الواحد.'); return; }
    setBusy(true); setError('');
    const position = Math.max(0, ...chaptersRef.current.map(chapter => chapter.position)) + 1;
    const { data, error: issue } = await supabase.from('writer_chapters').insert({ work_id: workId, position, title: `الفصل ${position}`, body: '' }).select('id,work_id,position,title,body,body_rich,updated_at').single();
    setBusy(false);
    if (issue || !data) { setError('تعذر إنشاء الفصل.'); return; }
    const next = [...chaptersRef.current, data as Chapter];
    chaptersRef.current = next; activeIdRef.current = data.id; setChapters(next); setActiveId(data.id); setPreview(false); setStatus('أُضيف فصل جديد');
  }

  async function deleteChapter() {
    if (!active || busy) return;
    if (!await askConfirmation(`حذف «${active.title}» نهائيًا من هذا العمل؟`)) return;
    setBusy(true); setError('');
    const { error: issue } = await supabase.from('writer_chapters').delete().eq('id', active.id).eq('work_id', workId);
    setBusy(false);
    if (issue) { setError('تعذر حذف الفصل.'); return; }
    const next = chaptersRef.current.filter(chapter => chapter.id !== active.id);
    chaptersRef.current = next; activeIdRef.current = next[0]?.id || null;
    setChapters(next); setActiveId(activeIdRef.current); setPreview(false); setStatus('حُذف الفصل');
  }

  function exportData() {
    const manuscript = workRef.current!;
    return { title: manuscript.title.trim() || 'عمل بلا عنوان', description: manuscript.description, chapters: chaptersRef.current.map(chapter => ({ title: chapter.title, body: chapter.body, rich: chapter.body_rich })) };
  }

  async function download() {
    if (dirty && !(await save())) return;
    setBusy(true); setError('');
    try { const data = exportData(); downloadWork(await makeWorkDocx(data), workFileName(data.title)); showToast.success('حُفظ ملف Word على جهازك'); }
    catch { setError('تعذر إنشاء ملف Word. حاول مرة أخرى.'); }
    finally { setBusy(false); }
  }

  async function becomeWriter() {
    setBusy(true); setError('');
    try { setRole(await setCommunityRole('writer')); showToast.success('أصبحت عضويتك كاتبًا ويمكنك مشاركة أعمالك'); }
    catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذر تغيير نوع العضوية'); }
    finally { setBusy(false); }
  }

  async function publish() {
    if (!user || !workRef.current || busy) return;
    if (role !== 'writer') { setError('اختر صفة كاتب أولًا كي تظهر أعمالك في المجتمع.'); return; }
    if (dirty && !(await save())) return;
    const data = exportData();
    if (!data.chapters.some(chapter => chapter.body.trim())) { setError('اكتب فصلًا واحدًا على الأقل قبل المشاركة.'); return; }
    setBusy(true); setError('');
    let path: string | null = null;
    try {
      const blob = await makeWorkDocx(data);
      if (blob.size > 40 * 1024 * 1024) throw new Error('حجم العمل تجاوز حد النشر ٤٠ ميغابايت. يمكنك تنزيله على جهازك.');
      path = `${user.id}/${crypto.randomUUID()}.docx`;
      const { error: uploadIssue } = await supabase.storage.from('community-media').upload(path, blob, { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', upsert: false });
      if (uploadIssue) throw uploadIssue;
      const intro = `📖 ${data.title}\n${data.description.trim() || 'عمل أدبي جديد من كتّاب عُروبة.'}`.slice(0, 2000);
      const post = await createPost(intro, [{ path, name: workFileName(data.title).slice(0, 160), type: 'docx' }]);
      const { error: updateIssue } = await supabase.from('writer_works').update({ community_post_id: post.id, updated_at: new Date().toISOString() }).eq('id', workId).eq('user_id', user.id);
      if (updateIssue) { setError('نُشر العمل، لكن تعذر حفظ رابط المنشور في مسودتك.'); }
      else if (workRef.current) { const next = { ...workRef.current, community_post_id: post.id }; workRef.current = next; setWork(next); }
      path = null;
      showToast.success('نُشر عملك في المجتمع ويمكن قراءته بصفحات');
    } catch (issue) {
      if (path) await supabase.storage.from('community-media').remove([path]);
      setError(issue instanceof Error ? issue.message : 'تعذر مشاركة العمل. حاول مجددًا.');
    } finally { setBusy(false); }
  }

  if (loading) return <main className={styles.page} dir="rtl"><div className={styles.shell}><p className={styles.panel}>جارٍ فتح مساحة الكتابة…</p></div></main>;
  if (!work) return <main className={styles.page} dir="rtl"><div className={styles.shell}><p className={styles.error}>{error || 'هذا العمل غير متاح.'}</p><Link href="/write">العودة إلى أعمالي</Link></div></main>;

  return <main className={styles.page} dir="rtl"><div className={styles.shell}>
    <div className={styles.topline}><Link href="/library">← مكتبتي</Link><span>مسودة خاصة · {wordCount.toLocaleString('ar-EG')} كلمة</span></div>
    <header className={styles.editorHeader}><div><span className={styles.eyebrow}>على مكتب الكاتب</span><h1>{work.title}</h1><p>{status}</p></div><div className={styles.headerActions}><button className={styles.secondary} disabled={busy || !dirty} onClick={() => void save()}>حفظ الآن</button><button className={styles.secondary} disabled={busy} onClick={() => void download()}>تنزيل Word</button><button className={styles.primary} disabled={busy} onClick={() => void publish()}>{busy ? 'جارٍ العمل…' : 'مشاركة في المجتمع'}</button></div></header>
    {role !== 'writer' && <div className={styles.roleNotice}><div><strong>المشاركة متاحة لعضوية الكاتب</strong><p>يمكنك الكتابة والحفظ الآن. اختر صفة كاتب عندما تصبح مستعدًا لعرض عملك على القرّاء.</p></div><button disabled={busy} onClick={() => void becomeWriter()}>اختر صفة كاتب</button></div>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.editorGrid}>
      <aside className={styles.chapterPanel}><div className={styles.panelHead}><h2>فصول العمل</h2><button onClick={() => void addChapter()} disabled={busy}>+ فصل جديد</button></div><div className={styles.chapterList}>{chapters.map(chapter => <button key={chapter.id} className={chapter.id === activeId ? styles.selectedChapter : ''} onClick={() => void selectChapter(chapter.id)}><small>الفصل {chapter.position}</small><strong>{chapter.title}</strong><span>{countWords(chapter.body)} كلمة</span></button>)}</div><p className={styles.hint}>يُحفظ كل فصل تلقائيًا أثناء الكتابة. يمكنك تنزيل العمل كاملًا أو نشر نسخة منه في المجتمع.</p></aside>
      <section className={styles.editorPanel}><div className={styles.metadataGrid}><div><label htmlFor="edit-work-title">عنوان العمل</label><input id="edit-work-title" maxLength={160} value={work.title} onChange={event => editWork({ title: event.target.value })} /></div><div><label htmlFor="edit-work-description">نبذة العمل</label><textarea id="edit-work-description" rows={2} maxLength={2000} value={work.description} onChange={event => editWork({ description: event.target.value })} /></div></div>
        {active ? <><div className={styles.chapterToolbar}><div><label htmlFor="chapter-title">عنوان الفصل</label><input id="chapter-title" maxLength={160} value={active.title} onChange={event => editChapter({ title: event.target.value })} /></div><div className={styles.toolbarButtons}><button className={preview ? styles.secondary : styles.activeTool} onClick={() => setPreview(false)}>تحرير</button><button className={preview ? styles.activeTool : styles.secondary} onClick={() => setPreview(true)}>معاينة</button><button className={styles.danger} disabled={busy} onClick={() => void deleteChapter()}>حذف الفصل</button></div></div><WriterRichEditor key={active.id} body={active.body} rich={active.body_rich} readOnly={preview} onChange={(rich, body) => { if (body.length > 500000 || JSON.stringify(rich).length > 1800000) { setError('الفصل كبير جدًا؛ قسّمه إلى فصلين قبل المتابعة.'); return; } editChapter({ body_rich: rich, body }); }} /><div className={styles.editorFoot}><span>{active.body.length.toLocaleString('ar-EG')} حرف في هذا الفصل</span><span>{dirty ? 'جارٍ الاستعداد للحفظ التلقائي' : 'كل التغييرات محفوظة'}</span></div></> : <div className={styles.startChapter}><span>✦</span><h2>ابدأ الفصل الأول</h2><p>أعطِ عملك صوتًا وفصولًا. ستبقى مسودتك خاصة في مكتبتك حتى تقرر مشاركتها.</p><button className={styles.primary} disabled={busy} onClick={() => void addChapter()}>إضافة الفصل الأول</button></div>}
      </section>
    </div>
    {work.community_post_id && <div className={styles.sharedNotice}>هذا العمل له نسخة منشورة في المجتمع. <Link href={`/community/post/${work.community_post_id}`}>عرض المنشور</Link> · ستنشئ المشاركة مرة أخرى منشورًا جديدًا بالنسخة الحالية.</div>}
  </div></main>;
}
