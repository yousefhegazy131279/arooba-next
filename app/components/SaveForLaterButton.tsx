'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/lib/toast';
import styles from './SaveForLaterButton.module.css';

export default function SaveForLaterButton({ novelId }: { novelId: string }) {
  const { user, loading: authLoading } = useAuthStore();
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkedKey, setCheckedKey] = useState('');
  const key = `${user?.id || ''}:${novelId}`;
  const saved = Boolean(user && savedFor === user.id);
  const checking = authLoading || Boolean(user && checkedKey !== key);

  useEffect(() => {
    if (authLoading || !user) return;
    let live = true;
    void supabase.from('library_items').select('novel_id').eq('user_id', user.id).eq('novel_id', novelId).maybeSingle()
      .then(({ data, error }) => {
        if (!live) return;
        if (error) showToast.error('تعذر تحميل حالة الحفظ');
        else setSavedFor(data ? user.id : null);
        setCheckedKey(`${user.id}:${novelId}`);
      });
    return () => { live = false; };
  }, [authLoading, user, novelId]);

  async function toggle() {
    if (!user) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(`/stories/${novelId}`)}`;
      return;
    }
    setBusy(true);
    const { error } = saved
      ? await supabase.from('library_items').delete().eq('user_id', user.id).eq('novel_id', novelId)
      : await supabase.from('library_items').upsert({ user_id: user.id, novel_id: novelId, shelf: 'want_to_read', updated_at: new Date().toISOString() }, { onConflict: 'user_id,novel_id' });
    setBusy(false);
    if (error) { showToast.error('تعذر تحديث مكتبتك. حاول مرة أخرى.'); return; }
    setSavedFor(saved ? null : user.id);
    showToast.success(saved ? 'أُزيلت الرواية من مكتبتك' : 'حُفظت الرواية للقراءة لاحقًا');
  }

  return <button type="button" className={`${styles.button} ${saved ? styles.saved : ''}`} disabled={busy || checking} onClick={() => void toggle()} aria-pressed={saved}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 3.5h14v17l-7-4-7 4v-17Z" /></svg>
    {checking ? 'جارٍ التحميل…' : busy ? 'جارٍ الحفظ…' : saved ? 'محفوظة في مكتبتي' : 'احفظها للقراءة لاحقًا'}
  </button>;
}
