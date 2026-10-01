'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getFeedPage } from '@/app/community/actions';
import { useAuthStore } from '@/app/stores/useAuthStore';
import type { CommunityCursor, CommunityPost, CommunityRole } from '@/lib/community-types';
import CommunityIcon from './CommunityIcon';
import FeedSkeleton from './FeedSkeleton';
import PostCard from './PostCard';
import styles from './Community.module.css';

export default function Feed({ username, kind }: { username?: string; kind?: CommunityRole }) {
  const userId = useAuthStore((state) => state.user?.id);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<CommunityCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const generation = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (reset = false) => {
      if (busy.current && !reset) return;
      const request = reset ? ++generation.current : generation.current;
      busy.current = true;
      setLoading(true);
      setError('');
      try {
        const page = await getFeedPage(10, reset ? null : cursor, username, kind);
        if (request !== generation.current) return;
        setPosts((previous) => {
          const combined = reset ? page.posts : [...previous, ...page.posts];
          return [...new Map(combined.map((post) => [post.id, post])).values()];
        });
        setCursor(page.nextCursor);
        setHasMore(!!page.nextCursor);
      } catch (err) {
        if (request === generation.current)
          setError(
            err instanceof Error ? err.message : 'تعذر تحميل المنشورات. حاول مرة أخرى.'
          );
      } finally {
        if (request === generation.current) {
          busy.current = false;
          setLoading(false);
        }
      }
    },
    [cursor, username, kind]
  );

  useEffect(() => {
    void load(true);
    return () => {
      generation.current += 1;
      busy.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, userId, kind]);

  useEffect(() => {
    if (!sentinel.current || loading || error || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void load();
      },
      { rootMargin: '240px' }
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, error, hasMore, load]);

  /* ===== حالة فارغة ===== */
  const emptyTitle = username ? 'لم يشارك هذا القارئ بعد' : 'لكل حكاية حديث يبدأ بها';
  const emptyText = username
    ? 'ستظهر منشوراته هنا عندما يشاركها.'
    : 'كن أول من يفتح حواراً حول قصة أحبها.';
  const emptyCTA = username
    ? null
    : userId
    ? { href: '/community/create', label: 'اكتب أول مشاركة' }
    : { href: '/login', label: 'سجّل الدخول للمشاركة' };

  return (
    <section
      className={styles.feed}
      aria-label={username ? 'منشورات القارئ' : 'أحدث منشورات المجتمع'}
      aria-busy={loading}
    >
      {/* ===== المنشورات ===== */}
      {posts.map((post) => (
        <div key={post.id} className={styles.feedItem}>
          <PostCard
            post={post}
            onChange={(updated) =>
              setPosts((current) =>
                current.map((item) => (item.id === updated.id ? updated : item))
              )
            }
            onDelete={(id) =>
              setPosts((current) => current.filter((item) => item.id !== id))
            }
          />
        </div>
      ))}

      {/* ===== التحميل ===== */}
      {loading && <FeedSkeleton count={posts.length ? 1 : 3} />}

      {/* ===== الخطأ ===== */}
      {error && (
        <div className={styles.feedState} role="alert">
          <div className={styles.feedStateIconDanger}>
            <CommunityIcon name="flag" size={28} />
          </div>
          <h2>تعذر تحميل المشاركات</h2>
          <p>{error}</p>
          <button
            className={styles.feedStateBtn}
            onClick={() => void load(posts.length === 0)}
          >
            <CommunityIcon name="search" size={15} />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* ===== فارغ ===== */}
      {!loading && !error && posts.length === 0 && (
        <div className={styles.feedState}>
          <div className={styles.feedStateIcon}>
            <CommunityIcon name="comment" size={32} />
          </div>
          <h2>{emptyTitle}</h2>
          <p>{emptyText}</p>
          {emptyCTA && (
            <Link href={emptyCTA.href} className={styles.feedStateBtn}>
              <CommunityIcon name="plus" size={15} />
              <span>{emptyCTA.label}</span>
            </Link>
          )}
        </div>
      )}

      {/* ===== Sentinel للـ Infinite Scroll ===== */}
      <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />

      {/* ===== تحميل المزيد ===== */}
      {!loading && !error && hasMore && posts.length > 0 && (
        <div className={styles.feedMoreWrap}>
          <button className={styles.feedMoreBtn} onClick={() => void load()}>
            <span>تحميل المزيد</span>
            <CommunityIcon name="back" size={15} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      )}

      {/* ===== نهاية القائمة ===== */}
      {!loading && !error && !hasMore && posts.length > 0 && (
        <div className={styles.feedEnd}>
          <span className={styles.feedEndLine} />
          <span className={styles.feedEndText}>
            <CommunityIcon name="check" size={13} />
            وصلت إلى آخر المشاركات
          </span>
          <span className={styles.feedEndLine} />
        </div>
      )}
    </section>
  );
}