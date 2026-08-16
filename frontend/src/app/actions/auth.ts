'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiUrl, fetchWithAuth } from '@/lib/api';

export async function loginAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const res = await fetch(`${apiUrl}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return { error: 'Invalid credentials' };
    }

    const setCookies = res.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      const cookieStore = await cookies();
      for (const cookieStr of setCookies) {
        const parts = cookieStr.split(';')[0].split('=');
        if (parts.length === 2) {
          cookieStore.set(parts[0].trim(), parts[1].trim(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: parts[0].trim() === 'refresh_token' ? 604800 : 900
          });
        }
      }
      redirect('/admin');
    } else {
      return { error: 'Invalid response from server' };
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    return { error: 'Failed to connect to backend' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  cookieStore.delete('refresh_token');
  redirect('/admin/login');
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const res = await fetchWithAuth(`${apiUrl}/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let errorMsg = 'Please try again later.';
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {
        // Ignore parse error
      }
      return { error: `Failed to create admin. ${errorMsg}` };
    }

    redirect('/admin');
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    return { error: 'Failed to connect to backend' };
  }
}
