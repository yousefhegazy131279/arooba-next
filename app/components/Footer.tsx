"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./Footer.module.css";

/* ==========================================================
   🎨 أيقونات SVG — روابط المطوّر يوسف حجازي
   ========================================================== */
const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TiktokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.09z" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311 1.266-.058 1.646-.07 4.85-.07zM12 7.47a4.53 4.53 0 1 0 0 9.06 4.53 4.53 0 0 0 0-9.06zm0 7.52a2.99 2.99 0 1 1 0-5.98 2.99 2.99 0 0 1 0 5.98zm5.91-7.9a1.06 1.06 0 1 0 0 2.12 1.06 1.06 0 0 0 0-2.12z" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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
   🔗 روابط المطوّر يوسف حجازي
   ========================================================== */
const DEVELOPER_LINKS = [
  { brand: "youtube",   label: "YouTube",   href: "https://www.youtube.com/@YousefHegazydev",             icon: <YoutubeIcon /> },
  { brand: "tiktok",    label: "TikTok",    href: "https://www.tiktok.com/@yousefhegazydev?lang=en",      icon: <TiktokIcon /> },
  { brand: "x",         label: "X (تويتر)", href: "https://x.com/Yousefhegazy00",                        icon: <XIcon /> },
  { brand: "instagram", label: "Instagram", href: "https://www.instagram.com/yousef.hegazy.dev/",        icon: <InstagramIcon /> },
  { brand: "facebook",  label: "Facebook",  href: "https://www.facebook.com/profile.php?id=61594760347792", icon: <FacebookIcon /> },
  { brand: "github",    label: "GitHub",    href: "https://github.com/yousefhegazy131279",               icon: <GithubIcon /> },
  { brand: "linkedin",  label: "LinkedIn",  href: "https://www.linkedin.com/in/yousef-hegazy-a0aa13333",  icon: <LinkedinIcon /> },
] as const;

/* ==========================================================
   📖 اقتباسات أدبية
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
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 40 });
    const onResize = () => AOS.refresh();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className={styles.footer}>
      <div className={styles.topGlow} aria-hidden="true" />

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
          </div>

          {/* العمود 2: المنصة */}
          <div className={styles.linkColumn} data-aos="fade-up" data-aos-delay="100">
            <h3 className={styles.footerTitle}>المنصة</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/">الرئيسية</Link></li>
              <li><Link href="/novels">الروايات</Link></li>
              <li><Link href="/community">المجتمع</Link></li>
              <li><Link href="/library">مكتبتي</Link></li>
            </ul>
          </div>

          {/* العمود 3: الاستكشاف */}
          <div className={styles.linkColumn} data-aos="fade-up" data-aos-delay="200">
            <h3 className={styles.footerTitle}>استكشف</h3>
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
              <p key={quoteIndex} className={styles.quoteText}>{quotes[quoteIndex].text}</p>
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

        {/* ===== قسم المطوّر (مفصول) ===== */}
        <div className={styles.developerSection} data-aos="fade-up">
          <div className={styles.developerHeader}>
            <span className={styles.developerLabel}>المطوّر</span>
            <div className={styles.developerLine} />
          </div>

          <div className={styles.developerContent}>
            <div className={styles.developerInfo}>
              <a
                href="https://hogz.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.hgzLink}
                aria-label="زيارة موقع المطوّر HGZ"
              >
                <span className={styles.hgzText}>HGZ</span>
                <span className={styles.hgzSpark} aria-hidden="true">✦</span>
              </a>
              <p className={styles.developerName}>يوسف حجازي</p>
              <p className={styles.developerRole}>Full-Stack Developer &amp; Creator of عُروبة</p>
              <a
                href="https://hogz.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.portfolioBtn}
              >
                زيارة البورتفوليو
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            <div className={styles.socialLinks}>
              {DEVELOPER_LINKS.map((s) => (
                <a
                  key={s.brand}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  data-brand={s.brand}
                  data-label={s.label}
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== الفاصل ===== */}
        <div className={styles.footerDivider}>
          <span className={styles.dividerDiamond} aria-hidden="true">✦</span>
        </div>

        {/* ===== حقوق النشر ===== */}
        <div className={styles.copyright}>
          <p className={styles.copyrightText}>
            © {new Date().getFullYear()} <strong>عُروبة</strong> — جميع الحقوق محفوظة.
          </p>

          <p className={styles.copyrightHeart}>
            صُنع بكل <span className={styles.heartIcon}>♥</span> من{" "}
            <a
              href="https://hogz.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.hgzInline}
            >
              HGZ
            </a>
          </p>

          <button type="button" onClick={scrollToTop} className={styles.backToTop} aria-label="العودة إلى الأعلى">
            <ArrowUpIcon />
            <span>للأعلى</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;