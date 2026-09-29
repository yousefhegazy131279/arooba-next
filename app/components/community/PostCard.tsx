'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { deletePost, reactToPost, reportPost, toggleLike, updatePost } from '@/app/community/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import type { CommunityPost, CommunityReaction } from '@/lib/community-types';
import { askConfirmation } from '@/lib/confirm';
import { showToast } from '@/lib/toast';
import Avatar from './Avatar';
import CommunityIcon from './CommunityIcon';
import PostMedia from './PostMedia';
import styles from './Community.module.css';

export const memberName = (user: CommunityPost['user']) => user?.full_name || user?.username || 'قارئ عُروبة';
export const dateLabel = (value: string) => new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));

export default function PostCard({ post, onChange, onDelete, detail = false }: { post: CommunityPost; onChange: (post: CommunityPost) => void; onDelete: (id: string) => void; detail?: boolean }) {
  const user = useAuthStore(state => state.user);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const own = user?.id === post.user_id;
  const name = memberName(post.user);


  async function like() {
    if (!user || busy) return;
    setBusy('like');
    try { const result = await toggleLike(post.id); onChange({ ...post, is_liked: result.liked, likes_count: result.likes_count }); }
    catch (err) { showToast.error(err instanceof Error ? err.message : 'تعذر تحديث الإعجاب.'); }
    finally { setBusy(null); }
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
    } catch (caught) { showToast.error(caught instanceof Error ? caught.message : 'تعذر حفظ التقييم.'); }
    finally { setBusy(null); }
  }

  async function remove() {
    if (busy || !await askConfirmation('هل تريد حذف هذا المنشور وتعليقاته؟ لا يمكن التراجع عن الحذف.')) return;
    setBusy('delete');
    try { await deletePost(post.id); onDelete(post.id); showToast.success('تم حذف المنشور'); }
    catch (err) { showToast.error(err instanceof Error ? err.message : 'تعذر حذف المنشور.'); }
    finally { setBusy(null); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || draft.length > 2000 || busy) return;
    setBusy('edit');
    try { await updatePost(post.id, draft.trim()); onChange({ ...post, content: draft.trim(), updated_at: new Date().toISOString() }); setEditing(false); showToast.success('تم تحديث المنشور'); }
    catch (err) { showToast.error(err instanceof Error ? err.message : 'تعذر تحديث المنشور.'); }
    finally { setBusy(null); }
  }

  async function report(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 3 || busy) return;
    setBusy('report');
    try { await reportPost(post.id, reason.trim()); setReporting(false); setReason(''); showToast.success('وصل بلاغك إلى فريق الإشراف. شكراً لك.'); }
    catch (err) { showToast.error(err instanceof Error ? err.message : 'تعذر إرسال البلاغ.'); }
    finally { setBusy(null); }
  }

  return <article className={styles.card} aria-label={`منشور ${name}`}>
    <header className={styles.cardHead}><Avatar src={post.user?.avatar_url} name={name} /><div>{post.user?.username ? <Link className={styles.author} href={`/community/user/${encodeURIComponent(post.user.username)}`}>{name}</Link> : <span className={styles.author}>{name}</span>}<Link href={`/community/post/${post.id}`} className={styles.meta}><time dateTime={post.created_at}>{dateLabel(post.created_at)}</time>{post.updated_at && post.updated_at !== post.created_at && ' · معدّل'}</Link></div><span className={styles.memberBadge}>{post.author_kind === 'writer' ? '✍ كاتب' : '◇ قارئ'}</span></header>
    {editing ? <form onSubmit={save} className={styles.form}><label className={styles.label} htmlFor={`edit-${post.id}`}>تعديل المنشور</label><textarea className={styles.textarea} id={`edit-${post.id}`} value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} required disabled={!!busy} autoFocus /><div className={styles.formFooter}><span className={styles.counter}>{draft.length.toLocaleString('ar')} / ٢٠٠٠</span><div className={styles.actions}><button className={styles.secondary} type="button" onClick={() => setEditing(false)} disabled={!!busy}>إلغاء</button><button className={styles.button} disabled={!!busy || !draft.trim()}>{busy === 'edit' ? 'جارٍ الحفظ…' : 'حفظ التعديل'}</button></div></div></form> : <p className={styles.content}>{post.content}</p>}
    <PostMedia post={post} />
    {post.author_kind === 'writer' && <div className={styles.reactionPanel}><p><strong>رأي القرّاء في هذا العمل</strong><span>أوافق: أعجبني · عادي: متوسط · لا يعجبني: يحتاج تحسيناً</span></p><div className={styles.reactionButtons}>{([['approve', 'أوافق', '👍'], ['meh', 'عادي', '😐'], ['boo', 'لا يعجبني', '👎']] as const).map(([kind, label, icon]) => <button key={kind} type="button" className={post.my_reaction === kind ? styles.reactionActive : styles.secondary} disabled={!!busy || !user || user.community_role !== 'reader' || own} onClick={() => void react(kind)} aria-pressed={post.my_reaction === kind} title={!user ? 'سجّل الدخول للتقييم' : user.community_role !== 'reader' ? 'اختر عضوية قارئ للتقييم' : label}>{icon} {label} <b>{post.reactions[kind]}</b></button>)}</div>{user && user.community_role !== 'reader' && !own && <Link className={styles.textLink} href="/community/create">اختر عضوية قارئ لتقييم الأعمال</Link>}</div>}
    <div className={`${styles.actions} ${styles.cardActions}`}>
      {user ? <button className={`${styles.iconButton} ${post.is_liked ? styles.liked : ''}`} onClick={like} disabled={!!busy} aria-pressed={post.is_liked} aria-label={`${post.is_liked ? 'إلغاء الإعجاب' : 'إعجاب'}، ${post.likes_count}`}><CommunityIcon name="heart" fill={post.is_liked ? 'currentColor' : 'none'} /><span>{post.likes_count.toLocaleString('ar')}</span></button> : <Link className={styles.iconButton} href="/login" aria-label="سجّل الدخول للإعجاب"><CommunityIcon name="heart" /><span>{post.likes_count.toLocaleString('ar')}</span></Link>}
      <Link className={styles.iconButton} href={detail ? '#comments' : `/community/post/${post.id}#comments`}><CommunityIcon name="comment" /><span>{post.comments_count.toLocaleString('ar')} تعليق</span></Link>
      <span className={styles.spacer} />
      {own && <><button type="button" className={styles.iconButton} disabled={!!busy} onClick={() => { setDraft(post.content); setEditing(!editing); }} aria-label="تعديل المنشور"><CommunityIcon name="edit" /><span>تعديل</span></button><button className={`${styles.iconButton} ${styles.danger}`} disabled={!!busy} onClick={remove} aria-label="حذف المنشور"><CommunityIcon name="trash" /></button></>}
      {user && !own && <button className={styles.iconButton} onClick={() => setReporting(!reporting)} disabled={!!busy} aria-expanded={reporting} aria-controls={`report-${post.id}`} aria-label="الإبلاغ عن المنشور"><CommunityIcon name="flag" /></button>}
    </div>
    {reporting && <form id={`report-${post.id}`} onSubmit={report} className={`${styles.form} ${styles.inlineForm}`}><label htmlFor={`reason-${post.id}`} className={styles.label}>ما سبب الإبلاغ؟</label><textarea id={`reason-${post.id}`} className={styles.textarea} rows={3} value={reason} onChange={event => setReason(event.target.value)} minLength={3} maxLength={500} required disabled={!!busy} placeholder="اشرح المخالفة لمساعدة فريق الإشراف (3–500 حرف)." autoFocus /><div className={styles.actions}><button className={styles.button} disabled={!!busy || reason.trim().length < 3}>{busy === 'report' ? 'جارٍ الإرسال…' : 'إرسال البلاغ'}</button><button type="button" className={styles.secondary} disabled={!!busy} onClick={() => setReporting(false)}>إلغاء</button></div></form>}
  </article>;
}
