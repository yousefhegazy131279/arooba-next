import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1. الحصول على الكوكيز واستخراج التوكن
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    let accessToken = null;
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')) {
        accessToken = cookie.value;
        break;
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'غير مصرح (لا يوجد توكن)' }, { status: 401 });
    }

    // 2. التحقق من المستخدم
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'غير مصرح (فشل التحقق)' }, { status: 401 });
    }

    // 3. التحقق من صلاحية admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح (غير مدير)' }, { status: 403 });
    }

    // 4. قراءة البيانات من الطلب
    const { userId, newRole } = await request.json();
    if (!userId || !newRole || !['user', 'admin'].includes(newRole)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    // 5. استخدام service role client للتحديث
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}