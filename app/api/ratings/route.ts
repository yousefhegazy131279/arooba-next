import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireActionUser } from '@/lib/actionAuth';
import { entityIdSchema } from '@/lib/validation';
const schema = z.object({ novel_id: entityIdSchema.optional(), chapter_id: entityIdSchema.optional(), rating: z.number().int().min(1).max(5) }).refine(data => data.novel_id || data.chapter_id);
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  try {
    const { supabase, user } = await requireActionUser('ratings.write');
    const { chapter_id, rating } = parsed.data;
    let novel_id = parsed.data.novel_id;
    if (chapter_id) {
      const { data: chapter } = await supabase.from('chapters').select('novel_id').eq('id', chapter_id).single();
      if (!chapter || (novel_id && String(chapter.novel_id) !== String(novel_id))) return NextResponse.json({ error: 'الفصل غير موجود' }, { status: 404 });
      novel_id = chapter.novel_id;
    }
    let query = supabase.from('ratings').select('id').eq('user_id', user.id).eq('novel_id', novel_id);
    query = chapter_id ? query.eq('chapter_id', chapter_id) : query.is('chapter_id', null);
    const { data: existing, error: readError } = await query.maybeSingle();
    if (readError) throw readError;
    const { error } = existing ? await supabase.from('ratings').update({ rating }).eq('id', existing.id).eq('user_id', user.id) : await supabase.from('ratings').insert({ user_id: user.id, novel_id, chapter_id: chapter_id || null, rating });
    if (error) throw error;
    let stats = supabase.from('ratings').select('rating').eq('novel_id', novel_id);
    stats = chapter_id ? stats.eq('chapter_id', chapter_id) : stats.is('chapter_id', null);
    const { data } = await stats;
    const count = data?.length || 0;
    revalidatePath('/stories/' + novel_id);
    return NextResponse.json({ success: true, total_ratings: count, avg_rating: count ? data!.reduce((sum, r) => sum + r.rating, 0) / count : 0 });
  } catch { return NextResponse.json({ error: 'تعذر حفظ التقييم. تحقق من تسجيل الدخول ثم حاول مجددًا.' }, { status: 400 }); }
}

