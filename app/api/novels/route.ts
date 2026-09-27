import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer';
import { entityIdSchema } from '@/lib/validation';

export async function GET() {
  try {
    const supabase = await createClient();
    // جلب جميع الروايات من جدول novels
    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // إرجاع البيانات كمصفوفة (حتى لو كانت فارغة)
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error fetching novels:', err)
    return NextResponse.json(
      { error: 'فشل تحميل الروايات' },
      { status: 500 }
    )
  }
}