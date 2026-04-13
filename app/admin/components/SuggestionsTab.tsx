"use client";

import { useEffect } from "react";
import { useAdminData } from "../hooks/useAdminData";
import styles from "../Admin.module.css";

// أيقونات
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" />
    <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function SuggestionsTab() {
  const { suggestions, loadingSuggestions, fetchSuggestions, deleteSuggestionById } = useAdminData();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (loadingSuggestions) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loader}></div>
        <p>جاري تحميل الاقتراحات...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>اقتراحات القراء</h2>
        <button onClick={fetchSuggestions} className={styles.refreshBtn}>
          <RefreshIcon /> تحديث
        </button>
      </div>
      {suggestions.length === 0 ? (
        <div className={styles.emptyState}>لا توجد اقتراحات بعد</div>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr><th>#</th><th>الاسم</th><th>الرواية المقترحة</th><th>التعليق</th><th>التاريخ</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {suggestions.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
                  <td><strong>{item.story_title}</strong></td>
                  <td>{item.comment || "-"}</td>
                  <td>{new Date(item.created_at).toLocaleDateString("ar-EG")}</td>
                  <td>
                    <button onClick={() => deleteSuggestionById(item.id)} className={styles.deleteBtn}>
                      <DeleteIcon /> حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}