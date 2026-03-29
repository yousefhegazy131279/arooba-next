'use client';

import { useState, useEffect } from 'react';
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
  const { user, isLoggedIn } = useAuthStore();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [avg, setAvg] = useState<number | null>(averageRating ?? null);
  const [totalRatings, setTotalRatings] = useState<number>(0);

  // جلب تقييم المستخدم الحالي
  const fetchUserRating = async () => {
    if (!user) return;
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
  };

  // جلب متوسط التقييم وعدد التقييمات
  const fetchStats = async () => {
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
  };

  useEffect(() => {
    fetchStats();
    if (isLoggedIn) {
      fetchUserRating();
    }
  }, [targetId, targetType, isLoggedIn, user]);

  const handleRating = async (rating: number) => {
    if (!isLoggedIn) {
      alert('يجب تسجيل الدخول أولاً لتقييم المحتوى');
      return;
    }
    if (!user) {
      alert('يوجد خطأ في حساب المستخدم');
      return;
    }

    setLoading(true);
    const column = targetType === 'novel' ? 'novel_id' : 'chapter_id';
    const existing = userRating !== null;

    try {
      if (existing) {
        // تحديث التقييم
        const { error } = await supabase
          .from('ratings')
          .update({ rating })
          .eq('user_id', user.id)
          .eq(column, targetId);

        if (error) throw error;
      } else {
        // إضافة تقييم جديد
        const { error } = await supabase
          .from('ratings')
          .insert({
            user_id: user.id,
            [column]: targetId,
            rating,
          });

        if (error) throw error;
      }

      setUserRating(rating);
      await fetchStats(); // إعادة جلب المتوسط
    } catch (err: any) {
      console.error('Rating error:', err.message, err);
      alert(`فشل في حفظ التقييم: ${err.message || 'خطأ غير معروف'}`);
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