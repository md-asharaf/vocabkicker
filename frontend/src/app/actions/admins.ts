'use server';

import { apiUrl, fetchWithAuth } from '../../lib/api';

export type AdminUser = {
  id: string;
  email: string;
  createdAt: number;
  updatedAt: number;
};

export async function listAdminsAction(): Promise<{ admins?: AdminUser[]; error?: string }> {
  const res = await fetchWithAuth(`${apiUrl}/admins`, { method: 'GET' });

  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch { /* ignore */ }
    return { error: `Failed to list admins. ${errorMsg}` };
  }

  const admins = await res.json();
  return { admins };
}

export async function updateAdminAction(id: string, formData: FormData): Promise<{ error?: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const body: Record<string, string> = {};
  if (email?.trim()) body.email = email.trim();
  if (password?.trim()) body.password = password.trim();

  const res = await fetchWithAuth(`${apiUrl}/admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch { /* ignore */ }
    return { error: `Failed to update admin. ${errorMsg}` };
  }
  return {};
}

export async function deleteAdminAction(id: string): Promise<{ error?: string }> {
  const res = await fetchWithAuth(`${apiUrl}/admins/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch { /* ignore */ }
    return { error: `Failed to delete admin. ${errorMsg}` };
  }
  return {};
}
