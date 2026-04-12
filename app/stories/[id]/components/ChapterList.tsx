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
  image?: string;
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
        <span className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </span>
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
          <span className={styles.titleIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          فصول الرواية
        </h2>
        <div className={styles.sectionDecoration}>
          <span className={styles.line}></span>
          <span className={styles.star}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
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
                      <span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </span>
                    </a>
                    <a
                      href={chapter.word_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.actionBtn} ${styles.read}`}
                      onClick={(e) => e.stopPropagation()}
                      title="عرض الملف"
                    >
                      <span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </span>
                    </a>
                  </>
                )}
              </div>
              <button className={styles.expandBtn}>
                {expandedChapter === chapter.id ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
            </div>

            {expandedChapter === chapter.id && (
              <div className={styles.chapterContent}>
                {chapter.image && (
                  <div className={styles.chapterImagePreview}>
                    <img src={chapter.image} alt={chapter.title} />
                  </div>
                )}

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
                        <span>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </span>
                        تحميل الملف
                      </a>
                      <a
                        href={chapter.word_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.btnDownload} ${styles.read}`}
                      >
                        <span>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </span>
                        عرض في المتصفح
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