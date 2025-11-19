import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/database.types';

const protectedRoutes = ['/dashboard', '/gallery', '/admin', '/gear-optimizer'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthPage = pathname.startsWith('/login');

  if (!session && isProtected) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    if (pathname !== '/dashboard') {
      redirectUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isAuthPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/gallery/:path*', '/admin/:path*', '/gear-optimizer/:path*']
};
