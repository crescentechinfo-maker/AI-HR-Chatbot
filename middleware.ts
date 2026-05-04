import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-CHANGE-IN-PRODUCTION-NOW'
  );

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and all API routes through
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Protect everything under /admin
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      await jwtVerify(token, getSecret());
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.delete('admin_token');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
