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

export default function UsersTab() {
  const { users, loadingUsers, fetchUsers, updateUserRoleAction, deleteUserById } = useAdminData();
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    await updateUserRoleAction(userId, newRole);
    setUpdating(null);
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingUsers) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loader}></div>
        <p>جاري تحميل المستخدمين...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>إدارة المستخدمين</h2>
        <button onClick={fetchUsers} className={styles.refreshBtn}>
          <RefreshIcon /> تحديث
        </button>
      </div>
      <div className={styles.tableToolbar}>
        <div className={styles.searchWrapper}>
          <SearchIcon />
          <input
            type="text"
            placeholder="بحث عن مستخدم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
      {filteredUsers.length === 0 ? (
        <div className={styles.emptyState}>لا توجد مستخدمين</div>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr><th>#</th><th>اسم المستخدم</th><th>البريد الإلكتروني</th><th>الدور</th><th>تاريخ التسجيل</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr key={user.id}>
                  <td>{idx + 1}</td>
                  <td><div className={styles.userCell}><span className={styles.userAvatar}>{user.username?.charAt(0) || "?"}</span>{user.username}</div></td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`${styles.statusSelect} ${styles[user.role]}`}
                      disabled={updating === user.id}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString("ar-EG")}</td>
                  <td>
                    <button onClick={() => deleteUserById(user.id)} className={styles.deleteBtn} disabled={updating === user.id}>
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