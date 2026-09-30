"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from "../Admin.module.css";

export type AdminTabId = 'stats' | 'suggestions' | 'messages' | 'novels' | 'users';
interface Props {
  activeTab: AdminTabId | 'community';
  onTabChange: (tab: AdminTabId) => void;
}

// أيقونات SVG بسيطة
const StatsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3" />
    <path d="M12 2v8" />
    <path d="m9 7 3-3 3 3" />
    <path d="M4 15h16" />
  </svg>
);
const SuggestionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const MessagesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2 11 13" />
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
  </svg>
);
const NovelsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const CommunityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5h16v11H8l-4 4V5Z" /><path d="M8 9h8M8 12h5" />
  </svg>
);

const menuItems: { id: AdminTabId; label: string; icon: React.ReactNode }[] = [
  { id: "stats", label: "الإحصائيات", icon: <StatsIcon /> },
  { id: "suggestions", label: "الاقتراحات", icon: <SuggestionsIcon /> },
  { id: "messages", label: "الرسائل", icon: <MessagesIcon /> },
  { id: "novels", label: "الروايات", icon: <NovelsIcon /> },
  { id: "users", label: "المستخدمين", icon: <UsersIcon /> },
];

export default function AdminSidebar({ activeTab, onTabChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
    <button className={styles.sidebarMobileToggle} type="button" aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)}>{open ? 'إغلاق القائمة' : 'قائمة الإدارة'}</button>
    <aside id="admin-navigation" className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
      <div className={styles.logoArea}>
        <div className={styles.logo}>عُروبة</div>
        <div className={styles.logoSub}>لوحة التحكم</div>
      </div>
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ""}`}
            onClick={() => { onTabChange(item.id); setOpen(false); }}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
        <Link href="/admin/community" className={`${styles.navItem} ${activeTab === 'community' ? styles.navItemActive : ''}`} aria-current={activeTab === 'community' ? 'page' : undefined} onClick={() => setOpen(false)}>
          <span className={styles.navIcon}><CommunityIcon /></span><span className={styles.navLabel}>المجتمع</span>
        </Link>
      </nav>
    </aside>
    </>
  );
}
