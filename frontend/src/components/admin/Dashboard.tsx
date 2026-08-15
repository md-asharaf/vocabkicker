'use client';

import Link from 'next/link';
import { useQuestions } from '@/hooks/useQuestions';
import QuestionsTable from './questions/QuestionsTable';
import Pagination from './questions/Pagination';
import EditQuestionModal from './questions/EditQuestionModal';
import BatchImportModal from './questions/BatchImportModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import RefreshButton from '../common/RefreshButton';

export default function Dashboard() {
  const {
    questions, isLoading, nextKey,
    searchQuery, setSearchQuery, handleSearchSubmit,
    currentIndex, handleNext, handlePrev,
    refresh,
    editQuestion, openEdit, closeEdit, handleUpdate,
    deleteId, setDeleteId, handleDelete,
    isImportOpen, setIsImportOpen, uploadingStatus, handleImportSubmit,
    isPending,
  } = useQuestions();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-lg flex flex-col relative min-h-[400px]">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Questions Bank</h2>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 md:w-64 flex relative">
              <input
                type="text"
                placeholder="Search words..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-l-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-r-md transition-colors border border-l-0 border-slate-700 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            <RefreshButton isLoading={isLoading} onClick={refresh} />
            <Link href="/admin/manage" className="text-sm bg-slate-700/50 text-slate-300 border border-slate-700 px-4 py-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admins
            </Link>
            <button onClick={() => setIsImportOpen(true)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors shadow-md shadow-blue-900/20 font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Batch Import
            </button>
          </div>
        </div>

        <QuestionsTable
          questions={questions}
          isLoading={isLoading}
          activeSearch={searchQuery}
          onEdit={openEdit}
          onDelete={id => setDeleteId(id)}
        />

        <Pagination
          currentIndex={currentIndex}
          hasNext={!!nextKey}
          isLoading={isLoading}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>

      {editQuestion && (
        <EditQuestionModal
          question={editQuestion}
          isPending={isPending}
          onSubmit={handleUpdate}
          onCancel={closeEdit}
        />
      )}

      {isImportOpen && (
        <BatchImportModal
          isPending={isPending}
          uploadingStatus={uploadingStatus}
          onSubmit={handleImportSubmit}
          onClose={() => setIsImportOpen(false)}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Confirm Deletion"
          description="Are you sure you want to delete this question? This action cannot be undone."
          confirmLabel="Delete"
          isPending={isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
