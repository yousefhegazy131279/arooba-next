"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // عناصر القائمة مع أيقونات SVG راقية
  const navItems = {
    right: [
      { 
        name: "الرئيسية", 
        path: "/", 
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H5a2 2 0 0 1-2-2z" />
          </svg>
        )
      },
      { 
        name: "من نحن", 
        path: "/about", 
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )
      },
    ],
    left: [
      { 
        name: "الروايات", 
        path: "/novels", 
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        )
      },
      { 
        name: "تواصل معنا", 
        path: "/contact", 
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        )
      },
    ],
  };

  // التحقق من الرابط النشط
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // إغلاق القائمة عند تغيير المسار
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // مراقبة التمرير
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // تهيئة AOS وإعادة التحديث عند تغيير حجم النافذة
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: false,
      mirror: true,
      offset: 50,
    });

    const handleResize = () => AOS.refresh();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // تحديث AOS عند تغيير حالة القائمة المفتوحة (للتأكد من تحديث الرسوم المتحركة)
  useEffect(() => {
    AOS.refresh();
  }, [menuOpen]);

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
      {/* خلفية متحركة */}
      <div className={styles.navbarBg}>
        <div className={styles.bgGlow}></div>
      </div>

      {/* القائمة اليمنى */}
      <ul className={`${styles.navRight} ${menuOpen ? styles.open : ""}`}>
        {navItems.right.map((item, index) => (
          <li
            key={index}
            data-aos="fade-down"
            data-aos-delay={100 * (index + 1)}
            data-aos-duration="600"
          >
            <Link
              href={item.path}
              className={`${styles.navLink} ${isActive(item.path) ? styles.active : ""}`}
            >
              <span className={styles.linkIcon}>{item.icon}</span>
              <span className={styles.linkText}>{item.name}</span>
              <span className={styles.linkGlow}></span>
            </Link>
          </li>
        ))}
      </ul>

      {/* اللوجو */}
      <div className={styles.logoWrapper} data-aos="zoom-in" data-aos-duration="800" data-aos-delay="300">
        <Link href="/" className={styles.logo}>
          <div className={styles.logoInner}>
            <img src="/logo.png" alt="عُروبة" />
            <div className={styles.logoGlow}></div>
          </div>
        </Link>
      </div>

      {/* القائمة اليسرى + زر الهامبرغر */}
      <div className={styles.navLeft}>
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.active : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="القائمة"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
        <ul className={menuOpen ? styles.open : ""}>
          {navItems.left.map((item, index) => (
            <li
              key={index}
              data-aos="fade-down"
              data-aos-delay={100 * (index + 3)}
              data-aos-duration="600"
            >
              <Link
                href={item.path}
                className={`${styles.navLink} ${isActive(item.path) ? styles.active : ""}`}
              >
                <span className={styles.linkIcon}>{item.icon}</span>
                <span className={styles.linkText}>{item.name}</span>
                <span className={styles.linkGlow}></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;