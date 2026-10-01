'use client';

import { useState } from 'react';
import styles from './Avatar.module.css';

/**
 * يتحقق من أن الرابط آمن لعرضه كصورة.
 * يقبل: مسارات نسبية، وروابط HTTPS من Supabase Storage.
 */
export function safeAvatarUrl(src?: string | null): string | null {
  if (!src) return null;
  const trimmed = String(src).trim();
  if (!trimmed) return null;

  // المسارات النسبية
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.username || url.password) return null;

    // روابط Supabase Storage (المسار المتوقع)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const allowed = new URL(supabaseUrl);
        if (url.origin === allowed.origin) {
          return url.href;
        }
      } catch {
        // تجاهل الأخطاء
      }
    }

    // مرونة: اقبل أي رابط HTTPS (آمن لعرض الصور)
    if (url.protocol === 'https:') return url.href;
  } catch {
    return null;
  }

  return null;
}

type Status = 'online' | 'offline' | 'busy' | null;

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  size?: number;
  ring?: boolean;
  status?: Status;
  shape?: 'circle' | 'rounded' | 'square';
  alt?: string;
}

export default function Avatar({
  src,
  name,
  className,
  size = 44,
  ring = false,
  status = null,
  shape = 'circle',
  alt,
}: AvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const safeSrc = safeAvatarUrl(src);
  const hasImage = Boolean(safeSrc && failed !== safeSrc);

  const classes = [
    styles.avatar,
    styles[shape],
    ring ? styles.ring : '',
    status ? styles.hasStatus : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.4) }}
      aria-label={name}
    >
      {hasImage ? (
        // نستخدم <img> بدلاً من next/image لتجنب مشاكل domain whitelist
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeSrc as string}
          width={size}
          height={size}
          className={styles.image}
          alt={alt || name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(safeSrc as string)}
        />
      ) : (
        <span className={styles.fallback} aria-hidden="true">
          {name.trim().slice(0, 1) || 'ع'}
        </span>
      )}
      {status && (
        <span
          className={`${styles.status} ${styles[`status_${status}`]}`}
          aria-hidden="true"
        />
      )}
    </span>
  );
}