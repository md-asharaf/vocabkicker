import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let token = request.cookies.get('admin_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token && refreshToken) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/admin/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (res.ok) {
          const setCookies = res.headers.getSetCookie();
          const response = NextResponse.next();

          if (setCookies && setCookies.length > 0) {
            for (const cookieStr of setCookies) {
              const parts = cookieStr.split(';')[0].split('=');
              if (parts.length === 2) {
                const maxAge = parts[0].trim() === 'refresh_token' ? 604800 : 900;
                response.cookies.set(parts[0].trim(), parts[1].trim(), {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/',
                  maxAge
                });
                if (parts[0].trim() === 'admin_token') {
                  token = parts[1].trim();
                }
              }
            }
          }

          if (request.nextUrl.pathname === '/admin/login' && token) {
            return NextResponse.redirect(new URL('/admin', request.url));
          }
          return response;
        }
      } catch (e) {
        console.error("Auto-refresh failed", e);
      }
    }

    if (request.nextUrl.pathname === '/admin') {
      if (!token) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    if (request.nextUrl.pathname === '/admin/login') {
      if (token) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/login'],
};
