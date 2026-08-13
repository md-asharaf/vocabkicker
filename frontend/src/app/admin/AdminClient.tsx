'use client';

import { useState, useEffect } from 'react';
import { createQuestionAction, deleteQuestionAction, updateQuestionAction } from '../actions/questions';
import toast from 'react-hot-toast';

type Question = {
  id: string;
  word: string;
  mnemonic: string;
  definition: string;
};

const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function AdminClient() {
  // Data State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [word, setWord] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [definition, setDefinition] = useState('');

  // UI State
  const [isPending, setIsPending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Server-Side Pagination State
  const [pageHistory, setPageHistory] = useState<(string | null)[]>([null]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextKey, setNextKey] = useState<string | null>(null);

  const fetchQuestions = async (key: string | null, search: string) => {
    setIsLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
      const url = new URL(`${baseUrl}/questions`);
      url.searchParams.set('limit', '10');
      if (key) url.searchParams.set('lastEvaluatedKey', key);
      if (search.trim()) url.searchParams.set('search', search.trim());

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.items || []);
        setNextKey(data.lastEvaluatedKey || null);
      } else {
        toast.error('Failed to fetch questions');
        console.error('Failed to fetch questions');
      }
    } catch (err) {
      toast.error('Network error fetching questions');
      console.error('Error fetching questions', err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuestions(pageHistory[currentIndex], activeSearch);
  }, [currentIndex, activeSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== activeSearch) {
        setPageHistory([null]);
        setCurrentIndex(0);
        setActiveSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageHistory([null]);
    setCurrentIndex(0);
    setActiveSearch(searchQuery);
  };

  const handleNext = () => {
    if (nextKey) {
      if (currentIndex === pageHistory.length - 1) {
        setPageHistory([...pageHistory, nextKey]);
      }
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setWord('');
    setMnemonic('');
    setDefinition('');
    setIsFormModalOpen(true);
  };

  const handleEdit = (q: Question) => {
    setEditId(q.id);
    setWord(q.word);
    setMnemonic(q.mnemonic);
    setDefinition(q.definition);
    setIsFormModalOpen(true);
  };

  const cancelEdit = () => {
    setIsFormModalOpen(false);
    setEditId(null);
    setWord('');
    setMnemonic('');
    setDefinition('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData();
    formData.append('word', word);
    formData.append('mnemonic', mnemonic);
    formData.append('definition', definition);

    try {
      if (editId) {
        const res = await updateQuestionAction(editId, formData);
        if (res?.error) throw new Error(res.error);
        toast.success('Question updated successfully!');
      } else {
        const res = await createQuestionAction(formData);
        if (res?.error) throw new Error(res.error);
        toast.success('Question created successfully!');
      }

      setIsFormModalOpen(false);
      setEditId(null);
      setWord('');
      setMnemonic('');
      setDefinition('');

      // Refresh the current page
      fetchQuestions(pageHistory[currentIndex], activeSearch);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsPending(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      setIsPending(true);
      try {
        const res = await deleteQuestionAction(deleteId);
        if (res?.error) throw new Error(res.error);
        toast.success('Question deleted successfully!');
        setDeleteId(null);
        fetchQuestions(pageHistory[currentIndex], activeSearch);
      } catch (error: any) {
        toast.error(error.message || 'An error occurred deleting the question');
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Table Section */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-lg flex flex-col relative min-h-[400px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            Questions Bank
            {isLoading && <Spinner className="h-5 w-5 text-blue-400" />}
          </h2>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="flex-1 md:w-64 flex relative">
              <input
                type="text"
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-l-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-r-md transition-colors border border-l-0 border-slate-700 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
            </form>
            <a href="/admin/register" className="text-sm bg-slate-700/50 text-slate-300 border border-slate-700 px-4 py-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors font-medium">
              New Admin
            </a>
            <button onClick={openCreate} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors shadow-md shadow-blue-900/20 font-medium">
              + Add Question
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-slate-300">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-3 px-2 font-semibold text-slate-400">Word</th>
                <th className="py-3 px-2 font-semibold text-slate-400">Mnemonic</th>
                <th className="py-3 px-2 font-semibold text-slate-400 min-w-[200px]">Definition</th>
                <th className="py-3 px-2 font-semibold text-slate-400 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={isLoading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
              {questions.map(q => (
                <tr key={q.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-2 font-medium text-white">{q.word}</td>
                  <td className="py-3 px-2 text-slate-300">{q.mnemonic}</td>
                  <td className="py-3 px-2 text-sm text-slate-400">{q.definition}</td>
                  <td className="py-3 px-2 text-right whitespace-nowrap">
                    <button onClick={() => handleEdit(q)} className="text-blue-400 hover:text-blue-300 transition-colors text-sm mr-4 font-medium">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(q.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {/* Skeleton Loaders for empty state during loading */}
              {isLoading && questions.length === 0 && (
                [...Array(5)].map((_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-slate-700/50">
                    <td className="py-4 px-2"><div className="h-4 bg-slate-700/50 rounded w-24 animate-pulse"></div></td>
                    <td className="py-4 px-2"><div className="h-4 bg-slate-700/50 rounded w-32 animate-pulse"></div></td>
                    <td className="py-4 px-2"><div className="h-4 bg-slate-700/50 rounded w-full max-w-md animate-pulse"></div></td>
                    <td className="py-4 px-2"><div className="h-4 bg-slate-700/50 rounded w-16 ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              )}

              {/* Empty State */}
              {!isLoading && questions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      <p className="font-medium">
                        {activeSearch ? 'No questions match your search.' : 'No questions found. Add one!'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Controls */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || isLoading}
            className="px-4 py-2 text-sm bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors font-medium border border-slate-600/50 flex items-center gap-2"
          >
            {isLoading && <Spinner className="h-4 w-4" />}
            Previous
          </button>
          <span className="text-sm font-medium text-slate-400 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700/50">
            Page {currentIndex + 1}
          </span>
          <button
            onClick={handleNext}
            disabled={!nextKey || isLoading}
            className="px-4 py-2 text-sm bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors flex items-center gap-2 font-medium border border-slate-600/50"
          >
            Next
            {isLoading && <Spinner className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Form Modal (Shadcn/MUI Style) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white tracking-tight">
                {editId ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-300">Word</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="e.g. Abundant"
                  value={word} onChange={e => setWord(e.target.value)} required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-300">Mnemonic</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="e.g. A bun dance"
                  value={mnemonic} onChange={e => setMnemonic(e.target.value)} required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-300">Definition</label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[100px] placeholder:text-slate-600 resize-none"
                  placeholder="e.g. Existing or available in large quantities; plentiful."
                  value={definition} onChange={e => setDefinition(e.target.value)} required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-slate-800">
                <button type="button" onClick={cancelEdit} disabled={isPending} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50 border border-transparent hover:border-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                  {isPending && <Spinner className="h-4 w-4 text-white" />}
                  {isPending ? 'Saving...' : (editId ? 'Save Changes' : 'Create Question')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Confirm Deletion</h3>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isPending}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
              >
                {isPending && <Spinner className="h-4 w-4 text-white" />}
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
