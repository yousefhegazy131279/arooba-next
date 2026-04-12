'use client';

import { RatingSection } from './RatingSection';
import FavoriteButton from '@/app/components/FavoriteButton';
import styles from '../story-page.module.css';

interface NovelDetailsProps {
  novel: {
    id: string;
    title: string;
    author: string;
    description: string;
    cover?: string;
    category?: string;
    created_at: string;
    average_rating: number | null;
    chapters_count: number;
  };
}

const isNewNovel = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

const getCoverUrl = (coverPath: string | undefined): string | null => {
  if (!coverPath) return null;
  if (coverPath.startsWith('http') || coverPath.startsWith('/')) {
    return coverPath;
  }
  return `/covers/${coverPath}`;
};

export function NovelDetails({ novel }: NovelDetailsProps) {
  const isNew = isNewNovel(novel.created_at);
  const coverUrl = getCoverUrl(novel.cover);

  return (
    <div
      data-aos="fade-up"
      data-aos-duration="1200"
      className={styles.novelHeader}
      suppressHydrationWarning
    >
      <div className={styles.coverWrapper}>
        <div className={styles.novelCover}>
          <div className={styles.coverGlow}></div>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={novel.title}
              style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }}
              onError={(e) => console.error('Image load error:', e)}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>لا يوجد غلاف</span>
            </div>
          )}
        </div>
        {isNew && (
          <div
            className={styles.coverBadge}
            data-aos="zoom-in"
            data-aos-delay="400"
            suppressHydrationWarning
          >
            <span className={styles.badgeIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span>جديد</span>
          </div>
        )}
      </div>

      <div className={styles.novelInfo}>
        <div className={styles.infoHeader}>
          <h1 className={styles.novelTitle}>{novel.title}</h1>
          <div className={styles.titleDecoration}>
            <span></span><span></span><span></span>
          </div>
        </div>

        <div className={styles.novelMeta}>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </span>
            {novel.author || 'غير محدد'}
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 0 1 .586 1.414V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              </svg>
            </span>
            {novel.category || 'أدب'}
          </span>
        </div>

        <p className={styles.novelDescription}>{novel.description}</p>

        <div className={styles.novelStats}>
          <div
            className={styles.statCard}
            data-aos="zoom-in"
            data-aos-delay="300"
            suppressHydrationWarning
          >
            <span className={styles.statValue}>{novel.chapters_count}</span>
            <span className={styles.statLabel}>فصل</span>
          </div>
          <div
            className={styles.statCard}
            data-aos="zoom-in"
            data-aos-delay="400"
            suppressHydrationWarning
          >
            <RatingSection
              targetId={novel.id}
              targetType="novel"
              averageRating={novel.average_rating}
              showAverageOnly
            />
            <span className={styles.statLabel}>التقييم</span>
          </div>
          <div
            className={styles.statCard}
            data-aos="zoom-in"
            data-aos-delay="450"
            suppressHydrationWarning
          >
            <FavoriteButton novelId={novel.id} />
          </div>
        </div>

        <div
          className={styles.rateSection}
          data-aos="fade-up"
          data-aos-delay="500"
          suppressHydrationWarning
        >
          <span className={styles.rateLabel}>قيم هذه الرواية:</span>
          <RatingSection
            targetId={novel.id}
            targetType="novel"
            averageRating={novel.average_rating}
          />
        </div>
      </div>
    </div>
  );
}