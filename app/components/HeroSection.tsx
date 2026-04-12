"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./HeroSection.module.css";

const fonts = ["Cairo", "Amiri", "Scheherazade"];

const HeroSection = () => {
  const [currentFont, setCurrentFont] = useState(fonts[0]);
  const heroTextRef = useRef<HTMLHeadingElement>(null);

  const stats = [
    { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      number: "4+",
      label: "روايات معربة" 
    },
    { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      number: "100+",
      label: "مقترحات القراء" 
    },
    { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      number: "3",
      label: "أعمال أصلية" 
    },
    { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      number: "20+",
      label: "قيد التعريب" 
    },
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % fonts.length;
      setCurrentFont(fonts[index]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (heroTextRef.current) {
      heroTextRef.current.style.opacity = "0";
      heroTextRef.current.style.transform = "translateY(50px)";
      const timeout = setTimeout(() => {
        if (heroTextRef.current) {
          heroTextRef.current.style.transition =
            "all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
          heroTextRef.current.style.opacity = "1";
          heroTextRef.current.style.transform = "translateY(0)";
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={styles.heroSection}>
      <div className={styles.animatedBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.heroContainer}>
        <div className={styles.logoWrapper} data-aos="fade-down" data-aos-duration="1000">
          <div className={styles.floatingLogo}>
            <img src="/logo.png" alt="عُروبة" className={styles.logoImage} />
          </div>
        </div>

        <h1
          ref={heroTextRef}
          className={styles.heroTitle}
          data-aos="fade-up"
          data-aos-duration="1200"
          data-aos-delay="200"
        >
          <span className={styles.titleLine}>
            <span className={styles.lightText}>أهلاً بك في</span>
          </span>
          <span className={styles.titleLine}>
            <span 
              className={styles.goldenText} 
              style={{ fontFamily: currentFont }}
            >
              موقع عُروبة
            </span>
            <span className={styles.exclamation}>!</span>
          </span>
        </h1>

        <p
          className={styles.heroDescription}
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="400"
        >
          حين تتكلم القصص بلغة الضاد .
        </p>

        <div
          className={styles.statsContainer}
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="600"
        >
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div
          className={styles.ctaContainer}
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="800"
        >
          <Link href="/novels" className={`${styles.ctaButton} ${styles.primary}`}>
            <span>استكشف الروايات</span>
            <span className={styles.buttonIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </Link>
          <Link href="/about" className={`${styles.ctaButton} ${styles.secondary}`}>
            <span>تعرف علينا</span>
            <span className={styles.buttonIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      <div className={styles.decorativeElements}>
        <div className={`${styles.decorCircle} ${styles.circle1}`}></div>
        <div className={`${styles.decorCircle} ${styles.circle2}`}></div>
        <div className={`${styles.decorLine} ${styles.line1}`}></div>
        <div className={`${styles.decorLine} ${styles.line2}`}></div>
      </div>
    </div>
  );
};

export default HeroSection;