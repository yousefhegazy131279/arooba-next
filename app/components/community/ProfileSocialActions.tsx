'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  setFollow,
  setUserBlocked,
  startConversation,
} from '@/app/community/social/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import CommunityIcon from './CommunityIcon';
import styles from './ProfileSocialActions.module.css';

interface Props {
  memberId: string;
  username: string;
  isOwn: boolean;
  initialFollow: boolean;
  initialBlocked: boolean;
}

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const BlockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const Spinner = () => <span className={styles.spinner} aria-hidden="true" />;

export default function ProfileSocialActions({
  memberId,
  username,
  isOwn,
  initialFollow,
  initialBlocked,
}: Props) {
  const user = useAuthStore((state) => state.user);
  const [following, setFollowing] = useState(initialFollow);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [pending, start] = useTransition();
  const [activeAction, setActiveAction] = useState<
    'follow' | 'message' | 'block' | null
  >(null);
  const [error, setError] = useState('');
  const router = useRouter();

  /* ===== صاحب الملف ===== */
  if (isOwn) {
    return (
      <Link className={styles.editBtn} href="/profile">
        <CommunityIcon name="edit" size={15} />
        <span>تعديل ملفي</span>
      </Link>
    );
  }

  /* ===== غير مسجل الدخول ===== */
  if (!user) {
    return (
      <Link
        className={styles.loginCta}
        href={`/login?redirectTo=${encodeURIComponent(
          `/community/user/${encodeURIComponent(username)}`
        )}`}
      >
        <CommunityIcon name="users" size={15} />
        <span>سجّل الدخول للمتابعة والمراسلة</span>
      </Link>
    );
  }

  const run = (
    action: 'follow' | 'message' | 'block',
    task: () => Promise<void>
  ) => {
    start(async () => {
      setActiveAction(action);
      try {
        setError('');
        await task();
        router.refresh();
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : 'تعذّرت العملية');
      } finally {
        setActiveAction(null);
      }
    });
  };

  return (
    <div className={styles.actions}>
      {/* ===== متابعة ===== */}
      <button
        type="button"
        className={`${styles.btn} ${following ? styles.btnFollowing : styles.btnPrimary}`}
        disabled={pending || blocked}
        onClick={() =>
          run('follow', async () => {
            await setFollow(memberId, !following);
            setFollowing(!following);
          })
        }
        aria-pressed={following}
      >
        {activeAction === 'follow' ? (
          <Spinner />
        ) : following ? (
          <CheckIcon />
        ) : (
          <PlusIcon />
        )}
        <span>{following ? 'أتابعه' : 'متابعة'}</span>
      </button>

      {/* ===== مراسلة ===== */}
      <button
        type="button"
        className={`${styles.btn} ${styles.btnSecondary}`}
        disabled={pending || blocked}
        onClick={() =>
          run('message', async () => {
            const id = await startConversation(memberId);
            router.push(`/community/messages?thread=${id}`);
          })
        }
      >
        {activeAction === 'message' ? <Spinner /> : <MailIcon />}
        <span>مراسلة</span>
      </button>

      {/* ===== حظر ===== */}
      <button
        type="button"
        className={`${styles.btn} ${styles.btnGhost} ${
          blocked ? styles.btnBlocked : ''
        }`}
        disabled={pending}
        onClick={() =>
          run('block', async () => {
            await setUserBlocked(memberId, !blocked);
            setBlocked(!blocked);
            if (!blocked) setFollowing(false);
          })
        }
        aria-pressed={blocked}
        title={blocked ? 'إلغاء الحظر' : 'حظر هذا العضو'}
      >
        {activeAction === 'block' ? <Spinner /> : <BlockIcon />}
        <span>{blocked ? 'إلغاء الحظر' : 'حظر'}</span>
      </button>

      {/* ===== رسالة الخطأ ===== */}
      {error && (
        <span className={styles.error} role="alert">
          <CommunityIcon name="flag" size={13} />
          {error}
        </span>
      )}
    </div>
  );
}