'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPost } from '@/app/community/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { showToast } from '@/lib/toast';
import CommunityIcon from './CommunityIcon';
import FeedSkeleton from './FeedSkeleton';
import styles from './Community.module.css';

export default function CreatePostForm() {
  const { user, loading } = useAuthStore();
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!content.trim() || content.length > 2000) { setError('اكتب منشوراً من حرف واحد إلى 2000 حرف.'); return; }
    setPending(true);
    setError('');
    try {
      await createPost(content.trim());
      showToast.success('تم نشر مشاركتك في المجتمع');
      router.push('/community');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تعذر نشر المشاركة. حاول مرة أخرى.';
      setError(message);
      showToast.error(message);
      setPending(false);
    }
  }

  if (loading) return <FeedSkeleton count={1} />;
  if (!user) return <div className={`${styles.card} ${styles.state}`}><CommunityIcon name="users" width={36} height={36} /><h2>انضم إلى الحديث</h2><p>سجّل دخولك لتشارك أفكارك وتوصياتك مع قرّاء عُروبة.</p><Link href="/login" className={styles.button}>تسجيل الدخول</Link></div>;

  return <form className={`${styles.card} ${styles.form}`} onSubmit={submit} aria-busy={pending}>
    <div><label htmlFor="new-post" className={styles.label}>ما القصة التي بقيت معك؟</label><textarea id="new-post" className={styles.textarea} rows={8} value={content} maxLength={2000} onChange={event => setContent(event.target.value)} placeholder="شارك انطباعاً، اقتباساً أو سؤالاً يفتح حواراً…" required disabled={pending} aria-describedby="post-count post-guidance" /></div>
    <p id="post-guidance" className={styles.hint}>احترم اختلاف الآراء، واذكر تنبيهاً واضحاً قبل حرق أحداث القصة.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.formFooter}><span id="post-count" className={styles.counter}>{content.length.toLocaleString('ar')} / ٢٠٠٠ حرف</span><button className={styles.button} disabled={pending || !content.trim()}><CommunityIcon name="plus" />{pending ? 'جارٍ النشر…' : 'نشر المشاركة'}</button></div>
  </form>;
}
