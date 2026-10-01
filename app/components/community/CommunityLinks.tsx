'use client';

import Link from 'next/link';
import { useAuthStore } from '@/app/stores/useAuthStore';
import CommunityIcon from './CommunityIcon';
import styles from './Community.module.css';

export function CreatePostLink() {
  const { user, loading } = useAuthStore();

  return (
    <Link
      href={user ? '/community/create' : '/login'}
      className={styles.heroCreateBtn}
    >
      <CommunityIcon name="plus" size={18} />
      <span>{loading || user ? 'منشور جديد' : 'انضم إلى المجتمع'}</span>
    </Link>
  );
}

export function CommunityLinks() {
  const { user, isAdmin } = useAuthStore();

  return (
    <nav className={styles.sideNav} aria-label="روابط المجتمع">
      <Link className={styles.sideNavLink} href="/community/members">
        <span className={styles.sideNavIcon}>
          <CommunityIcon name="users" size={16} />
        </span>
        <span>اكتشف الأعضاء</span>
      </Link>

      {user && (
        <Link className={styles.sideNavLink} href="/community/messages">
          <span className={styles.sideNavIcon}>
            <CommunityIcon name="send" size={16} />
          </span>
          <span>الرسائل الخاصة</span>
        </Link>
      )}

      <Link className={styles.sideNavLink} href="/novels">
        <span className={styles.sideNavIcon}>
          <CommunityIcon name="book" size={16} />
        </span>
        <span>اكتشف روايتك القادمة</span>
      </Link>

      {user && (
        <Link className={styles.sideNavLink} href="/community/notifications">
          <span className={styles.sideNavIcon}>
            <CommunityIcon name="bell" size={16} />
          </span>
          <span>الإشعارات</span>
        </Link>
      )}

      {user?.username && (
        <Link
          className={styles.sideNavLink}
          href={`/community/user/${encodeURIComponent(user.username)}`}
        >
          <span className={styles.sideNavIcon}>
            <CommunityIcon name="eye" size={16} />
          </span>
          <span>ملفي في المجتمع</span>
        </Link>
      )}

      {isAdmin && (
        <Link className={styles.sideNavLink} href="/community/moderation">
          <span className={styles.sideNavIcon}>
            <CommunityIcon name="shield" size={16} />
          </span>
          <span>إدارة البلاغات</span>
        </Link>
      )}
    </nav>
  );
}