import type { Metadata } from 'next';
import CommunityFeedFilters from '@/app/components/community/CommunityFeedFilters';
import { CommunityLinks, CreatePostLink } from '@/app/components/community/CommunityLinks';
import styles from '@/app/components/community/Community.module.css';

export function generateMetadata(): Metadata {
  return { title: 'مجتمع القرّاء والكتّاب | عُروبة', description: 'مساحة لعرض أعمال الكتّاب الهواة وتبادل آراء القرّاء وقراءة الكتب.', alternates: { canonical: '/community' } };
}

export default function CommunityPage() {
  return <><header className={styles.hero}><div><span className={styles.eyebrow}>عُروبة / مجتمع القرّاء والكتّاب</span><h1>حكايتك تستحق قارئًا.</h1><p>انشر نصك أو كتابك، واقرأ أعمال المواهب الجديدة. لكل عمل مكان، ولكل رأي قيمة.</p></div><CreatePostLink /></header><div className={styles.columns}><CommunityFeedFilters /><aside className={styles.side}><section className={styles.card}><h2>مساحتان، مجتمع واحد</h2><p className={styles.hint}><strong>الكتّاب</strong> يعرضون نصوصهم وصورهم وفيديوهاتهم وكتب PDF أو Word للقراءة صفحةً صفحة.</p><p className={styles.hint}><strong>القرّاء</strong> يناقشون الأعمال ويقيّمونها: أوافق للجيد، عادي للمتوسط، ولا يعجبني لما يحتاج تحسيناً. اختر نوع عضويتك قبل النشر ويمكنك تغييره لاحقاً.</p><CommunityLinks /></section><section className={styles.card}><h2>ليظل الحوار جميلاً</h2><ul className={styles.guidelines}><li>ناقش الأفكار باحترام، وتقبّل اختلاف الأذواق.</li><li>نبّه إلى حرق الأحداث قبل مشاركتها.</li><li>انسب الاقتباسات إلى أصحابها، وانشر ما تملك حق مشاركته.</li><li>أبلغ عن المحتوى المسيء ليساعدك فريق الإشراف.</li></ul></section></aside></div></>;
}
