'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { addComment, deleteComment, getComments } from '@/app/community/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import type { CommunityComment } from '@/lib/community-types';
import { askConfirmation } from '@/lib/confirm';
import { showToast } from '@/lib/toast';
import Avatar from './Avatar';
import CommunityIcon from './CommunityIcon';
import FeedSkeleton from './FeedSkeleton';
import { dateLabel, memberName } from './PostCard';
import styles from './Community.module.css';

export default function CommentList({ postId, onCountChange }: { postId: string; onCountChange: (delta: number) => void }) {
  const user = useAuthStore(state => state.user);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const offset = useRef(0);
  const fetchedIds = useRef(new Set<string>());
  const generation = useRef(0);
  const fetching = useRef(false);

  const load = useCallback(async (reset = false) => {
    if (fetching.current && !reset) return;
    const request = reset ? ++generation.current : generation.current;
    fetching.current = true;
    setLoading(true);
    setError('');
    try {
      const rows = await getComments(postId, 50, reset ? 0 : offset.current);
      if (request !== generation.current) return;
      offset.current = (reset ? 0 : offset.current) + rows.length;
      if (reset) fetchedIds.current.clear();
      rows.forEach(row => fetchedIds.current.add(row.id));
      setComments(previous => [...new Map((reset ? rows : [...previous, ...rows]).map(item => [item.id, item])).values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)));
      setHasMore(rows.length === 50);
    } catch (err) {
      if (request === generation.current) setError(err instanceof Error ? err.message : 'تعذر تحميل التعليقات.');
    } finally { if (request === generation.current) { fetching.current = false; setLoading(false); } }
  }, [postId]);

  useEffect(() => { void load(true); return () => { generation.current += 1; fetching.current = false; }; }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() || content.length > 500 || busy) return;
    setBusy('add');
    try { const comment = await addComment(postId, content.trim()); setComments(current => [...current, comment]); setContent(''); onCountChange(1); showToast.success('تم نشر تعليقك'); }
    catch (err) { showToast.error(err instanceof Error ? err.message : 'تعذر نشر التعليق.'); }
    finally { setBusy(null); }
  }

  async function remove(commentId: string) {
    if (busy || !await askConfirmation('هل تريد حذف هذا التعليق؟')) return;
    setBusy(commentId);
    try { await deleteComment(commentId); setComments(current => current.filter(item => item.id !== commentId)); if (fetchedIds.current.delete(commentId)) offset.current = Math.max(0, offset.current - 1); onCountChange(-1); showToast.success('تم حذف التعليق'); }
    catch (err) { showToast.error(err instanceof Error ? err.message : 'تعذر حذف التعليق.'); }
    finally { setBusy(null); }
  }

  return <section id="comments" className={styles.card} aria-labelledby="comments-title" style={{ scrollMarginTop: 120 }}>
    <h2 id="comments-title" className={styles.sectionTitle}>مساحة للحوار</h2>
    {comments.map(comment => <article className={styles.comment} key={comment.id}><div className={styles.cardHead}><Avatar src={comment.user?.avatar_url} name={memberName(comment.user)} /><div>{comment.user?.username ? <Link className={styles.author} href={`/community/user/${encodeURIComponent(comment.user.username)}`}>{memberName(comment.user)}</Link> : <span className={styles.author}>{memberName(comment.user)}</span>}<time className={styles.meta} dateTime={comment.created_at}>{dateLabel(comment.created_at)}</time></div>{user?.id === comment.user_id && <button className={`${styles.iconButton} ${styles.spacer} ${styles.danger}`} onClick={() => void remove(comment.id)} disabled={!!busy} aria-label={`حذف تعليق ${memberName(comment.user)}`}><CommunityIcon name="trash" /></button>}</div><p className={styles.content}>{comment.content}</p></article>)}
    {loading && <FeedSkeleton count={1} />}
    {error && <div className={styles.state} role="alert"><p>{error}</p><button className={styles.secondary} onClick={() => void load(comments.length === 0)}>إعادة المحاولة</button></div>}
    {!loading && !error && comments.length === 0 && <p className={styles.hint}>لا توجد تعليقات بعد. شاركنا رأيك لتبدأ المحادثة.</p>}
    {hasMore && !loading && !error && <button className={styles.textLink} onClick={() => void load()}>عرض المزيد من التعليقات</button>}
    {user ? <form onSubmit={submit} className={`${styles.form} ${styles.commentForm}`}><label htmlFor="new-comment" className={styles.label}>أضف إلى الحوار</label><textarea id="new-comment" className={styles.textarea} rows={3} maxLength={500} value={content} onChange={event => setContent(event.target.value)} required disabled={!!busy} placeholder="اكتب تعليقاً يحترم صاحبه ويثري النقاش…" aria-describedby="comment-count" /><div className={styles.formFooter}><span id="comment-count" className={styles.counter}>{content.length.toLocaleString('ar')} / ٥٠٠ حرف</span><button className={styles.button} disabled={!!busy || !content.trim()}>{busy === 'add' ? 'جارٍ النشر…' : 'إضافة تعليق'}</button></div></form> : <div className={styles.commentForm}><Link href="/login" className={styles.textLink}>سجّل الدخول للمشاركة في الحوار</Link></div>}
  </section>;
}
