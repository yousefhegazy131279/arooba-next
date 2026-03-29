import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
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