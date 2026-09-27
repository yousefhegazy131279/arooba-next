import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost } from '@/app/community/actions';
import PostThread from '@/app/components/community/PostThread';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import styles from '@/app/components/community/Community.module.css';

const loadPost = cache(getPost);
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPost(id).catch(() => null);
  if (!post) return { title: 'المنشور غير متاح | عُروبة', robots: { index: false } };
  const title = `منشور ${post.user?.full_name || post.user?.username || 'قارئ'} | مجتمع عُروبة`;
  const description = post.content.replace(/\s+/g, ' ').slice(0, 160);
  return { title, description, alternates: { canonical: `/community/post/${post.id}` }, openGraph: { title, description, type: 'article', publishedTime: post.created_at } };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const post = await loadPost(id);
  if (!post) notFound();
  return <div className={styles.narrow}><Link href="/community" className={`${styles.textLink} ${styles.back}`}><CommunityIcon name="back" />العودة إلى المجتمع</Link><h1 className={styles.sectionTitle}>منشور في مجتمع عُروبة</h1><PostThread initialPost={post} /></div>;
}
