"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/stores/useAuthStore";
import styles from "./Admin.module.css";
import {
  getUsers,
  updateUserRole,
  deleteUser,
  getNovels,
  createNovel,
  updateNovel,
  deleteNovel,
  getChapters,
  createChapter,
  deleteChapter,
  getSuggestions,
  deleteSuggestion,
  getMessages,
  updateMessageStatus,
  deleteMessage,
  uploadCover,
  uploadChapterFile,
} from "./actions";

const tabs = [
  { id: "suggestions", name: "الاقتراحات", icon: "🗣️" },
  { id: "messages", name: "الرسائل", icon: "✉️" },
  { id: "novels", name: "الروايات", icon: "📚" },
  { id: "users", name: "المستخدمين", icon: "👥" },
];

export default function AdminPage() {
  const { isAdmin, isLoggedIn, loading: authLoading } = useAuthStore();
  const router = useRouter();

  // تبويب نشط
  const [activeTab, setActiveTab] = useState("suggestions");

  // بيانات كل قسم
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [novels, setNovels] = useState<any[]>([]);
  const [loadingNovels, setLoadingNovels] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // إدارة الروايات
  const [editingNovel, setEditingNovel] = useState<any>(null);
  const [novelFormData, setNovelFormData] = useState({
    title: "",
    author: "",
    category: "",
    description: "",
    cover: "",
    chapters_count: 0,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // إدارة الفصول (في نفس الصفحة)
  const [selectedNovel, setSelectedNovel] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [newChapter, setNewChapter] = useState({
    chapter_number: "",
    title: "",
    content: "",
  });
  const [chapterFile, setChapterFile] = useState<File | null>(null);

  // حالة تحميل الإحصائيات
  const [loadingStats, setLoadingStats] = useState(true);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) router.push("/login");
      else if (!isAdmin) router.push("/");
    }
  }, [authLoading, isLoggedIn, isAdmin, router]);

  // ---- جلب جميع البيانات عند تحميل الصفحة ----
  const fetchAllData = async () => {
    setLoadingStats(true);
    try {
      const [suggestionsData, messagesData, novelsData, usersData] = await Promise.all([
        getSuggestions(),
        getMessages(),
        getNovels(),
        getUsers(),
      ]);
      setSuggestions(suggestionsData);
      setMessages(messagesData);
      setNovels(novelsData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error fetching all data:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin && isLoggedIn) {
      fetchAllData();
    }
  }, [isAdmin, isLoggedIn]);

  // ---- دوال الاقتراحات ----
  const refreshSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await getSuggestions();
      setSuggestions(data);
    } catch (err: any) {
      alert("فشل تحميل الاقتراحات: " + err.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleDeleteSuggestion = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الاقتراح؟")) return;
    try {
      await deleteSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      alert("تم حذف الاقتراح بنجاح");
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  };

  // ---- دوال الرسائل ----
  const refreshMessages = async () => {
    setLoadingMessages(true);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (err: any) {
      alert("فشل تحميل الرسائل: " + err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUpdateMessageStatus = async (id: number, status: string) => {
    try {
      await updateMessageStatus(id, status);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch (err: any) {
      alert("فشل تحديث الحالة: " + err.message);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      alert("تم حذف الرسالة بنجاح");
    } catch (err: any) {
      alert("فشل الحذف: " + err.message);
    }
  };

  // ---- دوال الروايات ----
  const refreshNovels = async () => {
    setLoadingNovels(true);
    try {
      const data = await getNovels();
      setNovels(data);
    } catch (err: any) {
      alert("فشل تحميل الروايات: " + err.message);
    } finally {
      setLoadingNovels(false);
    }
  };

  const handleCoverUpload = async (file: File): Promise<string | null> => {
    
    try {
      return await uploadCover(file);
    } catch (error: any) {
      console.error("Full upload error:", error);
      alert(`فشل رفع الصورة: ${error.message || "خطأ غير معروف"}`);
      const proceed = confirm("هل تريد إضافة الرواية بدون صورة؟");
      if (proceed) return null;
      throw error;
    }
  };

  const handleNovelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let coverUrl = novelFormData.cover;
      if (coverFile) {
        const uploaded = await handleCoverUpload(coverFile);
        if (uploaded) coverUrl = uploaded;
        else if (uploaded === null) coverUrl = "";
        else return;
      }
      const novelData = { ...novelFormData, cover: coverUrl };
      if (editingNovel) {
        await updateNovel(editingNovel.id, novelData);
        alert("تم تحديث الرواية بنجاح");
      } else {
        await createNovel(novelData);
        alert("تم إضافة الرواية بنجاح");
      }
      resetNovelForm();
      refreshNovels();
    } catch (err: any) {
      alert("فشل حفظ الرواية: " + err.message);
    }
  };

  const editNovel = (novel: any) => {
    setEditingNovel(novel);
    setNovelFormData({
      title: novel.title,
      author: novel.author || "",
      category: novel.category || "",
      description: novel.description || "",
      cover: novel.cover || "",
      chapters_count: novel.chapters_count || 0,
    });
    setCoverFile(null);
  };

  const resetNovelForm = () => {
    setEditingNovel(null);
    setNovelFormData({
      title: "",
      author: "",
      category: "",
      description: "",
      cover: "",
      chapters_count: 0,
    });
    setCoverFile(null);
  };

  const handleDeleteNovel = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرواية؟ سيتم حذف جميع فصولها أيضاً.")) return;
    try {
      await deleteNovel(id);
      alert("تم حذف الرواية بنجاح");
      refreshNovels();
    } catch (err: any) {
      alert("فشل حذف الرواية: " + err.message);
    }
  };

  // ---- دوال الفصول (مضمنة) ----
  const fetchChapters = async (novelId: string) => {
    setLoadingChapters(true);
    try {
      const data = await getChapters(novelId);
      setChapters(data);
    } catch (err: any) {
      alert("فشل تحميل الفصول: " + err.message);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleChapterFileUpload = async (file: File): Promise<string | null> => {
    try {
      return await uploadChapterFile(file);
    } catch (err: any) {
      alert("فشل رفع ملف الفصل: " + err.message);
      const proceed = confirm("هل تريد إضافة الفصل بدون ملف؟");
      if (proceed) return null;
      throw err;
    }
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel) return;
    try {
      let fileUrl = null;
      if (chapterFile) {
        const uploaded = await handleChapterFileUpload(chapterFile);
        if (uploaded) fileUrl = uploaded;
        else if (uploaded === null) fileUrl = null;
        else return;
      }
      const chapterData = {
        novel_id: selectedNovel.id,
        chapter_number: parseInt(newChapter.chapter_number),
        title: newChapter.title,
        content: newChapter.content,
        word_file: fileUrl,
      };
      await createChapter(chapterData);
      alert("تم إضافة الفصل بنجاح");
      resetChapterForm();
      fetchChapters(selectedNovel.id);
      refreshNovels(); // لتحديث عدد الفصول في جدول الروايات
    } catch (err: any) {
      alert("فشل إضافة الفصل: " + err.message);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفصل؟")) return;
    try {
      await deleteChapter(chapterId);
      alert("تم حذف الفصل بنجاح");
      if (selectedNovel) {
        fetchChapters(selectedNovel.id);
        refreshNovels();
      }
    } catch (err: any) {
      alert("فشل حذف الفصل: " + err.message);
    }
  };

  const resetChapterForm = () => {
    setNewChapter({ chapter_number: "", title: "", content: "" });
    setChapterFile(null);
    const fileInput = document.getElementById("chapterFile") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // دوال جديدة لفتح وإغلاق قسم الفصول المضمن
  const openChaptersInline = (novel: any) => {
    setSelectedNovel(novel);
    fetchChapters(novel.id);
  };

  const closeChaptersInline = () => {
    setSelectedNovel(null);
    setChapters([]);
    resetChapterForm();
  };

  // ---- دوال المستخدمين ----
  const refreshUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      alert("فشل تحميل المستخدمين: " + err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      alert("تم تحديث الدور بنجاح");
    } catch (err: any) {
      alert("فشل تحديث الدور: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    setUpdating(userId);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("تم حذف المستخدم بنجاح");
    } catch (err: any) {
      alert("فشل حذف المستخدم: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  // الإحصائيات (بعد التحميل)
  const stats = {
    suggestions: suggestions.length,
    messages: messages.length,
    novels: novels.length,
    users: users.length,
  };

  // عرض التحميل العام
  if (authLoading || loadingStats) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loader}></div>
          <p>جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.heroBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
        <div className={styles.gridOverlay}></div>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>لوحة تحكم عُروبة 🏛️</h1>
          <p className={styles.subtitle}>إدارة اقتراحات القراء والروايات والرسائل والمستخدمين</p>
        </div>

        {/* الإحصائيات */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>💭</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>إجمالي الاقتراحات</span>
              <strong className={styles.statValue}>{stats.suggestions}</strong>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📚</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>إجمالي الروايات</span>
              <strong className={styles.statValue}>{stats.novels}</strong>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>✉️</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>إجمالي الرسائل</span>
              <strong className={styles.statValue}>{stats.messages}</strong>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>إجمالي المستخدمين</span>
              <strong className={styles.statValue}>{stats.users}</strong>
            </div>
          </div>
        </div>

        {/* التبويبات */}
        <div className={styles.adminTabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabText}>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* محتوى الاقتراحات */}
        {activeTab === "suggestions" && (
          <div className={styles.tabPane}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🗣️</span> اقتراحات القراء
              </h2>
              <button onClick={refreshSuggestions} className={styles.refreshBtn} disabled={loadingSuggestions}>
                🔄 تحديث
              </button>
            </div>
            {loadingSuggestions ? (
              <div className={styles.loadingState}>
                <div className={styles.loader}></div>
                <p>جاري تحميل الاقتراحات...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>💭</span>
                <p>لا توجد اقتراحات بعد</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الاسم</th>
                      <th>الرواية المقترحة</th>
                      <th>التعليق</th>
                      <th>التاريخ</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.userAvatar}>{item.name?.charAt(0) || "?"}</span>
                            {item.name}
                          </div>
                        </td>
                        <td>
                          <strong className={styles.storyHighlight}>{item.story_title}</strong>
                        </td>
                        <td className={styles.commentCell}>{item.comment || <span className={styles.noComment}>-</span>}</td>
                        <td>{new Date(item.created_at).toLocaleDateString("ar-EG")}</td>
                        <td>
                          <button onClick={() => handleDeleteSuggestion(item.id)} className={styles.deleteBtn}>
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* محتوى الرسائل */}
        {activeTab === "messages" && (
          <div className={styles.tabPane}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>✉️</span> الرسائل الواردة
              </h2>
              <button onClick={refreshMessages} className={styles.refreshBtn} disabled={loadingMessages}>
                🔄 تحديث
              </button>
            </div>
            {loadingMessages ? (
              <div className={styles.loadingState}>
                <div className={styles.loader}></div>
                <p>جاري تحميل الرسائل...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>✉️</span>
                <p>لا توجد رسائل بعد</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الاسم</th>
                      <th>البريد الإلكتروني</th>
                      <th>الموضوع</th>
                      <th>الرسالة</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((msg, idx) => (
                      <tr key={msg.id}>
                        <td>{idx + 1}</td>
                        <td>{msg.name}</td>
                        <td>{msg.email}</td>
                        <td>
                          <strong>{msg.subject}</strong>
                        </td>
                        <td className={styles.messageCell}>{msg.message}</td>
                        <td>
                          <select
                            value={msg.status}
                            onChange={(e) => handleUpdateMessageStatus(msg.id, e.target.value)}
                            className={`${styles.statusSelect} ${styles[msg.status]}`}
                          >
                            <option value="unread">غير مقروء</option>
                            <option value="read">مقروء</option>
                            <option value="replied">تم الرد</option>
                          </select>
                        </td>
                        <td>{new Date(msg.created_at).toLocaleDateString("ar-EG")}</td>
                        <td>
                          <button onClick={() => handleDeleteMessage(msg.id)} className={styles.deleteBtn}>
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* محتوى الروايات (مع قسم الفصول المضمن) */}
        {activeTab === "novels" && (
          <div className={styles.tabPane}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📚</span> إدارة الروايات
              </h2>
              <button onClick={refreshNovels} className={styles.refreshBtn} disabled={loadingNovels}>
                🔄 تحديث
              </button>
            </div>

            {/* نموذج إضافة/تعديل رواية */}
            <form onSubmit={handleNovelSubmit} className={styles.addForm}>
              <h3 className={styles.formTitle}>{editingNovel ? "تعديل الرواية" : "إضافة رواية جديدة"}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>عنوان الرواية</label>
                  <input
                    value={novelFormData.title}
                    onChange={(e) => setNovelFormData({ ...novelFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>المؤلف</label>
                  <input
                    value={novelFormData.author}
                    onChange={(e) => setNovelFormData({ ...novelFormData, author: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>التصنيف</label>
                  <select
                    value={novelFormData.category}
                    onChange={(e) => setNovelFormData({ ...novelFormData, category: e.target.value })}
                    required
                  >
                    <option value="">اختر التصنيف</option>
                    <option value="كلاسيكيات">كلاسيكيات</option>
                    <option value="مغامرات">مغامرات</option>
                    <option value="خيال علمي">خيال علمي</option>
                    <option value="دراما">دراما</option>
                    <option value="تاريخية">تاريخية</option>
                    <option value="رومانسية">رومانسية</option>
                    <option value="غموض">غموض</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>عدد الفصول (تقديري)</label>
                  <input
                    type="number"
                    value={novelFormData.chapters_count}
                    onChange={(e) =>
                      setNovelFormData({
                        ...novelFormData,
                        chapters_count: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>صورة الغلاف</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                  {novelFormData.cover && !coverFile && (
                    <p className={styles.fileHint}>
                      الصورة الحالية:{" "}
                      <a href={novelFormData.cover} target="_blank">
                        عرض
                      </a>
                    </p>
                  )}
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>نبذة عن الرواية</label>
                  <textarea
                    rows={3}
                    value={novelFormData.description}
                    onChange={(e) => setNovelFormData({ ...novelFormData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                {editingNovel && (
                  <button type="button" onClick={resetNovelForm} className={styles.cancelBtn}>
                    إلغاء
                  </button>
                )}
                <button type="submit" className={styles.submitBtn}>
                  {editingNovel ? "تحديث الرواية" : "إضافة الرواية"}
                </button>
              </div>
            </form>

            {/* جدول الروايات */}
            {loadingNovels ? (
              <div className={styles.loadingState}>
                <div className={styles.loader}></div>
                <p>جاري تحميل الروايات...</p>
              </div>
            ) : novels.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📚</span>
                <p>لا توجد روايات مضافة بعد</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الغلاف</th>
                      <th>العنوان</th>
                      <th>المؤلف</th>
                      <th>التصنيف</th>
                      <th>الفصول</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {novels.map((novel, idx) => (
                      <tr key={novel.id}>
                        <td>{idx + 1}</td>
                        <td>
                          {novel.cover ? (
                            <img src={novel.cover} alt={novel.title} className={styles.coverThumb} />
                          ) : (
                            <span className={styles.noCover}>لا غلاف</span>
                          )}
                        </td>
                        <td>
                          <strong>{novel.title}</strong>
                        </td>
                        <td>{novel.author || "غير محدد"}</td>
                        <td>{novel.category || "غير محدد"}</td>
                        <td>{novel.chapters_count || 0}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button onClick={() => editNovel(novel)} className={styles.editBtn}>
                              ✏️ تعديل
                            </button>
                            <button onClick={() => handleDeleteNovel(novel.id)} className={styles.deleteBtn}>
                              🗑️ حذف
                            </button>
                            <button onClick={() => openChaptersInline(novel)} className={styles.chaptersBtn}>
                              📖 فصول
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* قسم الفصول المضمن (يظهر أسفل الجدول عند اختيار رواية) */}
            {selectedNovel && (
              <div className={styles.chaptersInlineSection}>
                <div className={styles.chaptersHeader}>
                  <h3 className={styles.chaptersTitle}>📖 فصول: {selectedNovel.title}</h3>
                  <button onClick={closeChaptersInline} className={styles.closeChaptersBtn}>
                    ✕ إغلاق
                  </button>
                </div>

                <form onSubmit={handleChapterSubmit} className={styles.chapterForm}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>رقم الفصل</label>
                      <input
                        type="number"
                        value={newChapter.chapter_number}
                        onChange={(e) => setNewChapter({ ...newChapter, chapter_number: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>عنوان الفصل</label>
                      <input
                        value={newChapter.title}
                        onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>ملف الفصل (PDF, Word)</label>
                      <input
                        type="file"
                        id="chapterFile"
                        accept=".doc,.docx,.pdf"
                        onChange={(e) => setChapterFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>محتوى الفصل (اختياري)</label>
                      <textarea
                        rows={3}
                        value={newChapter.content}
                        onChange={(e) => setNewChapter({ ...newChapter, content: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.submitBtn}>
                      ➕ إضافة الفصل
                    </button>
                    <button type="button" onClick={resetChapterForm} className={styles.resetBtn}>
                      إعادة تعيين
                    </button>
                  </div>
                </form>

                {loadingChapters ? (
                  <div className={styles.loadingState}>
                    <div className={styles.loader}></div>
                    <p>جاري تحميل الفصول...</p>
                  </div>
                ) : chapters.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📭</span>
                    <p>لا توجد فصول مضافة بعد.</p>
                  </div>
                ) : (
                  <div className={styles.chaptersList}>
                    {chapters.map((ch) => (
                      <div key={ch.id} className={styles.chapterCard}>
                        <div className={styles.chapterInfo}>
                          <span className={styles.chapterNumber}>الفصل {ch.chapter_number}</span>
                          <span className={styles.chapterTitle}>{ch.title}</span>
                          {ch.word_file && <span className={styles.fileType}>📄</span>}
                        </div>
                        <div className={styles.chapterActions}>
                          {ch.word_file && (
                            <a href={ch.word_file} target="_blank" className={styles.downloadLink}>
                              📥 تحميل
                            </a>
                          )}
                          <button onClick={() => handleDeleteChapter(ch.id)} className={`${styles.deleteBtn} ${styles.small}`}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* محتوى المستخدمين */}
        {activeTab === "users" && (
          <div className={styles.tabPane}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>👥</span> إدارة المستخدمين
              </h2>
              <button onClick={refreshUsers} className={styles.refreshBtn} disabled={loadingUsers}>
                🔄 تحديث
              </button>
            </div>
            {loadingUsers ? (
              <div className={styles.loadingState}>
                <div className={styles.loader}></div>
                <p>جاري تحميل المستخدمين...</p>
              </div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>👥</span>
                <p>لا توجد مستخدمين بعد</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>اسم المستخدم</th>
                      <th>البريد الإلكتروني</th>
                      <th>الدور</th>
                      <th>تاريخ التسجيل</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr key={user.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.userAvatar}>{user.username?.charAt(0) || "?"}</span>
                            {user.username}
                          </div>
                        </td>
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
                          <button onClick={() => handleDeleteUser(user.id)} className={styles.deleteBtn} disabled={updating === user.id}>
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}