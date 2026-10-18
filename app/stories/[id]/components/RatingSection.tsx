'use client';
import { showToast } from '@/lib/toast';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '@/lib/supabaseClient';
import styles from '../story-page.module.css';

interface RatingSectionProps {
  targetId: string;
  targetType: 'novel' | 'chapter';
  novelId?: string;
  averageRating?: number | null;
  showAverageOnly?: boolean;
}

export function RatingSection({
  targetId,
  targetType,
  novelId,
  averageRating,
  showAverageOnly = false,
}: RatingSectionProps) {
  const userId = useAuthStore((state) => state.user?.id);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [avg, setAvg] = useState<number | null>(averageRating ?? null);
  const [totalRatings, setTotalRatings] = useState<number>(0);

  // جلب تقييم المستخدم الحالي
  const fetchUserRating = useCallback(async () => {
    // The auth store can still be hydrating after a page load. Read the actual
    // Supabase session instead of treating an empty local store as signed out.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserRating(null);
      return;
    }
    const column = targetType === 'novel' ? 'novel_id' : 'chapter_id';
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('user_id', user.id)
      .eq(column, targetId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user rating:', error.message);
      return;
    }
    if (data) setUserRating(data.rating);
  }, [targetId, targetType]);

  // جلب متوسط التقييم وعدد التقييمات
  const fetchStats = useCallback(async () => {
    const column = targetType === 'novel' ? 'novel_id' : 'chapter_id';
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq(column, targetId);

    if (error) {
      console.error('Error fetching ratings stats:', error.message, error);
      return;
    }
    if (data && data.length > 0) {
      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      setAvg(sum / data.length);
      setTotalRatings(data.length);
    } else {
      setAvg(null);
      setTotalRatings(0);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    void fetchStats();
    if (!showAverageOnly) void fetchUserRating();
  }, [fetchStats, fetchUserRating, showAverageOnly, userId]);

  const handleRating = async (rating: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ratings', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, ...(targetType === 'chapter' ? { chapter_id: targetId, ...(novelId ? { novel_id: novelId } : {}) } : { novel_id: targetId }) }) });
      const result = await response.json();
      if (response.status === 401) {
        showToast.error('سجّل الدخول في هذه النسخة من عُروبة لتقييم المحتوى');
        return;
      }
      if (!response.ok) throw new Error(result.error || 'تعذر حفظ التقييم');
      setUserRating(rating);
      await fetchStats(); // إعادة جلب المتوسط
    } catch (err: unknown) {
      console.error('Rating error:', err);
      showToast.error(`فشل في حفظ التقييم: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  // عرض النجوم فقط (لا تفاعل)
  if (showAverageOnly) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`${styles.star} ${i <= (avg ?? 0) ? styles.filled : ''}`}>
          ★
        </span>
      );
    }
    return (
      <div className={styles.starsWrapper}>
        {stars}
        {totalRatings > 0 && <span className={styles.ratingCount}>({totalRatings})</span>}
      </div>
    );
  }

  // عرض النجوم التفاعلية
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const active = hoverRating !== null ? i <= hoverRating : i <= (userRating ?? 0);
    stars.push(
      <span
        key={i}
        className={`${styles.star} ${active ? styles.filled : ''}`}
        onMouseEnter={() => setHoverRating(i)}
        onMouseLeave={() => setHoverRating(null)}
        onClick={() => handleRating(i)}
        style={{ cursor: loading ? 'wait' : 'pointer' }}
      >
        ★
      </span>
    );
  }

  return (
    <div className={styles.ratingDisplay}>
      <div className={styles.starsWrapper}>{stars}</div>
      {avg !== null && (
        <span className={styles.ratingValue}>
          ({avg.toFixed(1)} / {totalRatings} تقييم)
        </span>
      )}
    </div>
  );
}
