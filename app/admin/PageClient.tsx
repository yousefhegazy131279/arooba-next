"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useThemeStore } from "@/app/stores/useThemeStore";
import AdminSidebar from "./components/AdminSidebar";
import AdminStats from "./components/AdminStats";
import styles from "./Admin.module.css";

// Lazy loading للتبويبات الثقيلة
const SuggestionsTab = lazy(() => import("./components/SuggestionsTab"));
const MessagesTab = lazy(() => import("./components/MessagesTab"));
const NovelsTab = lazy(() => import("./components/NovelsTab"));
const UsersTab = lazy(() => import("./components/UsersTab"));

type TabId = "stats" | "suggestions" | "messages" | "novels" | "users";

export default function AdminPage() {
  const { isAdmin, isLoggedIn, loading: authLoading } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("stats");

  if (authLoading) {
    return (
      <div className={styles.adminPage}>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    router.push("/");
    return null;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "stats": return <AdminStats />;
      case "suggestions": return <SuggestionsTab />;
      case "messages": return <MessagesTab />;
      case "novels": return <NovelsTab />;
      case "users": return <UsersTab />;
      default: return null;
    }
  };

  return (
    <div className={styles.adminPage}>
      <div className={styles.themeToggleWrapper}>
        <button onClick={toggleTheme} className={styles.themeToggleBtn}>
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      <div className={styles.heroBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
      </div>

      <div className={styles.layoutWithSidebar}>
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className={styles.mainContent}>
          <div className={styles.contentContainer}>
            <Suspense fallback={<div className={styles.loadingState}><div className={styles.loader}></div><p>جاري التحميل...</p></div>}>
              {renderTab()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}