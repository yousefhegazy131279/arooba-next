'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { CommunityPost } from '@/lib/community-types';
import styles from './Community.module.css';

export default function PostMedia({ post }: { post: CommunityPost }) {
  if (!post.attachments?.length) return null;
  return <div className={styles.mediaGrid}>
    {post.attachments.map((item, index) => {
      const { data } = supabase.storage.from('community-media').getPublicUrl(item.path);
      const url = data.publicUrl;
      if (item.type === 'image') return <a key={item.path} href={url} target="_blank" rel="noopener noreferrer" className={styles.mediaFrame}><img src={url} alt={item.name} loading="lazy" /></a>;
      if (item.type === 'video') return <div key={item.path} className={styles.mediaFrame}><video src={url} controls preload="metadata" aria-label={item.name} /></div>;
      return <Link key={item.path} className={styles.documentCard} href={`/community/post/${post.id}/read/${index}`}><span className={styles.documentSymbol}>{item.type === 'pdf' ? 'PDF' : 'W'}</span><span><strong>{item.name}</strong><small>افتح الكتاب واقرأه صفحةً بعد صفحة ←</small></span></Link>;
    })}
  </div>;
}
