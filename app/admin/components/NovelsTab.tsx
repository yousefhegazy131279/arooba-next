"use client";

import { useEffect, useState } from "react";
import { useAdminData, Novel } from "../hooks/useAdminData";
import ChaptersManager from "./ChaptersManager";
import styles from "../Admin.module.css";

// أيقونات SVG (محدثة)
const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
    <path d="M3 21h18" />
  </svg>
);
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" />
    <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const ChaptersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// مكون Skeleton للبطاقات أثناء التحميل
const NovelCardSkeleton = () => (
  <div className={styles.novelCardSkeleton}>
    <div className={styles.skeletonCover}></div>
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonTitle}></div>
      <div className={styles.skeletonText}></div>
      <div className={styles.skeletonText}></div>
      <div className={styles.skeletonActions}></div>
    </div>
  </div>
);

export default function NovelsTab() {
  const { novels, loadingNovels, fetchNovels, createNovelAction, updateNovelAction, deleteNovelById } = useAdminData();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    description: "",
    cover: "",
    chapters_count: 0,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [selectedNovelForChapters, setSelectedNovelForChapters] = useState<Novel | null>(null);

  useEffect(() => {
    fetchNovels();
    // تفعيل AOS إذا كانت المكتبة موجودة
    if (typeof window !== "undefined" && (window as any).AOS) {
      (window as any).AOS.refresh();
    }
  }, [fetchNovels]);

  const resetForm = () => {
    setEditingNovel(null);
    setFormData({ title: "", author: "", category: "", description: "", cover: "", chapters_count: 0 });
    setCoverFile(null);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const novelData = { ...formData };
    if (editingNovel) {
      await updateNovelAction(editingNovel.id, novelData, coverFile || undefined);
    } else {
      await createNovelAction(novelData, coverFile || undefined);
    }
    resetForm();
  };

  const handleEdit = (novel: Novel) => {
    setEditingNovel(novel);
    setFormData({
      title: novel.title,
      author: novel.author,
      category: novel.category,
      description: novel.description || "",
      cover: novel.cover,
      chapters_count: novel.chapters_count || 0,
    });
    setCoverFile(null);
    setShowModal(true);
  };

  const filteredNovels = novels.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>إدارة الروايات</h2>
        <div className={styles.buttonGroup}>
          <button onClick={fetchNovels} className={styles.refreshBtn}>
            <RefreshIcon /> تحديث
          </button>
          <button onClick={() => setShowModal(true)} className={styles.submitBtn}>
            <AddIcon /> إضافة رواية
          </button>
        </div>
      </div>

      <div className={styles.tableToolbar}>
        <div className={styles.searchWrapper}>
          <SearchIcon />
          <input
            type="text"
            placeholder="بحث عن رواية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* عرض البطاقات أو حالة التحميل */}
      {loadingNovels ? (
        <div className={styles.cardsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <NovelCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredNovels.length === 0 ? (
        <div className={styles.emptyState}>لا توجد روايات</div>
      ) : (
        <div className={styles.cardsGrid}>
          {filteredNovels.map((novel, idx) => (
            <div
              key={novel.id}
              className={styles.novelCard}
              data-aos="fade-up"
              data-aos-delay={Math.min(idx * 50, 300)}
              data-aos-duration="600"
            >
              <div className={styles.cardCover}>
                {novel.cover ? (
                  <img src={novel.cover} alt={novel.title} />
                ) : (
                  <div className={styles.noCover}>📖</div>
                )}
                <div className={styles.cardOverlay}>
                  <button onClick={() => handleEdit(novel)} className={styles.cardEditBtn}>
                    <EditIcon />
                  </button>
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{novel.title}</h3>
                <p className={styles.cardAuthor}>{novel.author}</p>
                <div className={styles.cardMeta}>
                  <span className={styles.cardCategory}>{novel.category || "غير مصنف"}</span>
                  <span className={styles.cardChapters}>{novel.chapters_count || 0} فصل</span>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => setSelectedNovelForChapters(novel)} className={styles.chaptersBtn}>
                    <ChaptersIcon /> فصول
                  </button>
                  <button onClick={() => deleteNovelById(novel.id)} className={styles.deleteBtn}>
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال إضافة/تعديل رواية */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => resetForm()}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingNovel ? "تعديل الرواية" : "إضافة رواية جديدة"}</h3>
              <button onClick={resetForm} className={styles.modalClose}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>العنوان</label>
                  <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>المؤلف</label>
                  <input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>التصنيف</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                    <option value="">اختر</option>
                    <option>كلاسيكيات</option><option>مغامرات</option><option>خيال علمي</option>
                    <option>دراما</option><option>تاريخية</option><option>رومانسية</option><option>غموض</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>عدد الفصول (تقديري)</label>
                  <input type="number" value={formData.chapters_count} onChange={e => setFormData({ ...formData, chapters_count: parseInt(e.target.value) || 0 })} />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>صورة الغلاف</label>
                  <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                  {formData.cover && !coverFile && <p className={styles.fileHint}>الحالية: <a href={formData.cover} target="_blank">عرض</a></p>}
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>نبذة</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>{editingNovel ? "تحديث" : "إضافة"}</button>
                <button type="button" onClick={resetForm} className={styles.cancelBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedNovelForChapters && (
        <ChaptersManager
          novelId={selectedNovelForChapters.id}
          novelTitle={selectedNovelForChapters.title}
          onClose={() => setSelectedNovelForChapters(null)}
        />
      )}
    </div>
  );
}