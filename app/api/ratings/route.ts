import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // الحصول على المستخدم من الجلسة (يجب أن يكون مسجلاً)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { novel_id, chapter_id, rating } = body;

    if (!novel_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    // التحقق من وجود تقييم سابق لنفس المستخدم
    let query = supabase
      .from('ratings')
      .select('id')
      .eq('user_id', user.id)
      .eq('novel_id', novel_id);

    if (chapter_id) {
      query = query.eq('chapter_id', chapter_id);
    } else {
      query = query.is('chapter_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    let result;
    if (existing) {
      // تحديث التقييم الموجود
      result = await supabase
        .from('ratings')
        .update({ rating })
        .eq('id', existing.id);
    } else {
      // إضافة تقييم جديد
      result = await supabase
        .from('ratings')
        .insert({
          user_id: user.id,
          novel_id,
          chapter_id: chapter_id || null,
          rating,
        });
    }

    if (result.error) throw result.error;

    // إعادة المتوسط الجديد وعدد التقييمات للعنصر المطلوب
    let avgRating = 0;
    let totalRatings = 0;
    if (chapter_id) {
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('chapter_id', chapter_id);
      if (!error && ratings) {
        totalRatings = ratings.length;
        avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
      }
    } else {
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('novel_id', novel_id)
        .is('chapter_id', null);
      if (!error && ratings) {
        totalRatings = ratings.length;
        avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
      }
    }

    return NextResponse.json({
      success: true,
      avg_rating: avgRating,
      total_ratings: totalRatings,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'فشل حفظ التقييم' }, { status: 500 });
  }
}