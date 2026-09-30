import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSocialProfile } from '@/app/community/social/actions';
import Feed from '@/app/components/community/Feed';
import Avatar from '@/app/components/community/Avatar';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import ProfileSocialActions from '@/app/components/community/ProfileSocialActions';
import styles from '@/app/components/community/Community.module.css';
import social from '@/app/components/community/Social.module.css';

type Props = { params: Promise<{ username: string }> };
const loadProfile = cache(getSocialProfile);
function routeUsername(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(routeUsername(username)).catch(() => null);
  if (!profile) return { title: 'العضو غير موجود | عُروبة', robots: { index: false } };
  return { title: `${profile.member.full_name || profile.member.username} | مجتمع عُروبة`, description: `الملف الشخصي وأعمال ${profile.member.full_name || profile.member.username} في مجتمع عُروبة.`, alternates: { canonical: `/community/user/${encodeURIComponent(username)}` } };
}

export default async function UserPostsPage({ params }: Props) {
  const { username } = await params;
  const profile = await loadProfile(routeUsername(username));
  if (!profile) notFound();
  const name = profile.member.full_name || profile.member.username || 'عضو عُروبة';
  return <div className={styles.narrow}><Link href="/community/members" className={`${styles.textLink} ${styles.back}`}><CommunityIcon name="back" />الأعضاء</Link><header className={social.profileHero}><div className={social.profileIdentity}><Avatar name={name} src={profile.member.avatar_url} size={88} className={social.profileAvatar} /><div><span className={styles.eyebrow}>{profile.member.community_role === 'writer' ? 'كاتب في عُروبة' : 'قارئ في عُروبة'}</span><h1>{name}</h1><span className={social.handle}>@{profile.member.username}</span></div></div><p>{profile.member.bio || 'عضو في مجتمع القرّاء والكتّاب.'}</p><div className={social.stats}><span><strong>{profile.posts}</strong> منشور</span><span><strong>{profile.followers}</strong> متابع</span><span><strong>{profile.following}</strong> يتابع</span></div><ProfileSocialActions memberId={profile.member.id} username={profile.member.username} isOwn={profile.isOwn} initialFollow={profile.isFollowing} initialBlocked={profile.isBlocked} /></header><h2 className={styles.sectionTitle}>منشورات {name}</h2><Feed username={profile.member.username} /></div>;
}
