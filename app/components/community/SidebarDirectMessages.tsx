'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getDirectInbox,
  getDirectUnreadCount,
} from '@/app/community/social/actions';
import { supabase } from '@/lib/supabaseClient';
import type { DirectConversation } from '@/lib/social-types';
import Avatar from './Avatar';
import CommunityIcon from './CommunityIcon';
import styles from '../AuthSidebar.module.css';

function relativeTime(value: string) {
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ي`;
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

export default function SidebarDirectMessages({
  userId,
  isOpen,
  onNavigate,
}: {
  userId: string;
  isOpen: boolean;
  onNavigate: () => void;
}) {
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState<DirectConversation[]>([]);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const [count, inbox] = await Promise.all([
          getDirectUnreadCount(),
          getDirectInbox(),
        ]);
        if (active) {
          setUnread(count);
          setRecent(inbox.conversations.slice(0, 3));
        }
      } catch {}
    };

    void refresh();

    const channel = supabase
      .channel(`sidebar-dm-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    window.addEventListener('direct-inbox-changed', refresh);
    const timer = window.setInterval(refresh, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('direct-inbox-changed', refresh);
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!isOpen) return;
    void Promise.all([getDirectUnreadCount(), getDirectInbox()])
      .then(([count, inbox]) => {
        setUnread(count);
        setRecent(inbox.conversations.slice(0, 3));
      })
      .catch(() => {});
  }, [isOpen]);

  return (
    <div className={styles.directSection}>
      {/* ===== الرابط الرئيسي ===== */}
      <Link
        href="/community/messages"
        className={`${styles.actionBtn} ${styles.messageBtn}`}
        onClick={onNavigate}
      >
        <span className={styles.btnIcon} aria-hidden="true">
          <CommunityIcon name="send" size={17} />
        </span>
        <span className={styles.btnText}>الرسائل الخاصة</span>
        {unread > 0 && (
          <b className={styles.dmBadge}>
            {unread > 99 ? '99+' : unread.toLocaleString('ar')}
          </b>
        )}
      </Link>

      {/* ===== آخر 3 محادثات ===== */}
      {isOpen && recent.length > 0 && (
        <div className={styles.recentMessages}>
          <div className={styles.recentHeader}>
            <span className={styles.recentTitle}>الأحدث</span>
            <Link
              href="/community/messages"
              className={styles.recentViewAll}
              onClick={onNavigate}
            >
              عرض الكل
            </Link>
          </div>

          {recent.map((item) => (
            <Link
              key={item.id}
              href={`/community/messages?thread=${item.id}`}
              onClick={onNavigate}
              className={`${styles.recentMessage} ${
                item.unread_count > 0 ? styles.recentMessageUnread : ''
              }`}
            >
              <Avatar
                name={
                  item.peer.full_name || item.peer.username || 'عضو'
                }
                src={item.peer.avatar_url}
                size={32}
              />

              <div className={styles.recentBody}>
                <div className={styles.recentTop}>
                  <strong>
                    {item.peer.full_name ||
                      item.peer.username ||
                      'عضو عُروبة'}
                  </strong>
                  {item.last_message_at && (
                    <span className={styles.recentTime}>
                      {relativeTime(item.last_message_at)}
                    </span>
                  )}
                </div>
                <span className={styles.recentPreview}>
                  {item.last_message_preview || 'ابدأ الحديث'}
                </span>
              </div>

              {item.unread_count > 0 && (
                <b className={styles.recentBadge}>
                  {item.unread_count.toLocaleString('ar')}
                </b>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}