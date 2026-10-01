import { cache } from 'react';
/* eslint-disable @next/next/no-img-element -- Novel covers use externally hosted URLs. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSocialProfile } from '@/app/community/social/actions';
import Feed from '@/app/components/community/Feed';
import Avatar from '@/app/components/community/Avatar';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import ProfileSocialActions from '@/app/components/community/ProfileSocialActions';
import styles from './profile.module.css';

type Props = { params: Promise<{ username: string }> };
const loadProfile = cache(getSocialProfile);

function routeUsername(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function coverUrl(value: string) {
  return value.startsWith('https://') || value.startsWith('http://') || value.startsWith('/')
    ? value
    : `/covers/${value}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(routeUsername(username)).catch(() => null);
  if (!profile) return { title: 'العضو غير موجود | عُروبة', robots: { index: false } };
  const name = profile.member.full_name || profile.member.username;
  return {
    title: `${name} | مجتمع عُروبة`,
    description: `الملف الشخصي وأعمال ${name} في مجتمع عُروبة.`,
    alternates: { canonical: `/community/user/${encodeURIComponent(username)}` },
  };
}

export default async function UserPostsPage({ params }: Props) {
  const { username } = await params;
  const profile = await loadProfile(routeUsername(username));
  if (!profile) notFound();

  const name = profile.member.full_name || profile.member.username || 'عضو عُروبة';
  const roleLabel = profile.member.community_role === 'writer' ? 'كاتب' : 'قارئ';
  const joined = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(profile.member.created_at));

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {/* ===== زر العودة ===== */}
        <Link href="/community/members" className={styles.backLink}>
          <CommunityIcon name="back" size={16} />
          <span>الأعضاء</span>
        </Link>

        {/* ===== بطاقة الملف الشخصي ===== */}
        <article className={styles.profileCard}>
          {/* الغلاف العلوي */}
          <div className={styles.cover} aria-hidden="true">
            <div className={styles.coverPattern}></div>
          </div>

          <div className={styles.body}>
            {/* الصورة + الأزرار */}
            <div className={styles.avatarRow}>
              <div className={styles.avatarWrap}>
                <Avatar
                  name={name}
                  src={profile.member.avatar_url}
                  size={96}
                  className={styles.avatar}
                />
                <span className={styles.roleBadge}>
                  <CommunityIcon name={profile.member.community_role === 'writer' ? 'edit' : 'book'} size={12} />
                  {roleLabel}
                </span>
              </div>

              <div className={styles.actions}>
                <ProfileSocialActions
                  memberId={profile.member.id}
                  username={profile.member.username}
                  isOwn={profile.isOwn}
                  initialFollow={profile.isFollowing}
                  initialBlocked={profile.isBlocked}
                />
              </div>
            </div>

            {/* المعلومات */}
            <header className={styles.identity}>
              <h1 className={styles.name}>{name}</h1>
              <span className={styles.handle}>@{profile.member.username}</span>
            </header>

            {/* النبذة */}
            <p className={styles.bio}>
              {profile.member.bio || 'عضو في مجتمع القرّاء والكتّاب.'}
            </p>

            {/* الإحصائيات */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <strong>{profile.posts.toLocaleString('ar')}</strong>
                <span>منشور</span>
              </div>
              <div className={styles.stat}>
                <strong>{profile.followers.toLocaleString('ar')}</strong>
                <span>متابع</span>
              </div>
              <div className={styles.stat}>
                <strong>{profile.following.toLocaleString('ar')}</strong>
                <span>يتابع</span>
              </div>
              <div className={styles.joined}>
                <CommunityIcon name="clock" size={13} />
                <span>انضم في {joined}</span>
              </div>
            </div>
          </div>
        </article>

        {/* ===== الرواية المفضلة ===== */}
        {profile.favoriteNovel ? (
          <section className={styles.favorite} aria-label="الرواية المفضلة">
            <span className={styles.favoriteBadge}>
              <CommunityIcon name="sparkle" size={13} />
              الرواية المفضلة لدى {name}
            </span>

            <div className={styles.favoriteBody}>
              {profile.favoriteNovel.cover ? (
                <img
                  src={coverUrl(profile.favoriteNovel.cover)}
                  alt={`غلاف ${profile.favoriteNovel.title}`}
                  className={styles.favoriteCover}
                />
              ) : (
                <span className={styles.favoritePlaceholder}>
                  <CommunityIcon name="book" size={36} />
                </span>
              )}

              <div className={styles.favoriteInfo}>
                <h2>{profile.favoriteNovel.title}</h2>
                <p>{profile.favoriteNovel.author}</p>
                <Link
                  className={styles.favoriteLink}
                  href={`/stories/${profile.favoriteNovel.id}`}
                >
                  اكتشف الرواية
                  <CommunityIcon name="back" size={14} />
                </Link>
              </div>
            </div>
          </section>
        ) : profile.isOwn ? (
          <section className={styles.favorite}>
            <span className={styles.favoriteBadge}>
              <CommunityIcon name="sparkle" size={13} />
              روايتك المفضلة
            </span>
            <div className={styles.favoriteBody}>
              <span className={styles.favoritePlaceholder}>
                <CommunityIcon name="book" size={36} />
              </span>
              <div className={styles.favoriteInfo}>
                <h2>ما الرواية التي تحبها أكثر؟</h2>
                <p>اخترها من مفضلاتك لتظهر هنا لزوار ملفك.</p>
                <Link className={styles.favoriteLink} href="/profile">
                  اختيار رواية مفضلة
                  <CommunityIcon name="back" size={14} />
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* ===== المنشورات ===== */}
        <section className={styles.postsSection}>
          <div className={styles.postsHeader}>
            <CommunityIcon name="comment" size={18} />
            <h2>منشورات {name}</h2>
            <span className={styles.postsCount}>
              {profile.posts.toLocaleString('ar')}
            </span>
          </div>

          <div className={styles.feedWrap}>
            <Feed username={profile.member.username} />
          </div>
        </section>
      </div>
    </div>
  );
}