import type { Metadata } from 'next';
import Link from 'next/link';
import CreatePostForm from '@/app/components/community/CreatePostForm';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import styles from '@/app/components/community/Community.module.css';

export function generateMetadata(): Metadata { return { title: 'منشور جديد | مجتمع عُروبة', description: 'شارك قرّاء عُروبة أفكارك وتوصياتك الأدبية.', robots: { index: false, follow: true } }; }

export default function CreatePostPage() {
  return <div className={styles.narrow}><Link href="/community" className={`${styles.textLink} ${styles.back}`}><CommunityIcon name="back" />العودة إلى المجتمع</Link><header className={styles.hero}><div><span className={styles.eyebrow}>مساحة لأفكارك</span><h1>ابدأ حواراً.</h1><p>ما الذي قرأته وأحببت أن تشاركه؟</p></div></header><CreatePostForm /></div>;
}
