import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const cookieStore = await cookies();
  const refresh = cookieStore.get('refresh_token');
  let currentToken = cookieStore.get('admin_token')?.value;

  // 1. If admin_token is missing but refresh_token exists, try to get a new admin_token before making the request
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
      // Refresh failed (e.g. refresh token expired)
      redirect('/admin/login');
    }
  }
  // 2. If both tokens are missing, user is fully logged out (unless it's the initial register without existing admins)
  else if (!currentToken && !refresh) {
    // Note: To support first-time registration, registerAction could potentially bypass this, 
    // but typically it's handled properly by the backend API returning a 401 if admins exist.
    // However, if we redirect here, the first admin can never register. 
    // Let's NOT redirect here instantly for all endpoints. Let the API throw 401 first, or check it later.
    // Wait, earlier I had `redirect('/admin/login');` here. This broke the first-time admin registration!
    // So let's just proceed without a token. If the backend requires it, it will return 401.
  }

  // 3. Make the actual request
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(currentToken ? { 'Cookie': `admin_token=${currentToken}` } : {})
    }
  });

  // 4. If request failed with 401 Unauthorized, and we have a refresh token, the admin_token might have JUST expired. Rotate.
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

      // Retry the original request with the new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(newToken ? { 'Cookie': `admin_token=${newToken}` } : {})
        }
      });
    } else {
      // Refresh token is invalid/expired
      redirect('/admin/login');
    }
  }

  // 5. If we still got 401 and there's no refresh token (or refresh failed), redirect to login.
  if (res.status === 401) {
    redirect('/admin/login');
  }

  return res;
}
