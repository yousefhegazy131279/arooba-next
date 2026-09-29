'use client';

import { useEffect, useState } from 'react';
import styles from './Community.module.css';

export default function NotificationPermissionButton() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => { setAvailable('Notification' in window); setPermission('Notification' in window ? Notification.permission : null); });
    return () => cancelAnimationFrame(frame);
  }, []);
  if (!available || permission !== 'default') return null;
  return <button type="button" className={styles.secondary} onClick={async () => setPermission(await Notification.requestPermission())}>تفعيل تنبيهات المتصفح</button>;
}
