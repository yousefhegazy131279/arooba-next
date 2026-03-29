"use client";

import { useEffect } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./Footer.module.css";

const Footer = () => {
  useEffect(() => {
    // تهيئة AOS (إذا لم تكن قد هُيئت من قبل، لكن التهيئة المتعددة لا تضر)
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: false,
      mirror: true,
    });
    // تحديث عند تغيير حجم الشاشة
    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <footer className={styles.footer}>
      {/* خلفية متحركة */}
      <div className={styles.footerBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.container}>
        {/* محتوى الفوتر مقسم لأعمدة */}
        <div className={styles.footerContent}>
          {/* العمود الأول: الشعار ووصف */}
          <div className={styles.footerColumn} data-aos="fade-up" data-aos-duration="800">
            <div className={styles.logoWrapper}>
              <img src="/logo.png" alt="عُروبة" className={styles.footerLogo} />
            </div>
            <p className={styles.footerDescription}>
              منصة تعريب القصص العالمية بأسلوب أدبي يعكس جمال اللغة العربية.
            </p>
          </div>

          {/* العمود الثاني: روابط سريعة */}
          <div className={styles.footerColumn} data-aos="fade-up" data-aos-duration="800" data-aos-delay="100">
            <h3 className={styles.footerTitle}>روابط سريعة</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/">الرئيسية</Link></li>
              <li><Link href="/about">من نحن</Link></li>
              <li><Link href="/novels">الروايات</Link></li>
              <li><Link href="/contact">تواصل معنا</Link></li>
            </ul>
          </div>

          {/* العمود الثالث: وسائل التواصل */}
          <div className={styles.footerColumn} data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">
            <h3 className={styles.footerTitle}>تابعنا</h3>
            <div className={styles.socialLinks}>
              <a href="https://www.facebook.com/arubaharabia" target="_blank" rel="noopener noreferrer" className={`${styles.socialIcon} ${styles.facebook}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                  <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 5 3.657 9.128 8.438 9.878v-6.988h-2.54v-2.89h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.462h-1.26c-1.242 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 17 22 12z"/>
                </svg>
                <span className={styles.socialGlow}></span>
              </a>
              <a
  href="https://www.instagram.com/arubaharabia"
  target="_blank"
  rel="noopener noreferrer"
  className={`${styles.socialIcon} ${styles.instagram}`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="28"
    height="28"
    fill="currentColor"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311 1.266-.058 1.646-.07 4.85-.07zM12 7.47a4.53 4.53 0 1 0 0 9.06 4.53 4.53 0 0 0 0-9.06zm0 7.52a2.99 2.99 0 1 1 0-5.98 2.99 2.99 0 0 1 0 5.98zm5.91-7.9a1.06 1.06 0 1 0 0 2.12 1.06 1.06 0 0 0 0-2.12z"/>
  </svg>
  <span className={styles.socialGlow}></span>
</a>
            </div>
          </div>
        </div>

        {/* خط فاصل */}
        <div className={styles.footerDivider} data-aos="width" data-aos-duration="1200"></div>

        {/* حقوق النشر */}
        <div className={styles.copyright} data-aos="fade-up" data-aos-duration="800" data-aos-delay="300">
          <p>© عُروبة 2026. جميع الحقوق محفوظة.</p>
          <p className={styles.copyrightHeart}>صنع بكل <span>❤️</span> من فريق عُروبة</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;