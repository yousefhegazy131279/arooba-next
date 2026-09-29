'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPost, getCommunityRole, setCommunityRole } from '@/app/community/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import type { CommunityAttachment, CommunityRole } from '@/lib/community-types';
import { showToast } from '@/lib/toast';
import CommunityIcon from './CommunityIcon';
import FeedSkeleton from './FeedSkeleton';
import styles from './Community.module.css';

const formats: Record<string, { type: CommunityAttachment['type']; mime: string }> = {
  jpg: { type: 'image', mime: 'image/jpeg' }, jpeg: { type: 'image', mime: 'image/jpeg' },
  png: { type: 'image', mime: 'image/png' }, webp: { type: 'image', mime: 'image/webp' },
  gif: { type: 'image', mime: 'image/gif' }, mp4: { type: 'video', mime: 'video/mp4' },
  webm: { type: 'video', mime: 'video/webm' }, pdf: { type: 'pdf', mime: 'application/pdf' },
  docx: { type: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

export default function CreatePostForm() {
  const { user, loading } = useAuthStore();
  const userId = user?.id;
  const [role, setRole] = useState<CommunityRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    let live = true;
    void getCommunityRole().then(value => { if (live) setRole(value); })
      .catch(caught => { if (live) setError(caught instanceof Error ? caught.message : 'تعذر تحميل نوع العضوية'); })
      .finally(() => { if (live) setRoleLoading(false); });
    return () => { live = false; };
  }, [userId]);

  async function choose(value: CommunityRole) {
    setRoleLoading(true); setError('');
    try { const chosen = await setCommunityRole(value); setRole(chosen); if (user) useAuthStore.getState().setUser({ ...user, community_role: chosen }); showToast.success(value === 'writer' ? 'أصبحت عضويتك كاتباً' : 'أصبحت عضويتك قارئاً'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تغيير نوع العضوية'); }
    finally { setRoleLoading(false); }
  }

  function selectFiles(selected: FileList | null) {
    if (!selected) return;
    const next = [...selected];
    if (next.length > 4) { setError('يمكنك إضافة أربعة ملفات كحد أقصى.'); return; }
    for (const file of next) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const format = formats[ext];
      if (!format || (file.type && file.type !== format.mime)) { setError(`صيغة الملف ${file.name} غير مدعومة.`); return; }
      if (file.size === 0 || file.size > 40 * 1024 * 1024) { setError(`حجم ${file.name} يجب ألا يتجاوز ٤٠ ميغابايت.`); return; }
      if (role !== 'writer' && (format.type === 'pdf' || format.type === 'docx')) { setError('نشر الكتب متاح للكتّاب. غيّر نوع عضويتك إلى كاتب أولًا.'); return; }
    }
    setFiles(next); setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending || roleLoading) return;
    if (!role) { setError('اختر قارئاً أو كاتباً قبل النشر.'); return; }
    if (!content.trim() || content.length > 2000) { setError('اكتب وصفاً من حرف واحد إلى ٢٠٠٠ حرف.'); return; }
    if (!user) return;
    setPending(true); setError('');
    const uploaded: string[] = [];
    try {
      const attachments: CommunityAttachment[] = [];
      for (const file of files) {
        const chosenExt = file.name.split('.').pop()!.toLowerCase();
        const ext = chosenExt === 'jpeg' ? 'jpg' : chosenExt;
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('community-media').upload(path, file, { contentType: formats[ext].mime, upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push(path);
        attachments.push({ path, name: file.name.slice(0, 160), type: formats[ext].type });
      }
      await createPost(content.trim(), attachments);
      showToast.success('تم نشر مشاركتك في المجتمع');
      router.push('/community'); router.refresh();
    } catch (caught) {
      if (uploaded.length) await supabase.storage.from('community-media').remove(uploaded);
      const message = caught instanceof Error ? caught.message : 'تعذر نشر المشاركة. حاول مرة أخرى.';
      setError(message); showToast.error(message); setPending(false);
    }
  }

  if (loading) return <FeedSkeleton count={1} />;
  if (!user) return <div className={`${styles.card} ${styles.state}`}><CommunityIcon name="users" width={36} height={36} /><h2>انضم إلى المجتمع</h2><p>سجّل دخولك لتشارك قراءاتك وكتاباتك.</p><Link href="/login" className={styles.button}>تسجيل الدخول</Link></div>;

  return <form className={`${styles.card} ${styles.form}`} onSubmit={submit} aria-busy={pending}>
    <div className={styles.rolePicker}><div><strong>كيف تريد المشاركة؟</strong><p className={styles.hint}>اختر نوع عضويتك قبل أول منشور. يمكنك تغييره هنا لاحقاً؛ صلاحية الإدارة مستقلة عنه.</p></div><div className={styles.roleOptions}><button type="button" className={role === 'reader' ? styles.roleActive : styles.secondary} aria-pressed={role === 'reader'} disabled={pending || roleLoading} onClick={() => void choose('reader')}>قارئ <small>أشارك انطباعاتي وأقيّم أعمال الكتّاب</small></button><button type="button" className={role === 'writer' ? styles.roleActive : styles.secondary} aria-pressed={role === 'writer'} disabled={pending || roleLoading} onClick={() => void choose('writer')}>كاتب <small>أنشر نصوصي وملفات كتبي</small></button></div></div>
    <div><label htmlFor="new-post" className={styles.label}>{role === 'writer' ? 'قدّم عملك للقرّاء' : 'ما القصة التي بقيت معك؟'}</label><textarea id="new-post" className={styles.textarea} rows={7} value={content} maxLength={2000} onChange={event => setContent(event.target.value)} placeholder={role === 'writer' ? 'عنوان العمل، فكرته، ولماذا تحب أن يقرأه الآخرون…' : 'شارك انطباعاً، اقتباساً أو سؤالاً يفتح حواراً…'} required disabled={pending || !role} /></div>
    <div className={styles.uploadBox}><label htmlFor="post-files" className={styles.label}>أضف صوراً أو فيديوهات{role === 'writer' ? ' أو كتب PDF وWord (DOCX)' : ''}</label><input id="post-files" type="file" multiple accept={role === 'writer' ? '.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.pdf,.docx' : '.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm'} onChange={event => selectFiles(event.target.files)} disabled={pending || !role} /><p className={styles.hint}>حتى ٤ ملفات، ٤٠ ميغابايت للملف. تُعرض كتب PDF وDOCX بصفحات داخل قارئ عربي.</p>{files.length > 0 && <ul>{files.map(file => <li key={file.name}>{file.name}</li>)}</ul>}</div>
    <p className={styles.hint}>انشر ما تملك حق مشاركته، واحترم اختلاف الآراء ونبّه إلى حرق الأحداث.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.formFooter}><span className={styles.counter}>{content.length.toLocaleString('ar')} / ٢٠٠٠ حرف</span><button className={styles.button} disabled={pending || roleLoading || !role || !content.trim()}><CommunityIcon name="plus" />{pending ? 'جارٍ رفع الملفات والنشر…' : 'نشر المشاركة'}</button></div>
  </form>;
}
