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
  const userId = useAuthStore(state => state.user?.id);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<CommunityCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const generation = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async (reset = false) => {
    if (busy.current && !reset) return;
    const request = reset ? ++generation.current : generation.current;
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      const page = await getFeedPage(10, reset ? null : cursor, username, kind);
      if (request !== generation.current) return;
      setPosts(previous => {
        const combined = reset ? page.posts : [...previous, ...page.posts];
        return [...new Map(combined.map(post => [post.id, post])).values()];
      });
      setCursor(page.nextCursor);
      setHasMore(!!page.nextCursor);
    } catch (err) {
      if (request === generation.current) setError(err instanceof Error ? err.message : 'تعذر تحميل المنشورات. حاول مرة أخرى.');
    } finally {
      if (request === generation.current) { busy.current = false; setLoading(false); }
    }
  }, [cursor, username, kind]);

  // Each identity/filter change starts an independent cursor stream; stale responses are ignored.
  useEffect(() => {
    void load(true);
    return () => { generation.current += 1; busy.current = false; };
    // A new cursor must not restart the feed. It is only used by load-more requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, userId, kind]);

  useEffect(() => {
    if (!sentinel.current || loading || error || !hasMore) return;
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) void load(); }, { rootMargin: '240px' });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, error, hasMore, load]);

  return <section className={styles.feed} aria-label={username ? 'منشورات القارئ' : 'أحدث منشورات المجتمع'}>
    {posts.map(post => <PostCard key={post.id} post={post} onChange={updated => setPosts(current => current.map(item => item.id === updated.id ? updated : item))} onDelete={id => setPosts(current => current.filter(item => item.id !== id))} />)}
    {loading && <FeedSkeleton count={posts.length ? 1 : 3} />}
    {error && <div className={`${styles.card} ${styles.state}`} role="alert"><h2>تعذر تحميل المشاركات</h2><p>{error}</p><button className={styles.secondary} onClick={() => void load(posts.length === 0)}>إعادة المحاولة</button></div>}
    {!loading && !error && posts.length === 0 && <div className={`${styles.card} ${styles.state}`}><CommunityIcon name="comment" width={40} height={40} /><h2>{username ? 'لم يشارك هذا القارئ بعد' : 'لكل حكاية حديث يبدأ بها'}</h2><p>{username ? 'ستظهر منشوراته هنا عندما يشاركها.' : 'كن أول من يفتح حواراً حول قصة أحبها.'}</p>{!username && <Link href={userId ? '/community/create' : '/login'} className={styles.button}>{userId ? 'اكتب أول مشاركة' : 'سجّل الدخول للمشاركة'}</Link>}</div>}
    <div ref={sentinel} aria-hidden="true" />
    {!loading && !error && hasMore && posts.length > 0 && <button className={styles.secondary} onClick={() => void load()}>تحميل المزيد</button>}
    {!loading && !error && !hasMore && posts.length > 0 && <p className={styles.loadingMore}>وصلت إلى آخر المشاركات</p>}
  </section>;
}
