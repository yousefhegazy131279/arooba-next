import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      {/* خلفية متحركة مشابهة للهيرو */}
      <div className={styles.animatedBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.errorCode} data-aos="fade-down" data-aos-duration="800">
          404
        </div>
        <h1 className={styles.title} data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">
          عذراً، الصفحة غير موجودة
        </h1>
      
        <Link
          href="/"
          className={styles.homeButton}
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-delay="600"
        >
          <span>العودة إلى الرئيسية</span>
          <span className={styles.buttonIcon}>🏠</span>
        </Link>
      </div>
    </div>
  );
}