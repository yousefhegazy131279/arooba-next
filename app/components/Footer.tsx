"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./Footer.module.css";

/* ==========================================================
   🎨 أيقونات SVG
   ========================================================== */
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 5 3.657 9.128 8.438 9.878v-6.988h-2.54v-2.89h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.462h-1.26c-1.242 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 17 22 12z" />
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311 1.266-.058 1.646-.07 4.85-.07zM12 7.47a4.53 4.53 0 1 0 0 9.06 4.53 4.53 0 0 0 0-9.06zm0 7.52a2.99 2.99 0 1 1 0-5.98 2.99 2.99 0 0 1 0 5.98zm5.91-7.9a1.06 1.06 0 1 0 0 2.12 1.06 1.06 0 0 0 0-2.12z" />
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const QuoteIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9.5 4C6.46 4 4 6.46 4 9.5c0 2.71 1.9 4.97 4.45 5.42-.58 1.93-1.97 3.39-3.72 4.08-.32.13-.53.45-.53.79 0 .46.42.8.86.68 3.98-1.07 6.94-4.67 6.94-8.97v-2C12 6.46 11.04 4 9.5 4zm9 0C15.46 4 13 6.46 13 9.5c0 2.71 1.9 4.97 4.45 5.42-.58 1.93-1.97 3.39-3.72 4.08-.32.13-.53.45-.53.79 0 .46.42.8.86.68 3.98-1.07 6.94-4.67 6.94-8.97v-2C21 6.46 20.04 4 18.5 4z" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

/* ==========================================================
   📖 اقتباسات أدبية متجددة
   ========================================================== */
const quotes = [
  { text: "الكلمة الطيبة صدقة، والحكاية الجميلة إرثٌ لا يموت.", author: "حكمة عربية" },
  { text: "القراءة حياة أخرى نعيشها بلا حدود.", author: "أنيس منصور" },
  { text: "خير جليسٍ في الزمانِ كتابُ.", author: "المتنبي" },
  { text: "في داخل كل قارئ، كاتبٌ ينتظر أن يُولَد.", author: "عُروبة" },
  { text: "الحكايات جسورٌ تعبرُ بها الروحُ إلى الآخرين.", author: "عُروبة" },
];

/* ==========================================================
   🧩 الفوتر
   ========================================================== */
const Footer = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 40,
    });
    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // تدوير الاقتباسات كل 6 ثوانٍ
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className={styles.footer}>
      {/* ===== شريط ذهبي علوي ===== */}
      <div className={styles.topGlow} aria-hidden="true" />

      {/* ===== الخلفية المتحركة ===== */}
      <div className={styles.footerBackground} aria-hidden="true">
        <div className={`${styles.gradientOrb} ${styles.orb1}`} />
        <div className={`${styles.gradientOrb} ${styles.orb2}`} />
        <div className={styles.gridOverlay} />
      </div>

      <div className={styles.container}>
        {/* ===== الشبكة الرئيسية ===== */}
        <div className={styles.footerContent}>
          {/* العمود 1: الشعار والوصف */}
          <div className={styles.brandColumn} data-aos="fade-up">
            <div className={styles.logoWrapper}>
              <div className={styles.logoRing}>
                <img src="/logo.png" alt="عُروبة" className={styles.footerLogo} />
              </div>
              <span className={styles.brandName}>عُروبة</span>
            </div>
            <p className={styles.footerDescription}>
              منصة أدبية عربية متكاملة للقراءة والكتابة والتعريب والمجتمع.
              حيث تُولَد الحكايات بلغة الضاد.
            </p>
            <div className={styles.socialLinks}>
              <a
                href="https://www.facebook.com/arubaharabia"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                data-brand="facebook"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/arubaharabia"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                data-brand="instagram"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://twitter.com/arubaharabia"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                data-brand="twitter"
                aria-label="Twitter"
              >
                <TwitterIcon />
              </a>
            </div>
          </div>

          {/* العمود 2: استكشف */}
          <div className={styles.linkColumn} data-aos="fade-up" data-aos-delay="100">
            <h3 className={styles.footerTitle}>استكشف</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/">الرئيسية</Link></li>
              <li><Link href="/novels">الروايات</Link></li>
              <li><Link href="/community">المجتمع</Link></li>
              <li><Link href="/library">مكتبتي</Link></li>
            </ul>
          </div>

          {/* العمود 3: المنصة */}
          <div className={styles.linkColumn} data-aos="fade-up" data-aos-delay="200">
            <h3 className={styles.footerTitle}>المنصة</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/write">مساحة الكتابة</Link></li>
              <li><Link href="/about">من نحن</Link></li>
              <li><Link href="/contact">تواصل معنا</Link></li>
              <li><Link href="/profile">حسابي</Link></li>
            </ul>
          </div>

          {/* العمود 4: اقتباس أدبي */}
          <div className={styles.quoteColumn} data-aos="fade-up" data-aos-delay="300">
            <h3 className={styles.footerTitle}>من دفتر عُروبة</h3>
            <div className={styles.quoteCard}>
              <span className={styles.quoteIconTop}><QuoteIcon /></span>
              <p key={quoteIndex} className={styles.quoteText}>
                {quotes[quoteIndex].text}
              </p>
              <span className={styles.quoteAuthor}>— {quotes[quoteIndex].author}</span>
              <div className={styles.quoteDots}>
                {quotes.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.quoteDot} ${i === quoteIndex ? styles.quoteDotActive : ""}`}
                    onClick={() => setQuoteIndex(i)}
                    aria-label={`اقتباس ${i + 1}`}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== خط فاصل ===== */}
        <div className={styles.footerDivider}>
          <span className={styles.dividerDiamond} aria-hidden="true">✦</span>
        </div>

        {/* ===== حقوق النشر ===== */}
        <div className={styles.copyright}>
          <p className={styles.copyrightText}>
            © {new Date().getFullYear()} <strong>عُروبة</strong> — جميع الحقوق محفوظة.
          </p>

          <p className={styles.copyrightHeart}>
            صُنع بكل <span className={styles.heartIcon}>♥</span> من <strong>HGZ</strong>
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className={styles.backToTop}
            aria-label="العودة إلى الأعلى"
          >
            <ArrowUpIcon />
            <span>للأعلى</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;