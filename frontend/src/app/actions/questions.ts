'use server';

import { apiUrl, fetchWithAuth } from '../../lib/api';

export type QuestionsPage = {
  items: { id: string; word: string; mnemonic: string; definition: string }[];
  lastEvaluatedKey: string | null;
};

export async function getQuestionsAction(
  key: string | null,
  search: string
): Promise<{ data?: QuestionsPage; error?: string }> {
  const url = new URL(`${apiUrl}/questions`);
  url.searchParams.set('limit', '10');
  if (key) url.searchParams.set('lastEvaluatedKey', key);
  if (search.trim()) url.searchParams.set('search', search.trim());

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch { /* ignore */ }
    return { error: `Failed to fetch questions. ${errorMsg}` };
  }
  const data = await res.json();
  return { data };
}

export async function getUploadUrlAction(ext: string) {
  const res = await fetchWithAuth(`${apiUrl}/questions/upload-url?ext=${ext}`, {
    method: 'GET',
  });

  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch { /* ignore */ }
    return { error: `Failed to get upload URL. ${errorMsg}` };
  }

  return await res.json();
}

export async function updateQuestionAction(id: string, formData: FormData) {
  const word = formData.get('word');
  const mnemonic = formData.get('mnemonic');
  const definition = formData.get('definition');

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
    } catch { /* ignore */ }
    return { error: `Failed to update question. ${errorMsg}` };
  }
}

export async function deleteQuestionAction(id: string) {
  const res = await fetchWithAuth(`${apiUrl}/questions/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    let errorMsg = 'Please try again later.';
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch { /* ignore */ }
    return { error: `Failed to delete question. ${errorMsg}` };
  }
}
