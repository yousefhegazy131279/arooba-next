import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import { getModerationReports, moderateReport } from '@/app/community/actions';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import styles from './moderation.module.css';

export const metadata: Metadata = {
  title: 'إدارة بلاغات المجتمع | عُروبة',
  robots: { index: false, follow: false },
};

async function moderate(formData: FormData) {
  'use server';
  const reportId = String(formData.get('reportId') || '');
  const action = String(formData.get('action') || '');
  if (!['hide', 'dismiss', 'restore'].includes(action)) {
    throw new Error('إجراء الإشراف غير صالح');
  }
  await moderateReport(reportId, action as 'hide' | 'dismiss' | 'restore');
}

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const FlagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ArrowBackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: 'قيد المراجعة', color: 'pending' },
  reviewed: { text: 'تمت مراجعته', color: 'reviewed' },
  dismissed: { text: 'مرفوض', color: 'dismissed' },
};

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') notFound();

  const reports = await getModerationReports();

  const pending = reports.filter((r) => r.status === 'pending').length;
  const reviewed = reports.filter((r) => r.status === 'reviewed').length;
  const dismissed = reports.filter((r) => r.status === 'dismissed').length;

  return (
    <div className={styles.page}>
      {/* ===== الخلفية المتحركة ===== */}
      <div className={styles.bg} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`}></div>
        <div className={`${styles.orb} ${styles.orb2}`}></div>
        <div className={styles.grid}></div>
      </div>

      <div className={styles.shell}>
        {/* زر العودة */}
        <Link href="/community" className={styles.backLink}>
          <ArrowBackIcon />
          <span>العودة إلى المجتمع</span>
        </Link>

        {/* الهيدر */}
        <header className={styles.hero}>
          <div className={styles.heroIcon}>
            <ShieldIcon />
          </div>
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>لوحة الإشراف</span>
            <h1>
              بلاغات <span className={styles.highlight}>المجتمع</span>
            </h1>
            <p>راجع المحتوى المبلّغ عنه واتخذ الإجراء المناسب.</p>
          </div>
        </header>

        {/* إحصائيات */}
        {reports.length > 0 && (
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={`${styles.statDot} ${styles.dotPending}`} />
              <div>
                <strong>{pending}</strong>
                <span>قيد المراجعة</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statDot} ${styles.dotReviewed}`} />
              <div>
                <strong>{reviewed}</strong>
                <span>تمت مراجعته</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statDot} ${styles.dotDismissed}`} />
              <div>
                <strong>{dismissed}</strong>
                <span>مرفوض</span>
              </div>
            </div>
          </div>
        )}

        {/* القائمة */}
        {reports.length === 0 ? (
          <section className={styles.empty}>
            <div className={styles.emptyIcon}>
              <ShieldIcon />
            </div>
            <h2>لا توجد بلاغات للمراجعة</h2>
            <p>المجتمع هادئ حالياً، وستظهر البلاغات الجديدة هنا.</p>
          </section>
        ) : (
          <div className={styles.list}>
            {reports.map((report) => {
              const status = statusLabels[report.status] || statusLabels.pending;
              return (
                <article key={report.id} className={styles.card}>
                  {/* رأس البطاقة */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <span className={styles.flagIcon}>
                        <FlagIcon />
                      </span>
                      <div className={styles.cardMeta}>
                        <span className={`${styles.status} ${styles[status.color]}`}>
                          {status.text}
                        </span>
                        <span className={styles.date}>
                          <ClockIcon />
                          {new Intl.DateTimeFormat('ar-EG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(report.created_at))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* سبب البلاغ */}
                  <div className={styles.reason}>
                    <span className={styles.reasonLabel}>السبب:</span>
                    <span className={styles.reasonText}>
                      {report.reason || 'لم يذكر سبباً'}
                    </span>
                  </div>

                  {/* محتوى المنشور */}
                  {report.post ? (
                    <div className={styles.post}>
                      <p className={styles.postContent}>{report.post.content}</p>
                      <Link
                        className={styles.postLink}
                        href={`/community/post/${report.post.id}`}
                      >
                        فتح المنشور
                        <ArrowBackIcon />
                      </Link>
                    </div>
                  ) : (
                    <div className={styles.postMissing}>
                      <span>⚠️</span>
                      <span>المنشور محذوف أو غير متاح.</span>
                    </div>
                  )}

                  {/* الأزرار */}
                  <form action={moderate} className={styles.actions}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <button
                      className={`${styles.actionBtn} ${styles.hideBtn}`}
                      name="action"
                      value="hide"
                    >
                      <EyeOffIcon />
                      إخفاء المنشور
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.dismissBtn}`}
                      name="action"
                      value="dismiss"
                    >
                      <CheckIcon />
                      رفض البلاغ
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.restoreBtn}`}
                      name="action"
                      value="restore"
                    >
                      <RefreshIcon />
                      إعادة الإظهار
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}