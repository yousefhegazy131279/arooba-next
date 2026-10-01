"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import { supabase } from "@/lib/supabaseClient";
import styles from "./HeroSection.module.css";

const fonts = ["Cairo", "Amiri", "Scheherazade"];

const HeroSection = () => {
  const [currentFont, setCurrentFont] = useState(fonts[0]);
  const heroTextRef = useRef<HTMLHeadingElement>(null);

  // ===== إحصائيات حية من قاعدة البيانات =====
  const [stats, setStats] = useState({
    novels: 0,
    chapters: 0,
    users: 0,
    posts: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [novelsRes, chaptersRes, usersRes, postsRes] = await Promise.all([
          supabase.from("novels").select("id", { count: "exact", head: true }),
          supabase.from("chapters").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("posts").select("id", { count: "exact", head: true }).eq("is_hidden", false),
        ]);
        setStats({
          novels: novelsRes.count || 0,
          chapters: chaptersRes.count || 0,
          users: usersRes.count || 0,
          posts: postsRes.count || 0,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const statsData = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      number: `${stats.novels}`,
      label: "رواية في المكتبة",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      number: `${stats.chapters}`,
      label: "فصل منشور",
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
      number: `${stats.users}`,
      label: "قارئ وكاتب",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
      number: `${stats.posts}`,
      label: "منشور في المجتمع",
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

        {/* ===== الوصف الجديد الشامل ===== */}
        <p
          className={styles.heroDescription}
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="400"
        >
          اقرأ، اكتب، عرّب، وشارك — منصة أدبية عربية متكاملة
          <br />
          <span className={styles.heroDescriptionAccent}>
            روايات مُعرَّبة · أعمال أصلية · مجتمع كتّاب وقرّاء
          </span>
        </p>

        {/* ===== شارات مميزة جديدة ===== */}
        <div
          className={styles.featureBadges}
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="500"
        >
          <span className={styles.featureBadge}>📖 قارئ تفاعلي</span>
          <span className={styles.featureBadge}>✍️ محرر عربي غني</span>
          <span className={styles.featureBadge}>👥 مجتمع أدبي</span>
        </div>

        <div
          className={styles.statsContainer}
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="600"
        >
          {statsData.map((stat, index) => (
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
          <Link href="/write" className={`${styles.ctaButton} ${styles.secondary}`}>
            <span>ابدأ الكتابة</span>
            <span className={styles.buttonIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                <path d="M3 21h18" />
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