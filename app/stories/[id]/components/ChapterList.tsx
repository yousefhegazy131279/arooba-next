'use client';

import { useState } from 'react';
import { RatingSection } from './RatingSection';
import { ChapterViewer } from './ChapterViewer';
import styles from '../story-page.module.css';

interface Chapter {
  id: string;
  title: string;
  content?: string;
  word_file?: string;
  order: number;
  novel_id: string;
  average_rating: number | null;
  total_ratings: number;
}

interface ChapterListProps {
  chapters: Chapter[];
  novelId: string;
}

export function ChapterList({ chapters, novelId }: ChapterListProps) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const toggleChapter = (id: string) => {
    setExpandedChapter(expandedChapter === id ? null : id);
  };

  if (chapters.length === 0) {
    return (
      <div
        className={styles.emptyChapters}
        data-aos="fade-up"
        suppressHydrationWarning
      >
        <span className={styles.emptyIcon}>📭</span>
        <p>لا توجد فصول مضافة بعد.</p>
      </div>
    );
  }

  return (
    <div className={styles.chaptersSection}>
      <div
        className={styles.sectionHeader}
        data-aos="fade-up"
        suppressHydrationWarning
      >
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleIcon}>📖</span>
          فصول الرواية
        </h2>
        <div className={styles.sectionDecoration}>
          <span className={styles.line}></span>
          <span className={styles.star}>✨</span>
          <span className={styles.line}></span>
        </div>
      </div>

      <div className={styles.chaptersList}>
        {chapters.map((chapter, idx) => (
          <div
            key={chapter.id}
            className={`${styles.chapterCard} ${
              expandedChapter === chapter.id ? styles.expanded : ''
            }`}
            data-aos="fade-up"
            data-aos-delay={idx * 50}
            suppressHydrationWarning
          >
            <div className={styles.chapterHeader} onClick={() => toggleChapter(chapter.id)}>
              <div className={styles.chapterNumber}>
                <span className={styles.num}>{idx + 1}</span>
                <span className={styles.text}>الفصل</span>
              </div>
              <div className={styles.chapterTitle}>{chapter.title || 'بدون عنوان'}</div>

              <div className={styles.chapterRating}>
                <RatingSection
                  targetId={chapter.id}
                  targetType="chapter"
                  novelId={novelId}
                  averageRating={chapter.average_rating}
                  showAverageOnly
                />
                {/* تم إزالة السطر المكرر: <span>({chapter.total_ratings})</span> */}
              </div>

              <div className={styles.chapterActions}>
                {chapter.word_file && (
                  <>
                    <a
                      href={`${chapter.word_file}?download=true`}
                      className={`${styles.actionBtn} ${styles.download}`}
                      onClick={(e) => e.stopPropagation()}
                      title="تحميل الملف"
                    >
                      <span>📥</span>
                    </a>
                    <a
                      href={chapter.word_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.actionBtn} ${styles.read}`}
                      onClick={(e) => e.stopPropagation()}
                      title="عرض الملف"
                    >
                      <span>📖</span>
                    </a>
                  </>
                )}
              </div>
              <button className={styles.expandBtn}>
                {expandedChapter === chapter.id ? '▲' : '▼'}
              </button>
            </div>

            {expandedChapter === chapter.id && (
              <div className={styles.chapterContent}>
                <div className={styles.rateSection}>
                  <span className={styles.rateLabel}>قيم هذا الفصل:</span>
                  <RatingSection
                    targetId={chapter.id}
                    targetType="chapter"
                    novelId={novelId}
                    averageRating={chapter.average_rating}
                  />
                </div>

                {chapter.content && (
                  <div className={styles.chapterText}>{chapter.content}</div>
                )}

                {chapter.word_file && (
                  <div className={styles.pdfViewer}>
                    <iframe
                      src={chapter.word_file}
                      width="100%"
                      height="500px"
                      frameBorder="0"
                      title={chapter.title}
                    />
                  </div>
                )}

                <div className={styles.chapterDownload}>
                  {chapter.word_file && (
                    <>
                      <a
                        href={`${chapter.word_file}?download=true`}
                        className={styles.btnDownload}
                      >
                        <span>📥</span> تحميل الملف
                      </a>
                      <a
                        href={chapter.word_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.btnDownload} ${styles.read}`}
                      >
                        <span>📖</span> عرض في المتصفح
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedChapter && (
        <ChapterViewer
          chapter={selectedChapter}
          onClose={() => setSelectedChapter(null)}
        />
      )}
    </div>
  );
}