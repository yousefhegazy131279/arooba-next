'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  deletePost,
  reactToPost,
  reportPost,
  toggleLike,
  updatePost,
} from '@/app/community/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import type { CommunityPost, CommunityReaction } from '@/lib/community-types';
import { askConfirmation } from '@/lib/confirm';
import { showToast } from '@/lib/toast';
import Avatar from './Avatar';
import CommunityIcon from './CommunityIcon';
import PostMedia from './PostMedia';
import styles from './PostCard.module.css';

export const memberName = (user: CommunityPost['user']) =>
  user?.full_name || user?.username || 'قارئ عُروبة';

export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('ar', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value));

/* ===== أيقونات التقييمات ===== */
const ApproveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

const MehIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const BooIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2" />
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
  </svg>
);

const reactions = [
  { kind: 'approve' as const, label: 'أوافق', Icon: ApproveIcon },
  { kind: 'meh' as const, label: 'عادي', Icon: MehIcon },
  { kind: 'boo' as const, label: 'لا يعجبني', Icon: BooIcon },
];

export default function PostCard({
  post,
  onChange,
  onDelete,
  detail = false,
}: {
  post: CommunityPost;
  onChange: (post: CommunityPost) => void;
  onDelete: (id: string) => void;
  detail?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const own = user?.id === post.user_id;
  const name = memberName(post.user);
  const isWriter = post.author_kind === 'writer';

  async function like() {
    if (!user || busy) return;
    setBusy('like');
    try {
      const result = await toggleLike(post.id);
      onChange({ ...post, is_liked: result.liked, likes_count: result.likes_count });
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'تعذر تحديث الإعجاب.');
    } finally {
      setBusy(null);
    }
  }

  async function react(value: CommunityReaction) {
    if (!user || busy || user.community_role !== 'reader') return;
    setBusy('reaction');
    try {
      const chosen = post.my_reaction === value ? null : value;
      await reactToPost(post.id, chosen);
      const next = { ...post.reactions };
      if (post.my_reaction) next[post.my_reaction] = Math.max(0, next[post.my_reaction] - 1);
      if (chosen) next[chosen] += 1;
      onChange({ ...post, reactions: next, my_reaction: chosen });
    } catch (caught) {
      showToast.error(caught instanceof Error ? caught.message : 'تعذر حفظ التقييم.');
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (busy || !(await askConfirmation('هل تريد حذف هذا المنشور وتعليقاته؟ لا يمكن التراجع عن الحذف.'))) return;
    setBusy('delete');
    try {
      await deletePost(post.id);
      onDelete(post.id);
      showToast.success('تم حذف المنشور');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'تعذر حذف المنشور.');
    } finally {
      setBusy(null);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || draft.length > 2000 || busy) return;
    setBusy('edit');
    try {
      await updatePost(post.id, draft.trim());
      onChange({ ...post, content: draft.trim(), updated_at: new Date().toISOString() });
      setEditing(false);
      showToast.success('تم تحديث المنشور');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'تعذر تحديث المنشور.');
    } finally {
      setBusy(null);
    }
  }

  async function report(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 3 || busy) return;
    setBusy('report');
    try {
      await reportPost(post.id, reason.trim());
      setReporting(false);
      setReason('');
      showToast.success('وصل بلاغك إلى فريق الإشراف. شكراً لك.');
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'تعذر إرسال البلاغ.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className={styles.card} aria-label={`منشور ${name}`}>
      {/* ===== رأس البطاقة ===== */}
      <header className={styles.head}>
        <div className={styles.authorWrap}>
          <Avatar src={post.user?.avatar_url} name={name} size={48} ring={isWriter} />
          <div className={styles.authorInfo}>
            <div className={styles.authorRow}>
              {post.user?.username ? (
                <Link
                  className={styles.authorName}
                  href={`/community/user/${encodeURIComponent(post.user.username)}`}
                >
                  {name}
                </Link>
              ) : (
                <span className={styles.authorName}>{name}</span>
              )}
              <span
                className={`${styles.roleBadge} ${
                  isWriter ? styles.roleWriter : styles.roleReader
                }`}
              >
                {isWriter ? (
                  <>
                    <CommunityIcon name="edit" size={11} />
                    كاتب
                  </>
                ) : (
                  <>
                    <CommunityIcon name="book" size={11} />
                    قارئ
                  </>
                )}
              </span>
            </div>

            <Link href={`/community/post/${post.id}`} className={styles.meta}>
              <time dateTime={post.created_at}>{dateLabel(post.created_at)}</time>
              {post.updated_at && post.updated_at !== post.created_at && (
                <span className={styles.edited}>· معدّل</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ===== المحتوى / التعديل ===== */}
      {editing ? (
        <form onSubmit={save} className={styles.editForm}>
          <label className={styles.editLabel} htmlFor={`edit-${post.id}`}>
            تعديل المنشور
          </label>
          <textarea
            className={styles.editTextarea}
            id={`edit-${post.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={2000}
            required
            disabled={!!busy}
            autoFocus
          />
          <div className={styles.editFooter}>
            <span className={styles.editCounter}>
              {draft.length.toLocaleString('ar')} / ٢٠٠٠
            </span>
            <div className={styles.editActions}>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => setEditing(false)}
                disabled={!!busy}
              >
                إلغاء
              </button>
              <button
                className={styles.saveBtn}
                disabled={!!busy || !draft.trim()}
              >
                {busy === 'edit' ? (
                  <>
                    <span className={styles.spinner} />
                    <span>جارٍ الحفظ…</span>
                  </>
                ) : (
                  <>
                    <CommunityIcon name="check" size={14} />
                    <span>حفظ التعديل</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className={styles.content}>{post.content}</p>
      )}

      {/* ===== المرفقات ===== */}
      <PostMedia post={post} />

      {/* ===== لوحة التقييم (للكتّاب فقط) ===== */}
      {isWriter && (
        <div className={styles.reactionPanel}>
          <div className={styles.reactionHead}>
            <strong>رأي القرّاء في هذا العمل</strong>
            <span>أوافق · عادي · لا يعجبني</span>
          </div>

          <div className={styles.reactionButtons}>
            {reactions.map(({ kind, label, Icon }) => {
              const active = post.my_reaction === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  className={`${styles.reactionBtn} ${
                    active ? styles[`reaction_${kind}`] : ''
                  }`}
                  disabled={
                    !!busy ||
                    !user ||
                    user.community_role !== 'reader' ||
                    own
                  }
                  onClick={() => void react(kind)}
                  aria-pressed={active}
                  title={
                    !user
                      ? 'سجّل الدخول للتقييم'
                      : user.community_role !== 'reader'
                      ? 'اختر عضوية قارئ للتقييم'
                      : label
                  }
                >
                  <span className={styles.reactionIcon}>
                    <Icon />
                  </span>
                  <span className={styles.reactionLabel}>{label}</span>
                  <span className={styles.reactionCount}>
                    {post.reactions[kind].toLocaleString('ar')}
                  </span>
                </button>
              );
            })}
          </div>

          {user && user.community_role !== 'reader' && !own && (
            <Link className={styles.switchRoleLink} href="/community/create">
              <CommunityIcon name="sparkle" size={14} />
              اختر عضوية قارئ لتقييم الأعمال
            </Link>
          )}
        </div>
      )}

      {/* ===== شريط الإجراءات ===== */}
      <div className={styles.actions}>
        {user ? (
          <button
            className={`${styles.actionBtn} ${post.is_liked ? styles.liked : ''}`}
            onClick={like}
            disabled={!!busy}
            aria-pressed={post.is_liked}
            aria-label={`${post.is_liked ? 'إلغاء الإعجاب' : 'إعجاب'}، ${post.likes_count}`}
          >
            <CommunityIcon
              name="heart"
              size={18}
              fill={post.is_liked ? 'currentColor' : 'none'}
            />
            <span className={styles.actionCount}>
              {post.likes_count.toLocaleString('ar')}
            </span>
            <span className={styles.actionLabel}>إعجاب</span>
          </button>
        ) : (
          <Link
            className={styles.actionBtn}
            href="/login"
            aria-label="سجّل الدخول للإعجاب"
          >
            <CommunityIcon name="heart" size={18} />
            <span className={styles.actionCount}>
              {post.likes_count.toLocaleString('ar')}
            </span>
            <span className={styles.actionLabel}>إعجاب</span>
          </Link>
        )}

        <Link
          className={styles.actionBtn}
          href={detail ? '#comments' : `/community/post/${post.id}#comments`}
        >
          <CommunityIcon name="comment" size={18} />
          <span className={styles.actionCount}>
            {post.comments_count.toLocaleString('ar')}
          </span>
          <span className={styles.actionLabel}>تعليق</span>
        </Link>

        <span className={styles.spacer} />

        {own && (
          <>
            <button
              type="button"
              className={styles.iconOnlyBtn}
              disabled={!!busy}
              onClick={() => {
                setDraft(post.content);
                setEditing(!editing);
              }}
              aria-label="تعديل المنشور"
              title="تعديل"
            >
              <CommunityIcon name="edit" size={16} />
            </button>
            <button
              className={`${styles.iconOnlyBtn} ${styles.dangerBtn}`}
              disabled={!!busy}
              onClick={remove}
              aria-label="حذف المنشور"
              title="حذف"
            >
              <CommunityIcon name="trash" size={16} />
            </button>
          </>
        )}

        {user && !own && (
          <button
            className={`${styles.iconOnlyBtn} ${reporting ? styles.iconOnlyActive : ''}`}
            onClick={() => setReporting(!reporting)}
            disabled={!!busy}
            aria-expanded={reporting}
            aria-controls={`report-${post.id}`}
            aria-label="الإبلاغ عن المنشور"
            title="إبلاغ"
          >
            <CommunityIcon name="flag" size={16} />
          </button>
        )}
      </div>

      {/* ===== نموذج الإبلاغ ===== */}
      {reporting && (
        <form
          id={`report-${post.id}`}
          onSubmit={report}
          className={styles.reportForm}
        >
          <div className={styles.reportHead}>
            <span className={styles.reportIcon}>
              <CommunityIcon name="flag" size={16} />
            </span>
            <div>
              <strong>الإبلاغ عن المنشور</strong>
              <p>ساعد فريق الإشراف بشرح المخالفة.</p>
            </div>
          </div>

          <textarea
            className={styles.reportTextarea}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={3}
            maxLength={500}
            required
            disabled={!!busy}
            placeholder="اكتب سبب الإبلاغ (٣ إلى ٥٠٠ حرف)…"
            autoFocus
          />

          <div className={styles.reportActions}>
            <button
              className={styles.reportSubmit}
              disabled={!!busy || reason.trim().length < 3}
            >
              {busy === 'report' ? (
                <>
                  <span className={styles.spinner} />
                  <span>جارٍ الإرسال…</span>
                </>
              ) : (
                <>
                  <CommunityIcon name="send" size={14} />
                  <span>إرسال البلاغ</span>
                </>
              )}
            </button>
            <button
              type="button"
              className={styles.reportCancel}
              disabled={!!busy}
              onClick={() => setReporting(false)}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </article>
  );
}