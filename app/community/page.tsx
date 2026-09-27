import type { Metadata } from 'next';
import Feed from '@/app/components/community/Feed';
import { CommunityLinks, CreatePostLink } from '@/app/components/community/CommunityLinks';
import styles from '@/app/components/community/Community.module.css';

export function generateMetadata(): Metadata {
  return { title: 'مجتمع القرّاء | عُروبة', description: 'مساحة تجمع قرّاء عُروبة لمشاركة الانطباعات والتوصيات والنقاش حول القصص والروايات العالمية.', alternates: { canonical: '/community' } };
}

export default function CommunityPage() {
  return <><header className={styles.hero}><div><span className={styles.eyebrow}>عُروبة / مساحة القرّاء</span><h1>الحكاية تستمر هنا.</h1><p>انطباع يبقى، سؤال يفتح حواراً، وقصص تقرّبنا. شارك ما تركته الكتب فيك.</p></div><CreatePostLink /></header><div className={styles.columns}><Feed /><aside className={styles.side}><section className={styles.card}><h2>بين القرّاء</h2><p className={styles.hint}>لكل قارئ زاوية مختلفة. هنا نتبادل ترشيحاتنا ونمنح الحكايات حياةً أخرى بعد الصفحة الأخيرة.</p><CommunityLinks /></section><section className={styles.card}><h2>ليظل الحوار جميلاً</h2><ul className={styles.guidelines}><li>ناقش الأفكار باحترام، وتقبّل اختلاف الأذواق.</li><li>نبّه إلى حرق الأحداث قبل مشاركتها.</li><li>انسب الاقتباسات إلى أصحابها.</li><li>أبلغ عن المحتوى المسيء ليساعدك فريق الإشراف.</li></ul></section></aside></div></>;
}
