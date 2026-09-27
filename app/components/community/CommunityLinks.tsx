'use client';

import Link from 'next/link';
import { useAuthStore } from '@/app/stores/useAuthStore';
import CommunityIcon from './CommunityIcon';
import styles from './Community.module.css';

export function CreatePostLink() {
  const { user, loading } = useAuthStore();
  return <Link href={user ? '/community/create' : '/login'} className={styles.button}><CommunityIcon name="plus" />{loading || user ? 'منشور جديد' : 'انضم إلى المجتمع'}</Link>;
}

export function CommunityLinks() {
  const { user, isAdmin } = useAuthStore();
  return <nav className={styles.sideNav} aria-label="روابط المجتمع"><Link className={styles.textLink} href="/novels">اكتشف روايتك القادمة</Link>{user && <Link className={styles.textLink} href="/community/notifications"><CommunityIcon name="bell" />الإشعارات</Link>}{user?.username && <Link className={styles.textLink} href={`/community/user/${encodeURIComponent(user.username)}`}>منشوراتي</Link>}{isAdmin && <Link className={styles.textLink} href="/community/moderation"><CommunityIcon name="shield" />إدارة البلاغات</Link>}</nav>;
}
