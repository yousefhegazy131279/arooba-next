// app/components/AuthSidebar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuthStore } from '@/app/stores/useAuthStore';
import styles from './AuthSidebar.module.css';

const AuthSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, loading, logout, fetchUser } = useAuthStore();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // جلب حالة المستخدم عند تحميل المكون
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // تهيئة AOS
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 0,
    });
    const handleResize = () => AOS.refresh();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  // عرض اسم المستخدم من الحقول الصحيحة
  const displayName = user?.username || user?.full_name || 'مستخدم';
  const userInitial = displayName !== 'مستخدم' ? displayName.charAt(0) : '?';

  if (loading) {
    return (
      <div className={styles.authContainer}>
        <button
          className={`${styles.authToggleBtn} ${isOpen ? styles.open : ''}`}
          onClick={toggleSidebar}
        >
          <span className={styles.arrowIcon}>☰</span>
        </button>
        <aside ref={sidebarRef} className={`${styles.authSidebar} ${isOpen ? styles.open : ''}`}>
          <div className={styles.loadingState}>جاري التحميل...</div>
        </aside>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <button
        className={`${styles.authToggleBtn} ${isOpen ? styles.open : ''}`}
        onClick={toggleSidebar}
        aria-label="القائمة"
      >
        <span className={styles.arrowIcon}>{isOpen ? '✕' : '☰'}</span>
      </button>

      <aside ref={sidebarRef} className={`${styles.authSidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.userProfile} data-aos="fade-left" data-aos-duration="600">
            <div className={styles.avatarWrapper}>
              {isLoggedIn && user?.avatar ? (
                <img
                  src={`/avatars/${user.avatar}`}
                  alt="Avatar"
                  className={styles.avatarImg}
                />
              ) : !isLoggedIn ? (
                <div className={`${styles.avatar} ${styles.guestAvatar}`}>👤</div>
              ) : (
                <div className={`${styles.avatar} ${styles.userAvatar}`}>
                  {userInitial}
                </div>
              )}
              <div className={styles.avatarGlow}></div>
            </div>
            <div className={styles.userInfo}>
              {!isLoggedIn ? (
                <>
                  <span className={styles.userStatus}>زائر</span>
                  <span className={styles.userGreeting}>مرحباً بك</span>
                </>
              ) : (
                <>
                  <span className={styles.userName}>{displayName}</span>
                  <span className={styles.userRole}>{isAdmin ? 'مسؤول' : 'مستخدم'}</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.actionsList} data-aos="fade-left" data-aos-delay="100">
            {!isLoggedIn ? (
              <>
                <Link href="/login" className={`${styles.actionBtn} ${styles.loginBtn}`}>
                  <span className={styles.btnIcon}>🔑</span>
                  <span className={styles.btnText}>تسجيل دخول</span>
                </Link>
                <Link href="/register" className={`${styles.actionBtn} ${styles.registerBtn}`}>
                  <span className={styles.btnIcon}>📝</span>
                  <span className={styles.btnText}>إنشاء حساب</span>
                </Link>
              </>
            ) : (
              <>
                {isAdmin && (
                  <Link href="/admin" className={`${styles.actionBtn} ${styles.adminBtn}`}>
                    <span className={styles.btnIcon}>⚙️</span>
                    <span className={styles.btnText}>لوحة التحكم</span>
                  </Link>
                )}
                <button onClick={handleLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`}>
                  <span className={styles.btnIcon}>🚪</span>
                  <span className={styles.btnText}>تسجيل خروج</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AuthSidebar;