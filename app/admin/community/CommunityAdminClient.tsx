'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { moderateReport } from '@/app/community/actions';
import AdminSidebar, { type AdminTabId } from '../components/AdminSidebar';
import adminStyles from '../Admin.module.css';
import styles from './CommunityAdmin.module.css';
import { deleteAdminCommunityPost, getAdminCommunityOverview, getAdminCommunityPosts, setAdminPostVisibility, type AdminPost, type CommunityOverview, type PostFilters } from './actions';

const initialFilters: PostFilters = { page: 0, role: 'all', visibility: 'all', search: '' };
const number = (value: number) => new Intl.NumberFormat('ar-EG').format(value);
const date = (value: string) => new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

function Leaderboard({ title, people, empty }: { title: string; people: CommunityOverview['topWriters']; empty: string }) {
  return <section className={styles.panel}>
    <div className={styles.panelHeading}><div><span className={styles.kicker}>آخر 30 يومًا</span><h2>{title}</h2></div><span className={styles.softIcon}>✦</span></div>
    {people.length ? <ol className={styles.leaderList}>{people.map((person, index) =>
      <li key={person.id}><span className={styles.rank}>{number(index + 1)}</span><div className={styles.leaderPerson}><strong>{person.name}</strong><small>{number(person.posts)} منشور · {number(person.comments)} تعليق · {number(person.reactions)} تقييم</small></div><span className={styles.score}>{number(person.score)} نقطة</span></li>
    )}</ol> : <p className={styles.emptySmall}>{empty}</p>}
    <p className={styles.scoringHint}>المنشور ٣ نقاط، التعليق نقطتان، والتقييم نقطة.</p>
  </section>;
}

export default function CommunityAdminClient({ initialOverview, initialPage }: { initialOverview: CommunityOverview; initialPage: { posts: AdminPost[]; total: number } }) {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();
  const [overview, setOverview] = useState(initialOverview);
  const [pageData, setPageData] = useState(initialPage);
  const [filters, setFilters] = useState<PostFilters>(initialFilters);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async (next: PostFilters) => {
    setLoading(true); setError(null);
    try {
      const [freshOverview, freshPage] = await Promise.all([getAdminCommunityOverview(), getAdminCommunityPosts(next)]);
      setOverview(freshOverview); setPageData(freshPage);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذّر تحديث البيانات.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (filters !== initialFilters) void refresh(filters);
  }, [filters, refresh]);

  async function perform(id: string, operation: () => Promise<unknown>, success: string) {
    setBusy(id); setError(null); setNotice(null);
    try {
      const result = await operation();
      if (result && typeof result === 'object' && 'mediaWarning' in result && result.mediaWarning) {
        setNotice('حُذف المنشور، لكن تعذّر تنظيف بعض ملفاته. راجع التخزين.');
      } else setNotice(success);
      await refresh(filters);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذّر تنفيذ الإجراء.'); }
    finally { setBusy(null); setDeleteTarget(null); }
  }

  const metrics = [
    { label: 'المشاركون', value: overview.participantsThisMonth, note: 'شاركوا خلال 30 يومًا', mark: '◉' },
    { label: 'الكتّاب', value: overview.writers, note: 'اختاروا صفة كاتب', mark: '✎' },
    { label: 'القرّاء', value: overview.readers, note: 'اختاروا صفة قارئ', mark: '◈' },
    { label: 'المنشورات', value: overview.posts, note: `${number(overview.visiblePosts)} ظاهر · ${number(overview.hiddenPosts)} مخفي`, mark: '▤' },
    { label: 'أعمال الكتّاب', value: overview.writerPosts, note: 'منشورات الكتّاب', mark: '▣' },
    { label: 'هذا الأسبوع', value: overview.postsThisWeek, note: 'منشورات جديدة', mark: '↗' },
    { label: 'التعليقات', value: overview.comments, note: 'نقاشات المجتمع', mark: '▧' },
    { label: 'بلاغات معلّقة', value: overview.pendingReports, note: 'تحتاج إلى مراجعة', mark: '!' },
  ];

  return <div className={`${adminStyles.adminPage} ${!isDark ? adminStyles.light : ''}`} dir="rtl">
    <div className={adminStyles.themeToggleWrapper}><button type="button" onClick={toggleTheme} className={adminStyles.themeToggleBtn} aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}>{isDark ? '☀️' : '🌙'}</button></div>
    <div className={adminStyles.heroBackground} aria-hidden="true"><div className={`${adminStyles.gradientOrb} ${adminStyles.orb1}`} /><div className={`${adminStyles.gradientOrb} ${adminStyles.orb2}`} /><div className={adminStyles.gridOverlay} /></div>
    <div className={adminStyles.layoutWithSidebar}>
      <AdminSidebar activeTab="community" onTabChange={(tab: AdminTabId) => router.push(`/admin?tab=${tab}`)} />
      <main className={adminStyles.mainContent}><div className={adminStyles.contentContainer}>
        <div className={styles.topline}><Link href="/admin">لوحة الإدارة</Link><span>›</span><span>المجتمع</span></div>
        <header className={styles.hero}>
          <div><span className={styles.kicker}>مركز إدارة المجتمع</span><h1>نبض المجتمع، أمامك.</h1><p>راجع ما يُنشر، تعرّف إلى الأعضاء الأكثر مشاركة، واتخذ قرار الإشراف من مكان واحد.</p></div>
          <div className={styles.heroActions}><Link href="/community" target="_blank" rel="noopener noreferrer" className={styles.outlineButton}>عرض المجتمع ↗</Link><button type="button" onClick={() => void refresh(filters)} disabled={loading} className={styles.primaryButton}>تحديث البيانات</button></div>
        </header>
        {error && <div className={styles.error} role="alert">{error}<button type="button" onClick={() => setError(null)} aria-label="إغلاق">×</button></div>}
        {notice && <div className={styles.notice} role="status">{notice}<button type="button" onClick={() => setNotice(null)} aria-label="إغلاق">×</button></div>}
        <section className={styles.metrics} aria-label="إحصاءات المجتمع">{metrics.map(metric => <div className={styles.metric} key={metric.label}><span className={styles.metricIcon} aria-hidden="true">{metric.mark}</span><span className={styles.metricLabel}>{metric.label}</span><strong>{number(metric.value)}</strong><small>{metric.note}</small></div>)}</section>
        <section className={styles.insights} aria-label="نشاط المجتمع">
          <div className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.kicker}>آخر مشاركة</span><h2>آخر من نشر</h2></div><span className={styles.softIcon}>↗</span></div>
            {overview.latestPublisher ? <div className={styles.latest}><div className={styles.latestAvatar}>{overview.latestPublisher.name.slice(0, 1)}</div><div><strong>{overview.latestPublisher.name}</strong><time dateTime={overview.latestPublisher.at}>{date(overview.latestPublisher.at)}</time>{overview.latestPublisher.hidden ? <small>المنشور مخفي من العامة</small> : <Link href={`/community/post/${overview.latestPublisher.postId}`} target="_blank">عرض المنشور ↗</Link>}</div></div> : <p className={styles.emptySmall}>لم يُنشر أي منشور بعد.</p>}
            <div className={styles.reactionStrip}><span>أوافق <b>{number(overview.approvals)}</b></span><span>عادي <b>{number(overview.meh)}</b></span><span>لا يعجبني <b>{number(overview.boos)}</b></span></div>
          </div>
          <Leaderboard title="الكتّاب الأكثر نشاطًا" people={overview.topWriters} empty="لا يوجد نشاط للكتّاب خلال آخر 30 يومًا." />
          <Leaderboard title="القرّاء الأكثر نشاطًا" people={overview.topReaders} empty="لا يوجد نشاط للقرّاء خلال آخر 30 يومًا." />
        </section>
        <section className={styles.panel} aria-labelledby="reports-title"><div className={styles.sectionHead}><div><span className={styles.kicker}>تحتاج قرارك</span><h2 id="reports-title">أحدث البلاغات المعلّقة</h2></div><div className={styles.headingActions}><span className={styles.counter}>{number(overview.pendingReports)} بلاغ</span><Link href="/community/moderation">عرض جميع البلاغات ↗</Link></div></div>
          {overview.reports.length ? <div className={styles.reportList}>{overview.reports.map(report => <article key={report.id} className={styles.report}><div><strong>{report.reason}</strong><p>{report.postContent ? report.postContent.slice(0, 120) : 'المنشور غير متاح'}</p><time dateTime={report.created_at}>{date(report.created_at)}</time></div><div className={styles.rowActions}><Link href={`/community/post/${report.post_id}`} target="_blank">فتح</Link><button type="button" disabled={!!busy} onClick={() => void perform(report.id, () => moderateReport(report.id, 'hide'), 'أُخفي المنشور وعولج البلاغ.')}>إخفاء</button><button type="button" disabled={!!busy} onClick={() => void perform(report.id, () => moderateReport(report.id, 'dismiss'), 'رُفض البلاغ.')}>رفض البلاغ</button></div></article>)}</div> : <p className={styles.emptySmall}>لا توجد بلاغات تنتظر المراجعة.</p>}
        </section>
        <section className={styles.panel} aria-labelledby="posts-title"><div className={styles.sectionHead}><div><span className={styles.kicker}>إشراف مباشر</span><h2 id="posts-title">كل منشورات المجتمع</h2><p>المنشورات الظاهرة والمخفية متاحة هنا للإدارة.</p></div><span className={styles.counter}>{number(pageData.total)} منشور</span></div>
          <form className={styles.filters} onSubmit={event => { event.preventDefault(); setFilters({ ...filters, page: 0, search: draft.trim() }); }}>
            <label><span>ابحث في نص المنشور</span><input value={draft} maxLength={100} onChange={event => setDraft(event.target.value)} placeholder="كلمة من المنشور..." /></label>
            <label><span>نوع العضو</span><select value={filters.role} onChange={event => setFilters({ ...filters, page: 0, role: event.target.value as PostFilters['role'] })}><option value="all">الكل</option><option value="writer">الكتّاب</option><option value="reader">القرّاء</option></select></label>
            <label><span>الظهور</span><select value={filters.visibility} onChange={event => setFilters({ ...filters, page: 0, visibility: event.target.value as PostFilters['visibility'] })}><option value="all">الكل</option><option value="visible">ظاهر</option><option value="hidden">مخفي</option></select></label>
            <button type="submit" className={styles.primaryButton}>بحث</button>
          </form>
          {loading && <p className={styles.loading} role="status">جارٍ تحديث البيانات...</p>}
          {pageData.posts.length ? <div className={styles.postList}>{pageData.posts.map(post => <article key={post.id} className={styles.postCard}>
            <div className={styles.postTop}><div className={styles.postAuthor}><span className={styles.avatar}>{(post.author?.full_name || post.author?.username || 'ع').slice(0, 1)}</span><div><strong>{post.author?.full_name || post.author?.username || 'مستخدم عُروبة'}</strong><small>{post.author_kind === 'writer' ? 'كاتب' : 'قارئ'} · {date(post.created_at)}</small></div></div><div className={styles.badges}><span className={post.is_hidden ? styles.hiddenBadge : styles.visibleBadge}>{post.is_hidden ? 'مخفي' : 'ظاهر'}</span>{post.pendingReports > 0 && <span className={styles.reportBadge}>{number(post.pendingReports)} بلاغ</span>}</div></div>
            <p className={styles.postText}>{post.content}</p><div className={styles.postMeta}><span>{number(post.attachments.length)} مرفقات</span><span>{number(post.comments_count)} تعليق</span><span>{number(post.likes_count)} إعجاب</span><span>أوافق {number(post.reactions.approve)} · عادي {number(post.reactions.meh)} · لا يعجبني {number(post.reactions.boo)}</span></div>
            <div className={styles.rowActions}>{post.is_hidden ? <span className={styles.hiddenNote}>المنشور مخفي من العامة</span> : <Link href={`/community/post/${post.id}`} target="_blank">فتح المنشور ↗</Link>}<button type="button" disabled={!!busy} onClick={() => void perform(post.id, () => setAdminPostVisibility(post.id, !post.is_hidden), post.is_hidden ? 'أُعيد إظهار المنشور.' : 'أُخفي المنشور.')}>{post.is_hidden ? 'إعادة الإظهار' : 'إخفاء'}</button><button type="button" className={styles.dangerButton} disabled={!!busy} onClick={() => setDeleteTarget(post)}>حذف نهائي</button></div>
          </article>)}</div> : <p className={styles.emptySmall}>لا توجد منشورات تطابق البحث أو التصفية.</p>}
          <div className={styles.pagination}><button type="button" disabled={loading || filters.page === 0} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>الصفحة السابقة</button><span>صفحة {number(filters.page + 1)} من {number(Math.max(1, Math.ceil(pageData.total / 12)))}</span><button type="button" disabled={loading || (filters.page + 1) * 12 >= pageData.total} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>الصفحة التالية</button></div>
        </section>
      </div></main>
    </div>
    {deleteTarget && <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="delete-title"><span className={styles.dangerMark}>!</span><h2 id="delete-title">حذف المنشور نهائيًا؟</h2><p>سيُحذف المنشور وتعليقاته وتقييماته وملفاته من المجتمع. لا يمكن التراجع عن هذا الإجراء.</p><blockquote>{deleteTarget.content.slice(0, 150)}</blockquote><div className={styles.modalActions}><button type="button" onClick={() => setDeleteTarget(null)} disabled={!!busy}>إلغاء</button><button type="button" className={styles.dangerButton} disabled={!!busy} onClick={() => void perform(deleteTarget.id, () => deleteAdminCommunityPost(deleteTarget.id), 'حُذف المنشور نهائيًا.')}>{busy ? 'جارٍ الحذف...' : 'تأكيد الحذف'}</button></div></div></div>}
  </div>;
}
