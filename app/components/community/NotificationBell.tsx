'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/lib/toast';
import styles from './Community.module.css';

export default function NotificationBell() {
  const userId = useAuthStore(state => state.user?.id);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let live = true;
    const refresh = async () => {
      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
      if (live && count !== null) setUnread(count);
    };
    void refresh();
    const channel = supabase.channel(`community-notifications-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        void refresh();
        if (payload.eventType === 'INSERT') {
          const item = payload.new as { content?: string; post_id?: string };
          const message = item.content || 'لديك إشعار جديد في مجتمع عُروبة';
          showToast.success(message);
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notification = new Notification('عُروبة', { body: message, tag: item.post_id || 'community' });
            notification.onclick = () => { window.focus(); window.location.href = item.post_id ? `/community/post/${item.post_id}` : '/community/notifications'; };
          }
        }
      }).subscribe();
    return () => { live = false; void supabase.removeChannel(channel); };
  }, [userId]);
  if (!userId) return null;
  return <Link className={styles.notificationBell} href="/community/notifications" aria-label={`الإشعارات${unread ? `، ${unread} غير مقروءة` : ''}`}><span aria-hidden="true">🔔</span>{unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}</Link>;
}
