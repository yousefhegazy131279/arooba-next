import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost } from '@/app/community/actions';
import PostThread from '@/app/components/community/PostThread';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import styles from './post.module.css';

const loadPost = cache(getPost);
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPost(id).catch(() => null);
  if (!post) return { title: 'المنشور غير متاح | عُروبة', robots: { index: false } };
  const title = `منشور ${post.user?.full_name || post.user?.username || 'قارئ'} | مجتمع عُروبة`;
  const description = post.content.replace(/\s+/g, ' ').slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/community/post/${post.id}` },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.created_at,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const post = await loadPost(id);
  if (!post) notFound();

  return (
    <div className={styles.page}>
      {/* الخلفية */}
      <div className={styles.bg} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`}></div>
        <div className={`${styles.orb} ${styles.orb2}`}></div>
        <div className={styles.grid}></div>
      </div>

      <div className={styles.shell}>
        {/* زر العودة */}
        <Link href="/community" className={styles.backLink}>
          <CommunityIcon name="back" size={16} />
          <span>العودة إلى المجتمع</span>
        </Link>

        {/* رأس الصفحة */}
        <header className={styles.head}>
          <span className={styles.eyebrow}>مجتمع عُروبة</span>
          <h1>
            منشور في <span className={styles.highlight}>المجتمع</span>
          </h1>
        </header>

        {/* المنشور والتعليقات */}
        <PostThread initialPost={post} />
      </div>
    </div>
  );
}