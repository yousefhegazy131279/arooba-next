'use client';

import { useEffect, useState } from 'react';
import CommunityIcon from './CommunityIcon';
import styles from './NotificationBell.module.css';

export default function NotificationPermissionButton() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [available, setAvailable] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const supported = 'Notification' in window;
      setAvailable(supported);
      setPermission(supported ? Notification.permission : null);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!available || permission !== 'default') return null;

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.permissionBtn}
      onClick={handleRequest}
      disabled={requesting}
    >
      <span className={styles.permissionIcon}>
        <CommunityIcon name="bell" size={16} />
      </span>
      <span className={styles.permissionText}>
        <strong>تفعيل تنبيهات المتصفح</strong>
        <span>لتصلك الإشعارات فور حدوثها</span>
      </span>
      <span className={styles.permissionArrow}>
        <CommunityIcon
          name="back"
          size={14}
          style={{ transform: 'rotate(180deg)' }}
        />
      </span>
    </button>
  );
}