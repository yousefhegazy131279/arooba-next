'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setFollow, setUserBlocked, startConversation } from '@/app/community/social/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import styles from './Social.module.css';

export default function ProfileSocialActions({ memberId, username, isOwn, initialFollow, initialBlocked }: { memberId: string; username: string; isOwn: boolean; initialFollow: boolean; initialBlocked: boolean }) {
  const user = useAuthStore(state => state.user);
  const [following, setFollowing] = useState(initialFollow);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();
  if (isOwn) return <Link className={styles.outlineButton} href="/profile">تعديل ملفي</Link>;
  if (!user) return <Link className={styles.primaryButton} href={`/login?redirectTo=${encodeURIComponent(`/community/user/${encodeURIComponent(username)}`)}`}>سجّل الدخول للمتابعة والمراسلة</Link>;
  const run = (task: () => Promise<void>) => start(async () => { try { setError(''); await task(); router.refresh(); } catch (issue) { setError(issue instanceof Error ? issue.message : 'تعذّرت العملية'); } });
  return <div className={styles.profileActions}>
    <button className={styles.primaryButton} disabled={pending || blocked} onClick={() => run(async () => { await setFollow(memberId, !following); setFollowing(!following); })}>{following ? '✓ أتابعه' : '+ متابعة'}</button>
    <button className={styles.outlineButton} disabled={pending || blocked} onClick={() => run(async () => { const id = await startConversation(memberId); router.push(`/community/messages?thread=${id}`); })}>✉ مراسلة</button>
    <button className={styles.quietButton} disabled={pending} onClick={() => run(async () => { await setUserBlocked(memberId, !blocked); setBlocked(!blocked); if (!blocked) setFollowing(false); })}>{blocked ? 'إلغاء الحظر' : 'حظر'}</button>
    {error && <span className={styles.error} role="alert">{error}</span>}
  </div>;
}
