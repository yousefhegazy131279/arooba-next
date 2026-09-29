import type { Metadata } from 'next';
import Link from 'next/link';
import { getNotifications, markNotificationsRead } from '@/app/community/actions';
import CommunityIcon from '@/app/components/community/CommunityIcon';
import NotificationPermissionButton from '@/app/components/community/NotificationPermissionButton';
import styles from '@/app/components/community/Community.module.css';

export const metadata: Metadata = { title: 'الإشعارات | مجتمع عُروبة', robots: { index: false, follow: false } };

async function markAllRead() {
  'use server';
  await markNotificationsRead();
}

function notificationLabel(type: 'like' | 'comment' | 'follow' | 'system') {
  return { like: 'إعجاب جديد', comment: 'تعليق جديد', follow: 'متابعة جديدة', system: 'إشعار من عُروبة' }[type];
}

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const unread = notifications.filter(item => !item.is_read).length;
  return <div className={styles.narrow}>
    <Link href="/community" className={`${styles.textLink} ${styles.back}`}><CommunityIcon name="back" />العودة إلى المجتمع</Link>
    <header className={styles.hero}><div><span className={styles.eyebrow}>مجتمع عُروبة</span><h1>الإشعارات</h1><p>تصلك تفاعلات القرّاء والكتّاب مباشرة أثناء وجودك على الموقع.</p></div><div className={styles.actions}><NotificationPermissionButton />{unread > 0 && <form action={markAllRead}><button className={styles.secondary}>تحديد الكل كمقروء</button></form>}</div></header>
    {notifications.length === 0 ? <section className={`${styles.card} ${styles.state}`}><CommunityIcon name="bell" width={40} height={40} /><h2>لا توجد إشعارات بعد</h2><p>ستظهر هنا الإعجابات والتعليقات الجديدة عندما يتفاعل القرّاء مع مشاركاتك.</p></section> : <ul className={styles.list}>{notifications.map(item => <li key={item.id} className={`${styles.notification} ${item.is_read ? '' : styles.unread}`}><CommunityIcon name={item.type === 'like' ? 'heart' : item.type === 'comment' ? 'comment' : 'bell'} /><div><strong>{notificationLabel(item.type)}</strong><p className={styles.hint}>{item.content || 'لديك تفاعل جديد في مجتمع القرّاء.'}</p><time className={styles.meta} dateTime={item.created_at}>{new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.created_at))}</time>{item.post_id && <Link className={styles.textLink} href={`/community/post/${item.post_id}`}>عرض المنشور</Link>}</div>{!item.is_read && <span className={styles.badge}>جديد</span>}</li>)}</ul>}
  </div>;
}
