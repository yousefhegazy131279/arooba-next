import Link from 'next/link';
import styles from '@/app/components/community/Community.module.css';
export default function NotFound() { return <div className={`${styles.card} ${styles.state}`}><h1>هذه الصفحة غير متاحة</h1><p>قد يكون المنشور محذوفاً أو مخفياً، أو أن اسم القارئ غير موجود.</p><Link href="/community" className={styles.button}>استكشف المجتمع</Link></div>; }
