import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const cookieStore = await cookies();
  const refresh = cookieStore.get('refresh_token');
  let currentToken = cookieStore.get('admin_token')?.value;

  if (!currentToken && refresh) {
    const refreshRes = await fetch(`${apiUrl}/admin/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `refresh_token=${refresh.value}` }
    });

    if (refreshRes.ok) {
      const setCookieHeader = refreshRes.headers.get('set-cookie');
      if (setCookieHeader) {
        const parts = setCookieHeader.split(',');
        for (const cookieStr of parts) {
          if (cookieStr.includes('admin_token=')) {
            const match = cookieStr.match(/admin_token=([^;]+)/);
            if (match) {
              currentToken = match[1];
              cookieStore.set('admin_token', currentToken, { path: '/', httpOnly: true });
            }
          }
          if (cookieStr.includes('refresh_token=')) {
            const match = cookieStr.match(/refresh_token=([^;]+)/);
            if (match) {
              cookieStore.set('refresh_token', match[1], { path: '/', httpOnly: true, maxAge: 7 * 24 * 60 * 60 });
            }
          }
        }
      }
    } else {
      redirect('/admin/login');
    }
  }
  else if (!currentToken && !refresh) {

  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(currentToken ? { 'Cookie': `admin_token=${currentToken}` } : {})
    }
  });

  if (res.status === 401 && refresh) {
    const refreshRes = await fetch(`${apiUrl}/admin/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `refresh_token=${refresh.value}` }
    });

    if (refreshRes.ok) {
      const setCookieHeader = refreshRes.headers.get('set-cookie');
      let newToken = currentToken;
      if (setCookieHeader) {
        const parts = setCookieHeader.split(',');
        for (const cookieStr of parts) {
          if (cookieStr.includes('admin_token=')) {
            const match = cookieStr.match(/admin_token=([^;]+)/);
            if (match) {
              newToken = match[1];
              cookieStore.set('admin_token', newToken, { path: '/', httpOnly: true });
            }
          }
          if (cookieStr.includes('refresh_token=')) {
            const match = cookieStr.match(/refresh_token=([^;]+)/);
            if (match) {
              cookieStore.set('refresh_token', match[1], { path: '/', httpOnly: true, maxAge: 7 * 24 * 60 * 60 });
            }
          }
        }
      }

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(newToken ? { 'Cookie': `admin_token=${newToken}` } : {})
        }
      });
    } else {
      redirect('/admin/login');
    }
  }

  if (res.status === 401) {
    redirect('/admin/login');
  }

  return res;
}
