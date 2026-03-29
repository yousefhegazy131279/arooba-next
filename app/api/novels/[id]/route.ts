import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // انتظار params
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });
    }

    // جلب الرواية
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (novelError) throw novelError;

    if (!novel) {
      return NextResponse.json({ error: 'الرواية غير موجودة' }, { status: 404 });
    }

    // عدد الفصول
    const { count: chaptersCount, error: countError } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', id);

    if (countError) throw countError;

    // متوسط التقييمات
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('novel_id', id);

    let avgRating = 0;
    let totalRatings = 0;
    if (ratings && ratings.length > 0) {
      totalRatings = ratings.length;
      avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
    }

    return NextResponse.json({
      ...novel,
      chapters_count: chaptersCount || 0,
      avg_rating: avgRating,
      total_ratings: totalRatings,
    });
  } catch (err) {
    console.error('Error fetching novel:', err);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}