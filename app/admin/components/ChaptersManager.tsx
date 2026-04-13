"use client";

import { useEffect, useState } from "react";
import { useAdminData, Chapter } from "../hooks/useAdminData";
import styles from "../Admin.module.css";

// تعريف الواجهة Props محلياً
interface Props {
  novelId: string;
  novelTitle: string;
  onClose: () => void;
}

export default function ChaptersManager({ novelId, novelTitle, onClose }: Props) {
  const { fetchChapters, createChapterAction, updateChapterAction, deleteChapterById } = useAdminData();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formData, setFormData] = useState({
    chapter_number: "",
    title: "",
    content: "",
  });
  const [chapterFile, setChapterFile] = useState<File | null>(null);
  const [chapterImage, setChapterImage] = useState<File | null>(null);

  const loadChapters = async () => {
    setLoading(true);
    const data = await fetchChapters(novelId);
    setChapters(data);
    setLoading(false);
  };

  useEffect(() => {
    loadChapters();
  }, [novelId]);

  const resetForm = () => {
    setEditingChapter(null);
    setFormData({ chapter_number: "", title: "", content: "" });
    setChapterFile(null);
    setChapterImage(null);
    const fileInput = document.getElementById("chapterFile") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    const imageInput = document.getElementById("chapterImage") as HTMLInputElement;
    if (imageInput) imageInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chapterNumber = parseInt(formData.chapter_number);
    if (isNaN(chapterNumber)) {
      alert("رقم الفصل غير صالح");
      return;
    }
    const chapterData = {
      novel_id: novelId,
      chapter_number: chapterNumber,
      title: formData.title,
      content: formData.content,
      word_file: null,
      image: null,
    };
    if (editingChapter) {
      await updateChapterAction(editingChapter.id, chapterData, chapterFile || undefined, chapterImage || undefined);
    } else {
      await createChapterAction(chapterData, chapterFile || undefined, chapterImage || undefined);
    }
    resetForm();
    await loadChapters();
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      chapter_number: chapter.chapter_number.toString(),
      title: chapter.title,
      content: chapter.content || "",
    });
    setChapterFile(null);
    setChapterImage(null);
  };

  const handleDelete = async (id: string) => {
    await deleteChapterById(id);
    await loadChapters();
  };

  return (
    <div className={styles.chaptersInlineSection}>
      <div className={styles.chaptersHeader}>
        <h3 className={styles.chaptersTitle}>فصول: {novelTitle}</h3>
        <button onClick={onClose} className={styles.closeChaptersBtn}>✖ إغلاق</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.chapterForm}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>رقم الفصل</label>
            <input
              type="number"
              value={formData.chapter_number}
              onChange={(e) => setFormData({ ...formData, chapter_number: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>عنوان الفصل</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>ملف الفصل (PDF/Word)</label>
            <input
              type="file"
              id="chapterFile"
              accept=".doc,.docx,.pdf"
              onChange={(e) => setChapterFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>صورة الفصل (اختياري)</label>
            <input
              type="file"
              id="chapterImage"
              accept="image/*"
              onChange={(e) => setChapterImage(e.target.files?.[0] || null)}
            />
            {editingChapter?.image && !chapterImage && (
              <p className={styles.fileHint}>الحالية: <a href={editingChapter.image} target="_blank">عرض</a></p>
            )}
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>محتوى نصي (اختياري)</label>
            <textarea rows={3} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn}>{editingChapter ? "تحديث الفصل" : "➕ إضافة الفصل"}</button>
          <button type="button" onClick={resetForm} className={styles.resetBtn}>إعادة تعيين</button>
        </div>
      </form>

      {loading ? (
        <div className={styles.loadingState}><div className={styles.loader}></div><p>جاري تحميل الفصول...</p></div>
      ) : chapters.length === 0 ? (
        <div className={styles.emptyState}>لا توجد فصول مضافة بعد.</div>
      ) : (
        <div className={styles.chaptersList}>
          {chapters.map((ch) => (
            <div key={ch.id} className={styles.chapterCard}>
              <div className={styles.chapterInfo}>
                <span className={styles.chapterNumber}>الفصل {ch.chapter_number}</span>
                <span className={styles.chapterTitle}>{ch.title}</span>
                {ch.image && (
                  <div className={styles.chapterImage}>
                    <img src={ch.image} alt={ch.title} />
                  </div>
                )}
                {ch.word_file && <span>📎</span>}
              </div>
              <div className={styles.chapterActions}>
                <button onClick={() => handleEdit(ch)} className={styles.editBtn}>✏️ تعديل</button>
                {ch.word_file && (
                  <a href={ch.word_file} target="_blank" className={styles.downloadLink}>⬇️ تحميل</a>
                )}
                <button onClick={() => handleDelete(ch.id)} className={`${styles.deleteBtn} ${styles.small}`}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}