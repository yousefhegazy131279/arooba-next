'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { supabase } from '@/lib/supabaseClient';
import Avatar from './community/Avatar';
import SidebarDirectMessages from './community/SidebarDirectMessages';
import styles from './AuthSidebar.module.css';

/* ===== أيقونات SVG ===== */
const Icon = {
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  login: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  register: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  admin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  write: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13 16.5 5.5 2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.6 7.6" />
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  guest: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

const AuthSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, loading, logout, fetchUser } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  /* ===== جلب صورة المستخدم ===== */
  useEffect(() => {
    if (isLoggedIn && user) {
      const fetchAvatar = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (!error && data) setAvatarUrl(data.avatar_url);
        else setAvatarUrl(null);
      };
      fetchAvatar();
    }
  }, [isLoggedIn, user, isOpen]);

  /* ===== جلب عدد الإشعارات غير المقروءة ===== */
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setUnreadNotifications(0);
      return;
    }

    let active = true;

    const refresh = async () => {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        if (active && count !== null) setUnreadNotifications(count);
      } catch {}
    };

    void refresh();

    const channel = supabase
      .channel(`sidebar-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    const timer = window.setInterval(refresh, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [isLoggedIn, user]);

  /* ===== إعادة الجلب عند فتح القائمة ===== */
  useEffect(() => {
    if (isOpen && isLoggedIn && user) {
      void supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(({ count }) => {
          if (count !== null) setUnreadNotifications(count);
        });
    }
  }, [isOpen, isLoggedIn, user]);

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

  /* ===== الاستماع لتحديث الصورة ===== */
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

  /* ===== إغلاق عند النقر خارج القائمة ===== */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (toggleBtnRef.current && toggleBtnRef.current.contains(event.target as Node)) return;
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

  const displayName =
    user?.username ||
    user?.full_name ||
    user?.email?.split('@')[0] ||
    'مستخدم';
  const userInitial = displayName !== 'مستخدم' ? displayName.charAt(0) : '?';

  /* ===== حالة التحميل ===== */
  if (loading) {
    return (
      <div className={styles.authContainer}>
        <button
          ref={toggleBtnRef}
          className={styles.authToggleBtn}
          onClick={toggleSidebar}
          aria-label="القائمة"
        >
          {Icon.menu}
          <span className={styles.btnGlow} />
        </button>
        <aside ref={sidebarRef} className={`${styles.authSidebar} ${isOpen ? styles.open : ''}`}>
          <div className={styles.loadingState}>
            <span className={styles.loadingSpinner} />
            <span>جاري التحميل…</span>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      {/* ===== زر التبديل ===== */}
      <button
        ref={toggleBtnRef}
        className={`${styles.authToggleBtn} ${isOpen ? styles.open : ''} ${isOpen ? styles.shifted : ''}`}
        onClick={toggleSidebar}
        aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
        aria-expanded={isOpen}
      >
        <span className={styles.arrowIcon}>{isOpen ? Icon.close : Icon.menu}</span>
        <span className={styles.btnGlow} />
      </button>

      {/* ===== القائمة الجانبية ===== */}
      <aside
        ref={sidebarRef}
        className={`${styles.authSidebar} ${isOpen ? styles.open : ''}`}
      >
        <div className={styles.sidebarContent}>
          {/* ===== بطاقة المستخدم ===== */}
          <div className={styles.userProfile} data-aos="fade-left" data-aos-duration="600">
            <div className={styles.avatarWrapper}>
              {isLoggedIn && avatarUrl ? (
                <Avatar
                  src={avatarUrl}
                  name={displayName}
                  size={88}
                  className={styles.avatarImg}
                />
              ) : !isLoggedIn ? (
                <div className={`${styles.avatar} ${styles.guestAvatar}`}>
                  {Icon.guest}
                </div>
              ) : (
                <div className={`${styles.avatar} ${styles.userAvatar}`}>
                  {userInitial}
                </div>
              )}
              <div className={styles.avatarGlow} />
            </div>

            <div className={styles.userInfo}>
              {!isLoggedIn ? (
                <>
                  <span className={styles.userStatus}>زائر</span>
                  <span className={styles.userGreeting}>مرحباً بك في عُروبة</span>
                </>
              ) : (
                <>
                  <span className={styles.userName}>{displayName}</span>
                  <span className={`${styles.userRole} ${isAdmin ? styles.userRoleAdmin : ''}`}>
                    {isAdmin ? 'مسؤول' : 'عضو'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ===== الأزرار ===== */}
          <div className={styles.actionsList} data-aos="fade-left" data-aos-delay="100">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  className={`${styles.actionBtn} ${styles.loginBtn}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className={styles.btnIcon}>{Icon.login}</span>
                  <span className={styles.btnText}>تسجيل دخول</span>
                </Link>

                <Link
                  href="/register"
                  className={`${styles.actionBtn} ${styles.registerBtn}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className={styles.btnIcon}>{Icon.register}</span>
                  <span className={styles.btnText}>إنشاء حساب</span>
                </Link>
              </>
            ) : (
              <>
                {/* --- قسم الحساب --- */}
                <div className={styles.sectionGroup}>
                  <span className={styles.sectionLabel}>حسابي</span>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={`${styles.actionBtn} ${styles.adminBtn}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className={styles.btnIcon}>{Icon.admin}</span>
                      <span className={styles.btnText}>لوحة التحكم</span>
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    className={styles.actionBtn}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={styles.btnIcon}>{Icon.user}</span>
                    <span className={styles.btnText}>الملف الشخصي</span>
                  </Link>

                  <Link
                    href="/profile/favorites"
                    className={`${styles.actionBtn} ${styles.favoritesBtn}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={styles.btnIcon}>{Icon.heart}</span>
                    <span className={styles.btnText}>المفضلات</span>
                  </Link>
                </div>

                {/* --- قسم الكتابة --- */}
                <div className={styles.sectionGroup}>
                  <span className={styles.sectionLabel}>الكتابة</span>

                  <Link
                    href="/write"
                    className={`${styles.actionBtn} ${styles.writeBtn}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={styles.btnIcon}>{Icon.write}</span>
                    <span className={styles.btnText}>مساحة الكتابة</span>
                  </Link>
                </div>

                {/* --- قسم التواصل --- */}
                <div className={styles.sectionGroup}>
                  <span className={styles.sectionLabel}>التواصل</span>

                  {/* زر الإشعارات */}
                  <Link
                    href="/community/notifications"
                    className={`${styles.actionBtn} ${styles.notificationBtn}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={styles.btnIcon}>{Icon.bell}</span>
                    <span className={styles.btnText}>الإشعارات</span>
                    {unreadNotifications > 0 && (
                      <b className={styles.notificationBadge}>
                        {unreadNotifications > 99
                          ? '99+'
                          : unreadNotifications.toLocaleString('ar')}
                      </b>
                    )}
                  </Link>

                  <SidebarDirectMessages
                    userId={user!.id}
                    isOpen={isOpen}
                    onNavigate={() => setIsOpen(false)}
                  />
                </div>

                {/* --- تسجيل الخروج --- */}
                <button
                  onClick={handleLogout}
                  className={`${styles.actionBtn} ${styles.logoutBtn}`}
                >
                  <span className={styles.btnIcon}>{Icon.logout}</span>
                  <span className={styles.btnText}>تسجيل خروج</span>
                </button>
              </>
            )}

            {/* ===== زر الثيم ===== */}
            <button
              onClick={toggleTheme}
              className={`${styles.actionBtn} ${styles.themeBtn}`}
            >
              <span className={styles.btnIcon}>
                {isDark ? Icon.sun : Icon.moon}
              </span>
              <span className={styles.btnText}>
                {isDark ? 'وضع فاتح' : 'وضع داكن'}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AuthSidebar;