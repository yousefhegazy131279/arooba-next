'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDirectInbox, getDirectUnreadCount } from '@/app/community/social/actions';
import { supabase } from '@/lib/supabaseClient';
import type { DirectConversation } from '@/lib/social-types';
import Avatar from './Avatar';
import styles from '../AuthSidebar.module.css';

export default function SidebarDirectMessages({ userId, isOpen, onNavigate }: { userId: string; isOpen: boolean; onNavigate: () => void }) {
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState<DirectConversation[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [count, inbox] = await Promise.all([getDirectUnreadCount(), getDirectInbox()]);
        if (active) { setUnread(count); setRecent(inbox.conversations.slice(0, 3)); }
      } catch { /* Older schema or transient connection: keep sidebar usable. */ }
    };
    void refresh();
    const channel = supabase.channel(`sidebar-dm-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${userId}` }, () => { void refresh(); }).subscribe();
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [userId]);
  useEffect(() => { if (isOpen) { void Promise.all([getDirectUnreadCount(), getDirectInbox()]).then(([count, inbox]) => { setUnread(count); setRecent(inbox.conversations.slice(0, 3)); }).catch(() => {}); } }, [isOpen]);
  return <div className={styles.directSection}><Link href="/community/messages" className={`${styles.actionBtn} ${styles.messageBtn}`} onClick={onNavigate}><span className={styles.btnIcon} aria-hidden="true">✉</span><span className={styles.btnText}>الرسائل الخاصة</span>{unread > 0 && <b className={styles.dmBadge}>{unread > 99 ? '99+' : unread}</b>}</Link>{isOpen && recent.length > 0 && <div className={styles.recentMessages}>{recent.map(item => <Link key={item.id} href={`/community/messages?thread=${item.id}`} onClick={onNavigate} className={styles.recentMessage}><Avatar name={item.peer.full_name || item.peer.username || 'ع'} src={item.peer.avatar_url} size={30} /><span><strong>{item.peer.full_name || item.peer.username || 'عضو عُروبة'}</strong><small>{item.last_message_preview || 'ابدأ الحديث'}</small></span>{item.unread_count > 0 && <b>{item.unread_count}</b>}</Link>)}</div>}</div>;
}
