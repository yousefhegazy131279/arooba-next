'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { isFavorite, addFavorite, removeFavorite } from '@/app/admin/actions';
import { showToast } from '@/lib/toast';
import styles from './SaveForLaterButton.module.css';

interface Props {
  novelId: number | string;
  className?: string;
}

export default function SaveForLaterButton({ novelId, className }: Props) {
  const { user, isLoggedIn, loading: authLoading } = useAuthStore();

  /* ✨ كل الحالات تبدأ بـ false — متطابقة على الخادم والعميل */
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  /* ✨ نُعلّم المكوّن بأنه mounted بعد أول render */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ✨ نجلب حالة المفضلة فقط بعد mount */
  useEffect(() => {
    if (!mounted || !isLoggedIn || !user?.id) return;

    let active = true;
    setChecking(true);

    void isFavorite(user.id, novelId)
      .then((value) => {
        if (active) setSaved(value);
      })
      .catch(() => {
        /* تجاهل — الزر سيظهر الحالة الافتراضية */
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [mounted, isLoggedIn, user?.id, novelId]);

  /* ✨ تبديل الحفظ */
  const toggle = useCallback(async () => {
    if (!user?.id || busy) return;

    setBusy(true);
    try {
      if (saved) {
        await removeFavorite(user.id, novelId);
        setSaved(false);
        showToast.success('تمت الإزالة من مكتبتك');
      } else {
        await addFavorite(user.id, novelId);
        setSaved(true);
        showToast.success('تمت الإضافة إلى مكتبتك');
      }
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : 'تعذّرت العملية'
      );
    } finally {
      setBusy(false);
    }
  }, [user?.id, busy, saved, novelId]);

  /* ==========================================================
     ✨ حالة عدم تسجيل الدخول
     ⚠️ لا تستخدم disabled هنا — لأنها قد تختلف بين SSR/Client
     ========================================================== */
  if (!isLoggedIn) {
    return (
      <button
        type="button"
        className={`${styles.button} ${className || ''}`}
        onClick={() => showToast.error('سجّل الدخول لحفظ الرواية')}
        aria-label="سجّل الدخول لحفظ الرواية"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M5 3.5h14v17l-7-4-7 4v-17Z" />
        </svg>
        <span>احفظها للقراءة لاحقاً</span>
      </button>
    );
  }

  /* ==========================================================
     ✨ الحالة العادية (مستخدم مسجّل)
     `disabled` تعتمد فقط على busy || checking (كلاهما false في البداية)
     ========================================================== */
  const isDisabled = busy || checking;

  return (
    <button
      type="button"
      className={`${styles.button} ${saved ? styles.saved : ''} ${
        className || ''
      }`}
      disabled={isDisabled}
      onClick={() => void toggle()}
      aria-pressed={saved}
      aria-label={saved ? 'إزالة من مكتبتك' : 'احفظها للقراءة لاحقاً'}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M5 3.5h14v17l-7-4-7 4v-17Z" />
      </svg>

      <span>
        {checking
          ? 'جارٍ التحميل…'
          : busy
          ? 'جارٍ الحفظ…'
          : saved
          ? 'محفوظة في مكتبتي'
          : 'احفظها للقراءة لاحقاً'}
      </span>
    </button>
  );
}