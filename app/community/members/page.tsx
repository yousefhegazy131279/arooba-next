import type { Metadata } from 'next';
import Link from 'next/link';
import { getMemberDirectory } from '@/app/community/social/actions';
import MemberDirectory from '@/app/components/community/MemberDirectory';
import styles from '@/app/components/community/Community.module.css';

export const metadata: Metadata = { title: 'أعضاء المجتمع | عُروبة', description: 'تعرف إلى قرّاء وكتّاب مجتمع عُروبة وتابع أعمالهم.', alternates: { canonical: '/community/members' } };

export default async function MembersPage() {
  const initial = await getMemberDirectory({ search: '', role: 'all', page: 0 });
  return <>
    <Link className={styles.textLink} href="/community">العودة إلى المجتمع</Link>
    <header className={styles.hero}><div><span className={styles.eyebrow}>مجتمع عُروبة / الأعضاء</span><h1>تعرّف إلى من يشاركك القراءة</h1><p>اكتشف كتّابًا جددًا، تابع أعمالهم، وتواصل مع القرّاء والكتّاب مباشرة.</p></div></header>
    <MemberDirectory initial={initial} />
  </>;
}
