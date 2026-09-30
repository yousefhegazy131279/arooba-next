'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeRedirect } from '@/lib/safeRedirect';
import styles from './GoogleSignIn.module.css';

type Props = { redirectTo: string; label: string };

export default function GoogleSignIn({ redirectTo, label }: Props) {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('settings')))
      .then((settings) => { if (active) setAvailable(settings.external?.google === true); })
      .catch(() => { if (active) setError('تعذر التحقق من خدمة Google الآن.'); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function signIn() {
    setBusy(true);
    setError('');
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', safeRedirect(redirectTo));
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() },
    });
    if (signInError) {
      setError('تعذر بدء تسجيل الدخول عبر Google. حاول مرة أخرى.');
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.separator}><span>أو</span></div>
      <button className={styles.googleButton} type="button" onClick={signIn} disabled={!available || busy || checking}>
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.83 7.18l7.73 6C44.36 38.01 46.98 31.82 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.6.27-3.14.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        <span>{busy ? 'جاري التحويل إلى Google...' : label}</span>
      </button>
      {!available && !checking && !error && <p className={styles.note}>الدخول عبر Google قيد التجهيز وسيتاح قريبًا.</p>}
      {error && <p className={styles.note} role="alert">{error}</p>}
    </div>
  );
}
