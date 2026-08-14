'use server';

import { fetchWithAuth } from '../../lib/api';

export async function getUploadUrlAction(ext: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const res = await fetchWithAuth(`${apiUrl}/questions/upload-url?ext=${ext}`, {
    method: 'GET',
  });

  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // Ignore parsing error
    }
    return { error: `Failed to get upload URL. ${errorMsg}` };
  }
  
  return await res.json();
}

export async function updateQuestionAction(id: string, formData: FormData) {
  const word = formData.get('word');
  const mnemonic = formData.get('mnemonic');
  const definition = formData.get('definition');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const res = await fetchWithAuth(`${apiUrl}/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, mnemonic, definition }),
  });

  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
    }
    return { error: `Failed to update question. ${errorMsg}` };
  }
}

export async function deleteQuestionAction(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const res = await fetchWithAuth(`${apiUrl}/questions/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
    }
    return { error: `Failed to delete question. ${errorMsg}` };
  }
}
