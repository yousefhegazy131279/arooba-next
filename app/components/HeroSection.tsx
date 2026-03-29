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
    { icon: "📖", number: "4+", label: "روايات معربة" },
    { icon: "👥", number: "100+", label: "مقترحات القراء" },
    { icon: "🌟", number: "3", label: "أعمال أصلية" },
    { icon: "📝", number: "20+", label: "قيد التعريب" },
  ];

  // Font rotation effect
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % fonts.length;
      setCurrentFont(fonts[index]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Manual animation for hero text (optional, can be kept or removed)
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

  // AOS refresh on resize
  useEffect(() => {
    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={styles.heroSection}>
      {/* Animated background */}
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
            <span className={styles.buttonIcon}>→</span>
          </Link>
          <Link href="/about" className={`${styles.ctaButton} ${styles.secondary}`}>
            <span>تعرف علينا</span>
            <span className={styles.buttonIcon}>✨</span>
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