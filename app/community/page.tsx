import type { Metadata } from 'next';
import CommunityFeedFilters from '@/app/components/community/CommunityFeedFilters';
import Link from 'next/link';
import { CommunityLinks, CreatePostLink } from '@/app/components/community/CommunityLinks';
import styles from '@/app/components/community/Community.module.css';

export function generateMetadata(): Metadata {
  return {
    title: 'مجتمع القرّاء والكتّاب | عُروبة',
    description: 'مساحة لعرض أعمال الكتّاب الهواة وتبادل آراء القرّاء وقراءة الكتب.',
    alternates: { canonical: '/community' },
  };
}

const WritersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
    <path d="M3 21h18" />
  </svg>
);
const ReadersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export default function CommunityPage() {
  return (
    <div className={styles.communityPage}>
      {/* ===== Hero ===== */}
      <header className={styles.hero}>
        <div className={styles.heroBackground}>
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
            <span className={`${styles.shape} ${styles.shape2}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </span>
            <span className={`${styles.shape} ${styles.shape3}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className={`${styles.shape} ${styles.shape4}`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
        </div>

        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>مجتمع عُروبة</span>
          <h1>
            حكايتك تستحق <span className={styles.highlight}>قارئًا</span>.
          </h1>
          <p>
            انشر نصك أو كتابك، واقرأ أعمال المواهب الجديدة. لكل عمل مكان، ولكل رأي قيمة.
          </p>
          <div className={styles.heroActions}>
            <CreatePostLink />
            <Link className={styles.textLink} href="/community/members">
              تعرّف إلى الأعضاء
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <div className={styles.columns}>
        <main className={styles.main}>
          <CommunityFeedFilters />
        </main>

        <aside className={styles.side}>
          {/* Card 1: Two roles */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>
                <UsersIcon />
              </span>
              <h2>مساحتان، مجتمع واحد</h2>
            </div>

            <div className={styles.roleCards}>
              <div className={styles.roleCard}>
                <span className={styles.roleIcon}>
                  <WritersIcon />
                </span>
                <h3>الكتّاب</h3>
                <p>يعرضون نصوصهم وصورهم وكتبهم للقراءة صفحةً صفحة.</p>
              </div>

              <div className={styles.roleCard}>
                <span className={styles.roleIcon}>
                  <ReadersIcon />
                </span>
                <h3>القرّاء</h3>
                <p>يناقشون الأعمال ويقيّمونها: أوافق، عادي، ولا يعجبني.</p>
              </div>
            </div>

            <p className={styles.hint}>
              اختر نوع عضويتك قبل النشر ويمكنك تغييره لاحقاً. تابع من يعجبك، وزر ملفه، وتبادل معه الرسائل في محادثة خاصة.
            </p>

            <CommunityLinks />
          </section>

          {/* Card 2: Guidelines */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>
                <ShieldIcon />
              </span>
              <h2>ليظل الحوار جميلاً</h2>
            </div>

            <ul className={styles.guidelines}>
              <li>ناقش الأفكار باحترام، وتقبّل اختلاف الأذواق.</li>
              <li>نبّه إلى حرق الأحداث قبل مشاركتها.</li>
              <li>انسب الاقتباسات إلى أصحابها، وانشر ما تملك حق مشاركته.</li>
              <li>أبلغ عن المحتوى المسيء ليساعدك فريق الإشراف.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}