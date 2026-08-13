'use client';

import { useState } from 'react';

type Question = {
  id: string;
  word: string;
  mnemonic: string;
  definition: string;
};

import { createQuestionAction, deleteQuestionAction } from '../actions/questions';
import { useRouter } from 'next/navigation';

export default function AdminClient({ initialQuestions }: { initialQuestions: Question[] }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [word, setWord] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [definition, setDefinition] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData();
    formData.append('word', word);
    formData.append('mnemonic', mnemonic);
    formData.append('definition', definition);
    
    await createQuestionAction(formData);
    
    setWord('');
    setMnemonic('');
    setDefinition('');
    setIsPending(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
        setIsPending(true);
        await deleteQuestionAction(deleteId);
        setDeleteId(null);
        setIsPending(false);
        router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Question</h2>
          <a href="/admin/register" className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
            + New Admin
          </a>
        </div>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Word</label>
            <input
              className="w-full border rounded p-2"
              value={word} onChange={e => setWord(e.target.value)} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mnemonic</label>
            <input
              className="w-full border rounded p-2"
              value={mnemonic} onChange={e => setMnemonic(e.target.value)} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Definition</label>
            <textarea
              className="w-full border rounded p-2"
              value={definition} onChange={e => setDefinition(e.target.value)} required
            />
          </div>
          <button type="submit" disabled={isPending} className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50">
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b py-2">Word</th>
              <th className="border-b py-2">Mnemonic</th>
              <th className="border-b py-2">Definition</th>
              <th className="border-b py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialQuestions.map(q => (
              <tr key={q.id}>
                <td className="border-b py-2">{q.word}</td>
                <td className="border-b py-2">{q.mnemonic}</td>
                <td className="border-b py-2">{q.definition}</td>
                <td className="border-b py-2">
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {initialQuestions.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">No questions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                disabled={isPending}
                className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
