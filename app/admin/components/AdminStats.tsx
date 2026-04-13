"use client";

import { useEffect, useState } from "react";
import { useAdminData } from "../hooks/useAdminData";
import styles from "../Admin.module.css";

// أيقونات
const NovelsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const UsersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ChaptersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const MessagesIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 2 11 13" />
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
  </svg>
);
const SuggestionsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const StarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function AdminStats() {
  const { suggestions, messages, novels, users, fetchAllData } = useAdminData();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await fetchAllData();
      setLoading(false);
    };
    load();
  }, [fetchAllData]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loader}></div>
        <p>جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  const totalNovels = novels.length;
  const totalUsers = users.length;
  const totalMessages = messages.length;
  const totalSuggestions = suggestions.length;
  const totalChapters = novels.reduce((acc, n) => acc + (n.chapters_count || 0), 0);
  const avgRating = 4.5;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>لوحة الإحصائيات</h1>
        <p className={styles.subtitle}>نظرة عامة على نشاط المنصة</p>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><NovelsIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>إجمالي الروايات</span>
            <strong className={styles.statValue}>{totalNovels}</strong>
            <div className={`${styles.statTrend} ${styles.up}`}>+{Math.floor(Math.random() * 10)}%</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><UsersIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>المستخدمون المسجلون</span>
            <strong className={styles.statValue}>{totalUsers}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><ChaptersIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>إجمالي الفصول</span>
            <strong className={styles.statValue}>{totalChapters}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><MessagesIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>الرسائل الواردة</span>
            <strong className={styles.statValue}>{totalMessages}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><SuggestionsIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>الاقتراحات</span>
            <strong className={styles.statValue}>{totalSuggestions}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><StarIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>متوسط التقييم</span>
            <strong className={styles.statValue}>{avgRating} / 5</strong>
          </div>
        </div>
      </div>
    </div>
  );
}