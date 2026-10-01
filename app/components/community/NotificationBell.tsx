'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/lib/toast';
import CommunityIcon from './CommunityIcon';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const userId = useAuthStore((state) => state.user?.id);
  const [unread, setUnread] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let live = true;

    const refresh = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (live && count !== null) setUnread(count);
    };

    void refresh();

    const channel = supabase
      .channel(`community-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          void refresh();
          if (payload.eventType === 'INSERT') {
            // تأثير نبضة على الجرس
            setPulse(true);
            window.setTimeout(() => setPulse(false), 900);

            const item = payload.new as {
              id: string;
              type?: string;
              content?: string;
              post_id?: string;
              actor_id?: string;
            };

            void (async () => {
              let message = item.content || 'لديك إشعار جديد في مجتمع عُروبة';
              let destination = item.post_id
                ? `/community/post/${item.post_id}`
                : '/community/notifications';

              if (item.type === 'follow' && item.actor_id) {
                const { data: actor } = await supabase
                  .from('profiles')
                  .select('username,full_name')
                  .eq('id', item.actor_id)
                  .maybeSingle();
                if (actor) {
                  message = `${
                    actor.full_name || actor.username || 'عضو جديد'
                  } يتابعك الآن في مجتمع عُروبة`;
                  if (actor.username)
                    destination = `/community/user/${encodeURIComponent(
                      actor.username
                    )}`;
                }
              }

              if (!live) return;
              showToast.success(message);

              if (
                typeof Notification !== 'undefined' &&
                Notification.permission === 'granted'
              ) {
                const notification = new Notification('عُروبة', {
                  body: message,
                  tag: item.id,
                });
                notification.onclick = () => {
                  window.focus();
                  window.location.href = destination;
                };
              }
            })();
          }
        }
      )
      .subscribe();

    return () => {
      live = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <Link
      className={`${styles.bell} ${pulse ? styles.bellPulse : ''} ${
        unread > 0 ? styles.bellHasUnread : ''
      }`}
      href="/community/notifications"
      aria-label={`الإشعارات${unread ? `، ${unread} غير مقروءة` : ''}`}
    >
      <span className={styles.icon} aria-hidden="true">
        <CommunityIcon name="bell" size={18} />
      </span>

      {unread > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {unread > 99 ? '99+' : unread.toLocaleString('ar')}
        </span>
      )}

      <span className={styles.glow} aria-hidden="true" />
    </Link>
  );
}