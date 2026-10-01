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

export default function CommentList({
  postId,
  onCountChange,
}: {
  postId: string;
  onCountChange: (delta: number) => void;
}) {
  const user = useAuthStore((state) => state.user);
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

  const load = useCallback(
    async (reset = false) => {
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
        rows.forEach((row) => fetchedIds.current.add(row.id));
        setComments((previous) =>
          [
            ...new Map(
              (reset ? rows : [...previous, ...rows]).map((item) => [item.id, item])
            ).values(),
          ].sort(
            (a, b) =>
              a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
          )
        );
        setHasMore(rows.length === 50);
      } catch (err) {
        if (request === generation.current)
          setError(err instanceof Error ? err.message : 'تعذر تحميل التعليقات.');
      } finally {
        if (request === generation.current) {
          fetching.current = false;
          setLoading(false);
        }
      }
    },
    [postId]
  );

  useEffect(() => {
    void load(true);
    return () => {
      generation.current += 1;
      fetching.current = false;
    };
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() || content.length > 500 || busy) return;
    setBusy('add');
    try {
      const comment = await addComment(postId, content.trim());
      setComments((current) => [...current, comment]);
      setContent('');
      onCountChange(1);
      showToast.success('تم نشر تعليقك');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'تعذر نشر التعليق.');
    } finally {
      setBusy(null);
    }
  }

  async function remove(commentId: string) {
    if (busy || !(await askConfirmation('هل تريد حذف هذا التعليق؟'))) return;
    setBusy(commentId);
    try {
      await deleteComment(commentId);
      setComments((current) => current.filter((item) => item.id !== commentId));
      if (fetchedIds.current.delete(commentId))
        offset.current = Math.max(0, offset.current - 1);
      onCountChange(-1);
      showToast.success('تم حذف التعليق');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'تعذر حذف التعليق.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      id="comments"
      className={styles.commentsSection}
      aria-labelledby="comments-title"
      style={{ scrollMarginTop: 120 }}
    >
      {/* رأس القسم */}
      <header className={styles.commentsHeader}>
        <div className={styles.commentsHeaderIcon}>
          <CommunityIcon name="comment" size={20} />
        </div>
        <div className={styles.commentsHeaderText}>
          <h2 id="comments-title">مساحة للحوار</h2>
          <p>
            {comments.length > 0
              ? `${comments.length.toLocaleString('ar')} تعليق`
              : 'شاركنا رأيك لتبدأ المحادثة'}
          </p>
        </div>
      </header>

      {/* قائمة التعليقات */}
      <div className={styles.commentsList}>
        {comments.map((comment) => (
          <article className={styles.commentItem} key={comment.id}>
            <Avatar
              src={comment.user?.avatar_url}
              name={memberName(comment.user)}
              size={40}
            />
            <div className={styles.commentBody}>
              <div className={styles.commentHead}>
                <div className={styles.commentAuthor}>
                  {comment.user?.username ? (
                    <Link
                      className={styles.commentName}
                      href={`/community/user/${encodeURIComponent(comment.user.username)}`}
                    >
                      {memberName(comment.user)}
                    </Link>
                  ) : (
                    <span className={styles.commentName}>{memberName(comment.user)}</span>
                  )}
                  <time className={styles.commentTime} dateTime={comment.created_at}>
                    {dateLabel(comment.created_at)}
                  </time>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    className={styles.commentDelete}
                    onClick={() => void remove(comment.id)}
                    disabled={!!busy}
                    aria-label={`حذف تعليق ${memberName(comment.user)}`}
                  >
                    <CommunityIcon name="trash" size={15} />
                  </button>
                )}
              </div>
              <p className={styles.commentText}>{comment.content}</p>
            </div>
          </article>
        ))}
      </div>

      {loading && <FeedSkeleton count={1} />}

      {error && (
        <div className={styles.errorState} role="alert">
          <p>{error}</p>
          <button className={styles.secondary} onClick={() => void load(comments.length === 0)}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {hasMore && !loading && !error && (
        <button className={styles.loadMoreBtn} onClick={() => void load()}>
          عرض المزيد من التعليقات
        </button>
      )}

      {/* نموذج التعليق */}
      {user ? (
        <form onSubmit={submit} className={styles.commentForm}>
          <label htmlFor="new-comment" className={styles.commentFormLabel}>
            أضف إلى الحوار
          </label>
          <div className={styles.commentFormInput}>
            <textarea
              id="new-comment"
              rows={3}
              maxLength={500}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              disabled={!!busy}
              placeholder="اكتب تعليقاً يحترم صاحبه ويثري النقاش…"
              aria-describedby="comment-count"
            />
          </div>
          <div className={styles.commentFormFooter}>
            <span id="comment-count" className={styles.commentCounter}>
              {content.length.toLocaleString('ar')} / ٥٠٠ حرف
            </span>
            <button
              className={styles.commentSubmit}
              disabled={!!busy || !content.trim()}
            >
              {busy === 'add' ? (
                'جارٍ النشر…'
              ) : (
                <>
                  <CommunityIcon name="send" size={15} />
                  نشر التعليق
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.commentGuestBox}>
          <p>شارك في الحوار مع القرّاء والكتّاب.</p>
          <Link href="/login" className={styles.button}>
            تسجيل الدخول للتعليق
          </Link>
        </div>
      )}
    </section>
  );
}