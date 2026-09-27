'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './Community.module.css';

export function safeAvatarUrl(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith('/') && !src.startsWith('//') && !src.includes('\\')) return src;
  try {
    const url = new URL(src);
    const allowed = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://invalid.local');
    if (url.protocol === 'https:' && url.origin === allowed.origin && url.pathname.startsWith('/storage/v1/object/public/') && !url.username && !url.password) return url.href;
  } catch { /* Invalid image URLs fall back to the member's initial. */ }
  return null;
}

export default function Avatar({ src, name, className, size = 44 }: { src?: string | null; name: string; className?: string; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  const safeSrc = safeAvatarUrl(src);
  if (safeSrc && failed !== safeSrc) return <Image src={safeSrc} width={size} height={size} sizes={`${size}px`} className={className || styles.avatar} alt="" onError={() => setFailed(safeSrc)} />;
  return <span className={className || styles.avatar} aria-hidden="true">{name.trim().slice(0, 1) || 'ع'}</span>;
}
