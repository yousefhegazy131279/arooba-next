import styles from './Community.module.css';

export default function FeedSkeleton({ count = 3 }: { count?: number }) {
  return <div className={styles.feed} role="status" aria-label="جارٍ تحميل المنشورات" aria-busy="true">{Array.from({ length: count }, (_, index) => <div className={styles.card} key={index} aria-hidden="true"><div className={styles.cardHead}><div className={`${styles.skeleton} ${styles.skeletonAvatar}`} /><div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} /></div><div className={`${styles.skeleton} ${styles.skeletonLine}`} /><div className={`${styles.skeleton} ${styles.skeletonLine}`} /><div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} /></div>)}</div>;
}
