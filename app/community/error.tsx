'use client';

import Link from 'next/link';
import styles from '@/app/components/community/Community.module.css';

export default function CommunityError({ reset, unstable_retry }: { error: Error & { digest?: string }; reset?: () => void; unstable_retry?: () => void }) {
  return <div className={`${styles.card} ${styles.state}`} role="alert"><h1>تعذر فتح هذه الصفحة</h1><p>حدثت مشكلة أثناء تحميل المجتمع. أعد المحاولة بعد قليل.</p><div className={styles.actions}><button className={styles.button} onClick={() => (unstable_retry || reset || (() => window.location.reload()))()}>إعادة المحاولة</button><Link href="/community" className={styles.secondary}>العودة إلى المجتمع</Link></div></div>;
}
