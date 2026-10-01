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

  const navItems = {
    right: [
      {
        name: "الرئيسية",
        path: "/",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H5a2 2 0 0 1-2-2z" />
          </svg>
        ),
      },
      {
        name: "من نحن",
        path: "/about",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        ),
      },
      {
        name: "المجتمع",
        path: "/community",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <path d="M21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
    ],
    left: [
      {
        name: "الروايات",
        path: "/novels",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
      },
      {
        name: "مكتبتي",
        path: "/library",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4.5h13a3 3 0 0 1 3 3V21H7a3 3 0 0 1-3-3V4.5Z" />
            <path d="M4 17h13a3 3 0 0 1 3 3M8 9h8M8 13h6" />
          </svg>
        ),
      },
      {
        name: "تواصل معنا",
        path: "/contact",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
    ],
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.navbarBg}>
        <div className={styles.bgGlow}></div>
      </div>

      {/* القائمة اليمنى */}
      <ul className={`${styles.navRight} ${menuOpen ? styles.open : ""}`}>
        {navItems.right.map((item, index) => (
          <li key={index}>
            <Link
              href={item.path}
              className={`${styles.navLink} ${isActive(item.path) ? styles.active : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.linkIcon}>{item.icon}</span>
              <span className={styles.linkText}>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* اللوجو */}
      <div className={styles.logoWrapper}>
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
          aria-expanded={menuOpen}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
        <ul className={menuOpen ? styles.open : ""}>
          {navItems.left.map((item, index) => (
            <li key={index}>
              <Link
                href={item.path}
                className={`${styles.navLink} ${isActive(item.path) ? styles.active : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className={styles.linkIcon}>{item.icon}</span>
                <span className={styles.linkText}>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;