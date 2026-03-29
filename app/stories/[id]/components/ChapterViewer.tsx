// app/stories/[id]/components/ChapterViewer.tsx
'use client';

import { useEffect } from 'react';
import styles from '../story-page.module.css';

interface ChapterViewerProps {
  chapter: { title: string; content?: string; file_url?: string };
  onClose: () => void;
}

export function ChapterViewer({ chapter, onClose }: ChapterViewerProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      data-aos="fade"
      data-aos-duration="300"
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        data-aos="zoom-in"
        data-aos-duration="400"
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{chapter.title}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          {chapter.content ? (
            <div
              className={styles.chapterText}
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          ) : chapter.file_url ? (
            <iframe
              src={chapter.file_url}
              className={styles.pdfViewer}
              title={chapter.title}
            />
          ) : (
            <p className={styles.emptyMessage}>لا يوجد محتوى لعرضه.</p>
          )}
        </div>
      </div>
    </div>
  );
}