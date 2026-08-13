'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createQuestionAction(formData: FormData) {
  const word = formData.get('word');
  const mnemonic = formData.get('mnemonic');
  const definition = formData.get('definition');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  const refresh = cookieStore.get('refresh_token');

  if (!token && !refresh) {
    redirect('/admin/login');
  }

  async function fetchWithAuth(url: string, options: RequestInit): Promise<Response> {
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

    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': `admin_token=${currentToken}`
      }
    });

    if (res.status === 401 && refresh) {
      // Token expired, attempt rotation
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
        // Retry the original request
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Cookie': `admin_token=${newToken}`
          }
        });
      } else {
        redirect('/admin/login');
      }
    }
    return res;
  }

  const res = await fetchWithAuth(`${apiUrl}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, mnemonic, definition }),
  });

  if (!res.ok) {
    return { error: 'Failed to create question. ' + await res.text() };
  }
}

export async function deleteQuestionAction(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');

  if (!token) {
    redirect('/admin/login');
  }

  const res = await fetch(`${apiUrl}/questions/${id}`, {
    method: 'DELETE',
    headers: { 'Cookie': `admin_token=${token.value}` }
  });

  if (!res.ok) {
    throw new Error('Failed to delete question');
  }
}
