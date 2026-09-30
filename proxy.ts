import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { safeRedirect } from '@/lib/safeRedirect';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  // Reading and contact pages are public. Reader progress is stored locally for
  // guests and synchronised to Supabase after they sign in.
  const protectedPaths = ['/profile', '/library', '/write', '/admin', '/community/create', '/community/notifications', '/community/moderation'];
  const isProtected = protectedPaths.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  function redirect(url: URL) {
    const target = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => target.cookies.set(cookie));
    return target;
  }
  if (isProtected && !user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirectTo', path + request.nextUrl.search);
    return redirect(url);
  }
  if (user && path === '/login') {
    return redirect(new URL(safeRedirect(request.nextUrl.searchParams.get('redirectTo')), request.url));
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)'],
};
