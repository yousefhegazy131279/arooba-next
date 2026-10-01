'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CommunityPost } from '@/lib/community-types';
import PostCard from './PostCard';
import CommentList from './CommentList';
import CommunityIcon from './CommunityIcon';
import styles from './PostThread.module.css';

export default function PostThread({ initialPost }: { initialPost: CommunityPost }) {
  const [post, setPost] = useState(initialPost);
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startDelete(() => {
      router.replace('/community');
      router.refresh();
    });
  };

  if (deleting) {
    return (
      <div className={styles.deletingState} role="status" aria-live="polite">
        <div className={styles.deletingSpinner} />
        <p>جارٍ حذف المنشور…</p>
      </div>
    );
  }

  return (
    <div className={styles.thread}>
      {/* ===== رأس الصفحة ===== */}
      <header className={styles.threadHeader}>
        <Link href="/community" className={styles.backLink}>
          <CommunityIcon name="back" size={16} />
          <span>العودة إلى المجتمع</span>
        </Link>

        <div className={styles.threadTitle}>
          <span className={styles.threadIcon}>
            <CommunityIcon name="comment" size={18} />
          </span>
          <div>
            <h1>منشور في مجتمع عُروبة</h1>
            <p>الحوار والتعليقات</p>
          </div>
        </div>
      </header>

      {/* ===== المنشور ===== */}
      <div className={styles.postWrap}>
        <PostCard
          post={post}
          detail
          onChange={setPost}
          onDelete={handleDelete}
        />
      </div>

      {/* ===== التعليقات ===== */}
      <div className={styles.commentsWrap}>
        <CommentList
          postId={post.id}
          onCountChange={(delta) =>
            setPost((current) => ({
              ...current,
              comments_count: Math.max(0, current.comments_count + delta),
            }))
          }
        />
      </div>
    </div>
  );
}