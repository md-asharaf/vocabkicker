'use client';

import { useAdmins } from '@/hooks/useAdmins';
import AdminsTable from './AdminsTable';
import EditAdminModal from './EditAdminModal';
import CreateAdminModal from './CreateAdminModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import RefreshButton from '@/components/common/RefreshButton';

export default function ManageAdmins() {
  const {
    admins, isLoading, isPending,
    search, setSearch,
    isCreating, openCreate, closeCreate, handleCreate,
    editAdmin, openEdit, closeEdit, handleUpdate,
    deleteId, setDeleteId, handleDelete,
    fetchAdmins,
  } = useAdmins();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg shadow-lg flex flex-col relative min-h-[400px]">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Admins
          </h2>
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search admins..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            />
          </div>
          <RefreshButton isLoading={isLoading} onClick={fetchAdmins} />
          <button onClick={openCreate} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors shadow-md shadow-blue-900/20 font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Admin
          </button>
        </div>

        <AdminsTable
          admins={admins}
          isLoading={isLoading}
          activeSearch={search}
          onEdit={openEdit}
          onDelete={id => setDeleteId(id)}
        />
      </div>

      {
        isCreating && (
          <CreateAdminModal
            isPending={isPending}
            onSubmit={handleCreate}
            onCancel={closeCreate}
          />
        )
      }

      {
        editAdmin && (
          <EditAdminModal
            admin={editAdmin}
            isPending={isPending}
            onSubmit={handleUpdate}
            onCancel={closeEdit}
          />
        )
      }

      {
        deleteId && (
          <ConfirmModal
            title="Confirm Deletion"
            description="Are you sure you want to delete this admin? This action cannot be undone."
            confirmLabel="Delete"
            isPending={isPending}
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        )
      }
    </div>
  );
}
