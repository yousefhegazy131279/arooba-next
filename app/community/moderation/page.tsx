import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import { getModerationReports, moderateReport } from '@/app/community/actions';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import styles from '@/app/components/community/Community.module.css';

export const metadata: Metadata = { title: 'إدارة بلاغات المجتمع | عُروبة', robots: { index: false, follow: false } };

async function moderate(formData: FormData) {
  'use server';
  const reportId = String(formData.get('reportId') || '');
  const action = String(formData.get('action') || '');
  if (!['hide', 'dismiss', 'restore'].includes(action)) throw new Error('إجراء الإشراف غير صالح');
  await moderateReport(reportId, action as 'hide' | 'dismiss' | 'restore');
}

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') notFound();
  const reports = await getModerationReports();
  return <div className={styles.narrow}>
    <Link href="/community" className={`${styles.textLink} ${styles.back}`}><CommunityIcon name="back" />العودة إلى المجتمع</Link>
    <header className={styles.hero}><div><span className={styles.eyebrow}>لوحة الإشراف</span><h1>بلاغات المجتمع</h1><p>راجع المحتوى المبلّغ عنه واتخذ الإجراء المناسب.</p></div></header>
    {reports.length === 0 ? <section className={`${styles.card} ${styles.state}`}><CommunityIcon name="shield" width={40} height={40} /><h2>لا توجد بلاغات للمراجعة</h2><p>المجتمع هادئ حالياً، وستظهر البلاغات الجديدة هنا.</p></section> : <div className={styles.feed}>{reports.map(report => <article className={styles.card} key={report.id}><div className={styles.cardHead}><CommunityIcon name="flag" /><div><strong>بلاغ {report.status === 'pending' ? 'قيد المراجعة' : report.status === 'reviewed' ? 'تمت مراجعته' : 'مرفوض'}</strong><time className={styles.meta} dateTime={report.created_at}>{new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.created_at))}</time></div></div><p className={styles.hint}><strong>السبب:</strong> {report.reason || 'لم يذكر سبباً'}</p>{report.post ? <><p className={styles.content}>{report.post.content}</p><Link className={styles.textLink} href={`/community/post/${report.post.id}`}>فتح المنشور</Link></> : <p className={styles.error}>المنشور محذوف أو غير متاح.</p>}<form action={moderate} className={styles.actions}><input type="hidden" name="reportId" value={report.id} /><button className={styles.button} name="action" value="hide">إخفاء المنشور</button><button className={styles.secondary} name="action" value="dismiss">رفض البلاغ</button><button className={styles.secondary} name="action" value="restore">إعادة الإظهار</button></form></article>)}</div>}
  </div>;
}
