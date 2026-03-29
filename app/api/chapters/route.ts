import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const novelId = searchParams.get('novelId');

  if (!novelId) {
    return NextResponse.json({ error: 'novelId is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', parseInt(novelId))
      .order('chapter_order', { ascending: true });

    if (error) throw error;

    // جلب متوسط التقييمات لكل فصل (يمكن تحسينه بجمع البيانات مرة واحدة)
    const chaptersWithRatings = await Promise.all(
      (data || []).map(async (chapter) => {
        const { data: ratings, error: ratingsError } = await supabase
          .from('ratings')
          .select('rating')
          .eq('chapter_id', chapter.id);

        let avgRating = 0;
        let totalRatings = 0;
        if (ratings && ratings.length > 0) {
          totalRatings = ratings.length;
          avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
        }
        return {
          ...chapter,
          avg_rating: avgRating,
          total_ratings: totalRatings,
        };
      })
    );

    return NextResponse.json(chaptersWithRatings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'فشل تحميل الفصول' }, { status: 500 });
  }
}