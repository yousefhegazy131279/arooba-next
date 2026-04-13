'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { supabase } from '@/lib/supabaseClient';
import styles from './AuthSidebar.module.css';

const AuthSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, loading, logout, fetchUser } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // جلب صورة المستخدم عند تسجيل الدخول أو عند فتح القائمة
  useEffect(() => {
    if (isLoggedIn && user) {
      const fetchAvatar = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          setAvatarUrl(data.avatar_url);
        } else {
          setAvatarUrl(null);
        }
      };
      fetchAvatar();
    } else {
      setAvatarUrl(null);
    }
  }, [isLoggedIn, user, isOpen]); // يعيد الجلب عند فتح القائمة أو تغيير المستخدم

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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

  // الاستماع لحدث تحديث الصورة من صفحة البروفايل
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (isLoggedIn && user) {
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
      }
    };
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate);
  }, [isLoggedIn, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (toggleBtnRef.current && toggleBtnRef.current.contains(event.target as Node)) {
        return;
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const displayName = user?.username || (user as any)?.user_metadata?.username || user?.email?.split('@')[0] || 'مستخدم';
  const userInitial = displayName !== 'مستخدم' ? displayName.charAt(0) : '?';

  if (loading) {
    return (
      <div className={styles.authContainer}>
        <button
          ref={toggleBtnRef}
          className={`${styles.authToggleBtn} ${isOpen ? styles.open : ''} ${isOpen ? styles.shifted : ''}`}
          onClick={toggleSidebar}
          aria-label="القائمة"
        >
          <span className={styles.arrowIcon}>{isOpen ? '✕' : '☰'}</span>
          <span className={styles.btnGlow}></span>
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
        ref={toggleBtnRef}
        className={`${styles.authToggleBtn} ${isOpen ? styles.open : ''} ${isOpen ? styles.shifted : ''}`}
        onClick={toggleSidebar}
        aria-label="القائمة"
      >
        <span className={styles.arrowIcon}>{isOpen ? '✕' : '☰'}</span>
        <span className={styles.btnGlow}></span>
      </button>

      <aside ref={sidebarRef} className={`${styles.authSidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.userProfile} data-aos="fade-left" data-aos-duration="600">
            <div className={styles.avatarWrapper}>
              {isLoggedIn && avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className={styles.avatarImg} />
              ) : !isLoggedIn ? (
                <div className={`${styles.avatar} ${styles.guestAvatar}`}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              ) : (
                <div className={`${styles.avatar} ${styles.userAvatar}`}>{userInitial}</div>
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
                <Link href="/login" className={`${styles.actionBtn} ${styles.loginBtn}`} onClick={() => setIsOpen(false)}>
                  <span className={styles.btnIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                      <path d="M3 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                    </svg>
                  </span>
                  <span className={styles.btnText}>تسجيل دخول</span>
                </Link>
                <Link href="/register" className={`${styles.actionBtn} ${styles.registerBtn}`} onClick={() => setIsOpen(false)}>
                  <span className={styles.btnIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </span>
                  <span className={styles.btnText}>إنشاء حساب</span>
                </Link>
              </>
            ) : (
              <>
                {isAdmin && (
                  <Link href="/admin" className={`${styles.actionBtn} ${styles.adminBtn}`} onClick={() => setIsOpen(false)}>
                    <span className={styles.btnIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </span>
                    <span className={styles.btnText}>لوحة التحكم</span>
                  </Link>
                )}

                {/* زر الملف الشخصي */}
                <Link href="/profile" className={`${styles.actionBtn} ${styles.profileBtn}`} onClick={() => setIsOpen(false)}>
                  <span className={styles.btnIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span className={styles.btnText}>الملف الشخصي</span>
                </Link>

                <Link href="/profile/favorites" className={`${styles.actionBtn} ${styles.favoritesBtn}`} onClick={() => setIsOpen(false)}>
                  <span className={styles.btnIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </span>
                  <span className={styles.btnText}>المفضلات</span>
                </Link>

                <button onClick={handleLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`}>
                  <span className={styles.btnIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </span>
                  <span className={styles.btnText}>تسجيل خروج</span>
                </button>
              </>
            )}

            {/* زر تبديل الثيم */}
            <button onClick={toggleTheme} className={`${styles.actionBtn} ${styles.themeBtn}`}>
              <span className={styles.btnIcon}>
                {isDark ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </span>
              <span className={styles.btnText}>{isDark ? 'وضع فاتح' : 'وضع داكن'}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AuthSidebar;