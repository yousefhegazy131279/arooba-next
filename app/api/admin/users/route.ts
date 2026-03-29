import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1. الحصول على الكوكيز (await لأنها Promise)
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // 2. البحث عن توكن المصادقة (عادةً يبدأ بـ 'sb-' وينتهي بـ '-auth-token')
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

    // 3. التحقق من المستخدم باستخدام التوكن
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'غير مصرح (فشل التحقق)' }, { status: 401 });
    }

    // 4. التحقق من صلاحية admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح (غير مدير)' }, { status: 403 });
    }

    // 5. استخدام service role لجلب جميع المستخدمين من العرض
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: users, error: usersError } = await serviceClient
      .from('users_with_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    return NextResponse.json(users || []);
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}