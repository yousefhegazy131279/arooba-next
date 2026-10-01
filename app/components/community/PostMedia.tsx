'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { CommunityPost } from '@/lib/community-types';
import CommunityIcon from './CommunityIcon';
import styles from './PostMedia.module.css';

export default function PostMedia({ post }: { post: CommunityPost }) {
  if (!post.attachments?.length) return null;

  const count = post.attachments.length;
  const layout = count === 1 ? 'single' : count === 2 ? 'double' : 'multiple';

  return (
    <div className={`${styles.mediaGrid} ${styles[layout]}`}>
      {post.attachments.map((item, index) => {
        const { data } = supabase.storage.from('community-media').getPublicUrl(item.path);
        const url = data.publicUrl;

        /* ===== صورة ===== */
        if (item.type === 'image') {
          return (
            <a
              key={item.path}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mediaFrame}
              aria-label={`فتح صورة ${item.name}`}
            >
              <img src={url} alt={item.name} loading="lazy" />
              <span className={styles.mediaOverlay}>
                <span className={styles.overlayIcon}>
                  <CommunityIcon name="eye" size={18} />
                </span>
                <span className={styles.overlayText}>عرض الصورة</span>
              </span>
            </a>
          );
        }

        /* ===== فيديو ===== */
        if (item.type === 'video') {
          return (
            <div key={item.path} className={`${styles.mediaFrame} ${styles.videoFrame}`}>
              <video
                src={url}
                controls
                preload="metadata"
                aria-label={item.name}
              />
            </div>
          );
        }

        /* ===== كتاب (PDF / DOCX) ===== */
        return (
          <Link
            key={item.path}
            className={styles.documentCard}
            href={`/community/post/${post.id}/read/${index}`}
          >
            <span
              className={`${styles.documentSymbol} ${
                item.type === 'pdf' ? styles.pdfSymbol : styles.docxSymbol
              }`}
              aria-hidden="true"
            >
              {item.type === 'pdf' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="15" y2="17" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="m9 13 2 2 4-4" />
                </svg>
              )}
            </span>

            <span className={styles.documentBody}>
              <span className={styles.documentType}>
                {item.type === 'pdf' ? 'ملف PDF' : 'مستند Word'}
              </span>
              <strong className={styles.documentName}>{item.name}</strong>
              <span className={styles.documentCta}>
                <span>اقرأ الكتاب صفحةً بعد صفحة</span>
                <CommunityIcon
                  name="back"
                  size={13}
                  style={{ transform: 'rotate(180deg)' }}
                />
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
} 