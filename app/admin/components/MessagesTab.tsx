"use client";

import { useEffect, useState } from "react";
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
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function MessagesTab() {
  const { messages, loadingMessages, fetchMessages, updateMessageStatusById, deleteMessageById } = useAdminData();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filteredMessages = messages.filter((msg) => {
    if (filterStatus !== "all" && msg.status !== filterStatus) return false;
    if (searchQuery && !msg.name.includes(searchQuery) && !msg.email.includes(searchQuery) && !msg.subject.includes(searchQuery))
      return false;
    return true;
  });

  if (loadingMessages) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loader}></div>
        <p>جاري تحميل الرسائل...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>الرسائل الواردة</h2>
        <button onClick={fetchMessages} className={styles.refreshBtn}>
          <RefreshIcon /> تحديث
        </button>
      </div>
      <div className={styles.tableToolbar}>
        <div className={styles.searchWrapper}>
          <SearchIcon />
          <input
            type="text"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">الكل</option>
          <option value="unread">غير مقروء</option>
          <option value="read">مقروء</option>
          <option value="replied">تم الرد</option>
        </select>
      </div>
      {filteredMessages.length === 0 ? (
        <div className={styles.emptyState}>لا توجد رسائل</div>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr><th>#</th><th>الاسم</th><th>البريد</th><th>الموضوع</th><th>الرسالة</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg, idx) => (
                <tr key={msg.id}>
                  <td>{idx + 1}</td>
                  <td>{msg.name}</td>
                  <td>{msg.email}</td>
                  <td><strong>{msg.subject}</strong></td>
                  <td>{msg.message}</td>
                  <td>
                    <select
                      value={msg.status}
                      onChange={(e) => updateMessageStatusById(msg.id, e.target.value)}
                      className={`${styles.statusSelect} ${styles[msg.status]}`}
                    >
                      <option value="unread">غير مقروء</option>
                      <option value="read">مقروء</option>
                      <option value="replied">تم الرد</option>
                    </select>
                  </td>
                  <td>{new Date(msg.created_at).toLocaleDateString("ar-EG")}</td>
                  <td>
                    <button onClick={() => deleteMessageById(msg.id)} className={styles.deleteBtn}>
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