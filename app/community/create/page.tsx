import type { Metadata } from 'next';
import Link from 'next/link';
import CreatePostForm from '@/app/components/community/CreatePostForm';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import styles from '@/app/components/community/Community.module.css';

export function generateMetadata(): Metadata {
  return {
    title: 'منشور جديد | مجتمع عُروبة',
    description: 'شارك قرّاء عُروبة أفكارك وتوصياتك الأدبية.',
    robots: { index: false, follow: true },
  };
}

export default function CreatePostPage() {
  return (
    <div className={styles.communityPage}>
      {/* ===== الخلفية المتحركة ===== */}
      <div className={styles.createBackground}>
        <div className={`${styles.bgOrb} ${styles.orb1}`}></div>
        <div className={`${styles.bgOrb} ${styles.orb2}`}></div>
        <div className={styles.gridOverlay}></div>
        <div className={styles.floatingShapes}>
          <span className={`${styles.shape} ${styles.shape1}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 3l4 4-7 7H10v-4l7-7z" />
              <path d="M3 21h18" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape3}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.narrow}>
        {/* ===== زر العودة ===== */}
        <Link
          href="/community"
          className={`${styles.textLink} ${styles.back}`}
        >
          <CommunityIcon name="back" />
          العودة إلى المجتمع
        </Link>

        {/* ===== الهيرو ===== */}
        <header className={styles.createHero}>
          <div className={styles.createHeroInner}>
            <span className={styles.eyebrow}>مساحة لأفكارك</span>
            <h1>
              ابدأ <span className={styles.highlight}>حواراً</span>.
            </h1>
            <p>
              ما الذي قرأته وأحببت أن تشاركه؟ انشر انطباعاً، اقتباساً، أو سؤالاً يفتح نقاشاً مع القرّاء.
            </p>
          </div>
        </header>

        {/* ===== دعوة لمساحة الكتابة ===== */}
        <Link href="/write" className={styles.writeInvite}>
          <span className={styles.writeInviteIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 3l4 4-7 7H10v-4l7-7z" />
              <path d="M3 21h18" />
            </svg>
          </span>
          <span className={styles.writeInviteText}>
            <strong>تكتب عملاً طويلاً؟</strong>
            <span>افتح مساحة الكتابة وأنشئ فصوله هناك</span>
          </span>
          <span className={styles.writeInviteArrow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </span>
        </Link>

        {/* ===== نموذج الإنشاء ===== */}
        <CreatePostForm />
      </div>
    </div>
  );
}