import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { safeRedirect } from '@/lib/safeRedirect';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  const next = safeRedirect(request.nextUrl.searchParams.get('next'));
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirectTo', next);
  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    loginUrl.searchParams.set('authError', error === 'access_denied' ? 'cancelled' : 'callback');
    return NextResponse.redirect(loginUrl);
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    loginUrl.searchParams.set('authError', 'callback');
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !data.user) {
    loginUrl.searchParams.set('authError', 'callback');
    return NextResponse.redirect(loginUrl);
  }

  // Google users do not pass through the email/password registration form.
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();
  if (lookupError) {
    console.error('OAuth profile lookup failed:', lookupError);
  } else if (!existing) {
    const metadata = data.user.user_metadata ?? {};
    const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.slice(0, 80) : '';
    const avatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null;
    const username = `reader_${data.user.id.replace(/-/g, '').slice(0, 12)}`;
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: data.user.id,
      username,
      full_name: fullName,
      avatar_url: avatar,
      role: 'user',
    });
    if (profileError?.code !== '23505' && profileError) {
      console.error('OAuth profile creation failed:', profileError);
    }
  }
  return response;
}
