import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { entityIdSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const novelId = searchParams.get('novelId');

  if (!novelId) {
    return NextResponse.json({ error: 'novelId is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', entityIdSchema.parse(novelId))
      .order('chapter_number', { ascending: true });

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