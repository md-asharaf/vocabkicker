'use client';

import { useState } from 'react';
import { createQuestionAction, deleteQuestionAction, updateQuestionAction } from '../actions/questions';
import { useRouter } from 'next/navigation';

type Question = {
  id: string;
  word: string;
  mnemonic: string;
  definition: string;
};

export default function AdminClient({ initialQuestions }: { initialQuestions: Question[] }) {
  const router = useRouter();
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [word, setWord] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [definition, setDefinition] = useState('');
  
  // UI State
  const [isPending, setIsPending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Compute Pagination
  const totalPages = Math.ceil(initialQuestions.length / itemsPerPage);
  const paginatedQuestions = initialQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData();
    formData.append('word', word);
    formData.append('mnemonic', mnemonic);
    formData.append('definition', definition);
    
    if (editId) {
      await updateQuestionAction(editId, formData);
    } else {
      await createQuestionAction(formData);
    }
    
    setEditId(null);
    setWord('');
    setMnemonic('');
    setDefinition('');
    setIsPending(false);
    router.refresh();
  };

  const handleEdit = (q: Question) => {
    setEditId(q.id);
    setWord(q.word);
    setMnemonic(q.mnemonic);
    setDefinition(q.definition);
  };

  const cancelEdit = () => {
    setEditId(null);
    setWord('');
    setMnemonic('');
    setDefinition('');
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
      {/* Form Section */}
      <div className="md:col-span-1 bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-lg h-fit text-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {editId ? 'Edit Question' : 'Add Question'}
          </h2>
          <a href="/admin/register" className="text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 px-3 py-1.5 rounded-full hover:bg-emerald-600 hover:text-white transition-colors">
            + New Admin
          </a>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Word</label>
            <input
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={word} onChange={e => setWord(e.target.value)} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Mnemonic</label>
            <input
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={mnemonic} onChange={e => setMnemonic(e.target.value)} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Definition</label>
            <textarea
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[100px]"
              value={definition} onChange={e => setDefinition(e.target.value)} required
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 font-medium">
              {isPending ? 'Saving...' : (editId ? 'Update' : 'Save')}
            </button>
            {editId && (
              <button type="button" onClick={cancelEdit} disabled={isPending} className="flex-1 bg-slate-700 text-white py-2.5 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 font-medium">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="md:col-span-2 bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Questions Bank</h2>
          <div className="text-sm text-slate-400">Total: {initialQuestions.length}</div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-slate-300">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-3 px-2 font-medium text-slate-400">Word</th>
                <th className="py-3 px-2 font-medium text-slate-400">Mnemonic</th>
                <th className="py-3 px-2 font-medium text-slate-400 min-w-[200px]">Definition</th>
                <th className="py-3 px-2 font-medium text-slate-400 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQuestions.map(q => (
                <tr key={q.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 px-2 font-medium text-white">{q.word}</td>
                  <td className="py-3 px-2">{q.mnemonic}</td>
                  <td className="py-3 px-2 text-sm text-slate-400">{q.definition}</td>
                  <td className="py-3 px-2 text-right">
                    <button onClick={() => handleEdit(q)} className="text-blue-400 hover:text-blue-300 transition-colors text-sm mr-3">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {initialQuestions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-500">No questions found. Add one!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Confirm Deletion</h3>
            <p className="text-slate-400 mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                disabled={isPending}
                className="px-4 py-2 rounded text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 font-medium shadow-lg shadow-red-900/20"
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
