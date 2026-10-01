import type { Metadata } from 'next';
import Link from 'next/link';
import { getMemberDirectory } from '@/app/community/social/actions';
import MemberDirectory from '@/app/components/community/MemberDirectory';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import styles from '@/app/components/community/Community.module.css';

export const metadata: Metadata = {
  title: 'أعضاء المجتمع | عُروبة',
  description: 'تعرف إلى قرّاء وكتّاب مجتمع عُروبة وتابع أعمالهم.',
  alternates: { canonical: '/community/members' },
};

export default async function MembersPage() {
  const initial = await getMemberDirectory({ search: '', role: 'all', page: 0 });

  // استخراج إحصائيات بسيطة من النتائج الأولية (إن توفرت)
  const total = (initial as any)?.total ?? (initial as any)?.members?.length ?? 0;
  const writers = (initial as any)?.members?.filter((m: any) => m.community_role === 'writer').length ?? 0;
  const readers = (initial as any)?.members?.filter((m: any) => m.community_role === 'reader').length ?? 0;

  return (
    <div className={styles.communityPage}>
      {/* ===== الخلفية المتحركة ===== */}
      <div className={styles.membersBackground}>
        <div className={`${styles.bgOrb} ${styles.orb1}`}></div>
        <div className={`${styles.bgOrb} ${styles.orb2}`}></div>
        <div className={styles.gridOverlay}></div>
        <div className={styles.floatingShapes}>
          <span className={`${styles.shape} ${styles.shape1}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape2}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 3l4 4-7 7H10v-4l7-7z" />
              <path d="M3 21h18" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape3}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape4}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.membersShell}>
        {/* ===== زر العودة ===== */}
        <Link href="/community" className={`${styles.textLink} ${styles.back}`}>
          <CommunityIcon name="back" />
          العودة إلى المجتمع
        </Link>

        {/* ===== الهيرو ===== */}
        <header className={styles.membersHero}>
          <div className={styles.membersHeroInner}>
            <span className={styles.eyebrow}>مجتمع عُروبة / الأعضاء</span>
            <h1>
              تعرّف إلى من <span className={styles.highlight}>يشاركك</span> القراءة
            </h1>
            <p>
              اكتشف كتّاباً جدداً، تابع أعمالهم، وتواصل مع القرّاء والكتّاب مباشرة.
            </p>

            {/* ===== إحصائيات سريعة ===== */}
            {(total > 0 || writers > 0 || readers > 0) && (
              <div className={styles.membersStats}>
                <div className={styles.membersStat}>
                  <span className={styles.membersStatIcon}>
                    <CommunityIcon name="users" size={18} />
                  </span>
                  <div>
                    <span className={styles.membersStatNumber}>{total.toLocaleString('ar')}</span>
                    <span className={styles.membersStatLabel}>عضو</span>
                  </div>
                </div>

                <div className={styles.membersStatDivider} />

                <div className={styles.membersStat}>
                  <span className={styles.membersStatIcon}>
                    <CommunityIcon name="edit" size={18} />
                  </span>
                  <div>
                    <span className={styles.membersStatNumber}>{writers.toLocaleString('ar')}</span>
                    <span className={styles.membersStatLabel}>كاتب</span>
                  </div>
                </div>

                <div className={styles.membersStatDivider} />

                <div className={styles.membersStat}>
                  <span className={styles.membersStatIcon}>
                    <CommunityIcon name="book" size={18} />
                  </span>
                  <div>
                    <span className={styles.membersStatNumber}>{readers.toLocaleString('ar')}</span>
                    <span className={styles.membersStatLabel}>قارئ</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ===== شريط البحث والتصفية ===== */}
        <div className={styles.membersToolbar}>
          <div className={styles.membersToolbarInner}>
            <span className={styles.membersToolbarIcon}>
              <CommunityIcon name="search" size={20} />
            </span>
            <p className={styles.membersToolbarHint}>
              ابحث بالاسم، أو صفِّ حسب الصفة — كاتب أو قارئ.
            </p>
          </div>
        </div>

        {/* ===== دليل الأعضاء ===== */}
        <MemberDirectory initial={initial} />
      </div>
    </div>
  );
}