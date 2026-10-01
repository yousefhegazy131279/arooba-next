"use client";

import { useEffect } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./PillarsSection.module.css";

const BookIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const PenIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
    <path d="M3 21h18" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const UsersIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const pillars = [
  {
    id: "read",
    title: "اقرأ",
    subtitle: "مكتبة لا تنتهي",
    description: "روايات عالمية مُعرَّبة وأعمال أصلية بجودة أدبية رفيعة، في تجربة قراءة تفاعلية.",
    href: "/novels",
    linkText: "تصفّح المكتبة",
    icon: <BookIcon />,
    accent: "#60a5fa",
  },
  {
    id: "write",
    title: "اكتب",
    subtitle: "محرر عربي غني",
    description: "اكتب روايتك بمحرر يشبه Word، مع حفظ تلقائي، وتصدير DOCX، ونشر مباشر.",
    href: "/write",
    linkText: "ابدأ الكتابة",
    icon: <PenIcon />,
    accent: "#a78bfa",
  },
  {
    id: "translate",
    title: "عرّب",
    subtitle: "انقل الحكايات",
    description: "انقل روائع الأدب العالمي إلى العربية بأسلوب راقٍ، من داخل مساحة الكتابة، وانشرها في المكتبة.",
    href: "/write",
    linkText: "ادخل مساحة الكتابة",
    icon: <GlobeIcon />,
    accent: "#34d399",
  },
  {
    id: "share",
    title: "شارك",
    subtitle: "مجتمع أدبي",
    description: "انشر أفكارك، ناقش القرّاء، تابع الكتّاب، وابنِ جمهورك في مجتمع حيّ.",
    href: "/community",
    linkText: "ادخل المجتمع",
    icon: <UsersIcon />,
    accent: "#fbbf24",
  },
];

export default function PillarsSection() {
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
    });
  }, []);

  return (
    <section className={styles.pillars}>
      {/* ===== الخلفية المتحركة (موحدة مع باقي الأقسام) ===== */}
      <div className={styles.sectionBackground}>
        <div className={`${styles.bgOrb} ${styles.orb1}`}></div>
        <div className={`${styles.bgOrb} ${styles.orb2}`}></div>
        <div className={`${styles.bgOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
        <div className={styles.floatingShapes}>
          <span className={`${styles.shape} ${styles.shape1}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape2}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape3}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </span>
          <span className={`${styles.shape} ${styles.shape4}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.container}>
        {/* الترويسة */}
        <div className={styles.header} data-aos="fade-up">
          <span className={styles.badge}>بوابات عُروبة</span>
          <h2 className={styles.title}>
            كل ما تحتاجه <span className={styles.titleGold}>لرحلة أدبية</span>
          </h2>
          <p className={styles.subtitle}>
            أربع بوابات تنقلك من قارئ إلى جزء من مجتمع أدبي نابض
          </p>
        </div>

        {/* الشبكة */}
        <div className={styles.grid}>
          {pillars.map((pillar, index) => (
            <Link
              key={pillar.id}
              href={pillar.href}
              className={styles.card}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              style={{ ["--accent" as string]: pillar.accent }}
            >
              <div className={styles.cardGlow} />

              <div className={styles.iconWrapper}>
                <div className={styles.iconInner}>{pillar.icon}</div>
              </div>

              <div className={styles.cardBody}>
                <span className={styles.cardSubtitle}>{pillar.subtitle}</span>
                <h3 className={styles.cardTitle}>{pillar.title}</h3>
                <p className={styles.cardDescription}>{pillar.description}</p>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.linkText}>{pillar.linkText}</span>
                <span className={styles.linkArrow}>
                  <ArrowIcon />
                </span>
              </div>

              <div className={styles.cardNumber}>0{index + 1}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}