import styles from './Community.module.css';

interface FeedSkeletonProps {
  /** عدد البطاقات */
  count?: number;
  /** حجم البطاقة */
  variant?: 'compact' | 'full' | 'minimal';
  /** إظهار مرفقات وهمية */
  withAttachments?: boolean;
  /** إظهار أزرار التفاعل */
  withActions?: boolean;
}

export default function FeedSkeleton({
  count = 3,
  variant = 'full',
  withAttachments = false,
  withActions = true,
}: FeedSkeletonProps) {
  // تحديد عدد الأسطر بناءً على الحجم
  const lines = variant === 'compact' ? 2 : variant === 'minimal' ? 1 : 3;

  return (
    <div
      className={styles.feed}
      role="status"
      aria-live="polite"
      aria-label="جارٍ تحميل المنشورات"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <article
          key={index}
          className={styles.card}
          aria-hidden="true"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {/* رأس البطاقة: صورة + اسم */}
          <div className={styles.cardHead}>
            <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
            <div className={styles.skeletonHeadInfo}>
              <div
                className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`}
              />
              <div
                className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonTiny}`}
              />
            </div>
          </div>

          {/* المحتوى */}
          {Array.from({ length: lines }, (_, lineIndex) => (
            <div
              key={lineIndex}
              className={`${styles.skeleton} ${styles.skeletonLine}`}
              style={{
                width:
                  lineIndex === lines - 1
                    ? '60%'
                    : lineIndex === 0
                    ? '100%'
                    : '92%',
              }}
            />
          ))}

          {/* المرفقات الوهمية */}
          {withAttachments && (
            <div className={styles.skeletonAttachments}>
              <div className={`${styles.skeleton} ${styles.skeletonMedia}`} />
              <div className={`${styles.skeleton} ${styles.skeletonMedia}`} />
            </div>
          )}

          {/* الأزرار */}
          {withActions && (
            <div className={styles.skeletonActions}>
              <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
              <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
              <div
                className={`${styles.skeleton} ${styles.skeletonPill} ${styles.skeletonPillRight}`}
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}