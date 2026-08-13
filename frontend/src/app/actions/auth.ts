'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    return { error: 'Failed to connect to backend' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/admin/login');
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');

  try {
    const res = await fetch(`${apiUrl}/admin/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Cookie': `admin_token=${token.value}` } : {})
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return { error: 'Failed to create admin. ' + await res.text() };
    }
    
    redirect('/admin');
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    return { error: 'Failed to connect to backend' };
  }
}
