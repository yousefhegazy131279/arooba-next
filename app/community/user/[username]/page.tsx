import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/app/community/actions';
import Feed from '@/app/components/community/Feed';
import Avatar from '@/app/components/community/Avatar';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import styles from '@/app/components/community/Community.module.css';

type Props = { params: Promise<{ username: string }> };
const loadProfile = cache(getPublicProfile);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username).catch(() => null);
  if (!profile) return { title: 'القارئ غير موجود | عُروبة', robots: { index: false } };
  return { title: `منشورات ${profile.full_name || profile.username} | عُروبة`, description: `آراء ومشاركات ${profile.full_name || profile.username} في مجتمع قرّاء عُروبة.`, alternates: { canonical: `/community/user/${encodeURIComponent(username)}` } };
}

export default async function UserPostsPage({ params }: Props) {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile) notFound();
  const name = profile.full_name || profile.username || 'قارئ عُروبة';
  return <div className={styles.narrow}><Link href="/community" className={`${styles.textLink} ${styles.back}`}><CommunityIcon name="back" />العودة إلى المجتمع</Link><header className={styles.hero}><div><div className={styles.cardHead}><Avatar name={name} src={profile.avatar_url} /><span className={styles.eyebrow}>من قرّاء عُروبة</span></div><h1>{name}</h1><p>أفكار ومشاركات في مجتمع القرّاء.</p></div></header><Feed username={username} /></div>;
}
