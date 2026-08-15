'use client';

import { Spinner } from '@/components/common/Spinner';
import { AdminUser } from '@/app/actions/admins';

type Props = {
  admins: AdminUser[];
  isLoading: boolean;
  activeSearch: string;
  onEdit: (admin: AdminUser) => void;
  onDelete: (id: string) => void;
};

const formatDate = (ts: number) =>
  ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminsTable({ admins, isLoading, activeSearch, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto flex-1 relative min-h-[200px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-800/50 rounded pointer-events-none">
          <Spinner className="h-8 w-8 text-blue-500" />
        </div>
      )}
      <table className="w-full text-left border-collapse text-slate-300">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="py-3 px-2 font-semibold text-slate-400">Email</th>
            <th className="py-3 px-2 font-semibold text-slate-400">Created</th>
            <th className="py-3 px-2 font-semibold text-slate-400">Updated</th>
            <th className="py-3 px-2 font-semibold text-slate-400 w-32 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className={isLoading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
          {admins.map(admin => (
            <tr key={admin.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <td className="py-3 px-2 font-medium text-white">{admin.email}</td>
              <td className="py-3 px-2 text-sm text-slate-400">{formatDate(admin.createdAt)}</td>
              <td className="py-3 px-2 text-sm text-slate-400">{formatDate(admin.updatedAt)}</td>
              <td className="py-3 px-2 text-right whitespace-nowrap">
                <button onClick={() => onEdit(admin)} className="text-blue-400 hover:text-blue-300 transition-colors text-sm mr-4 font-medium">Edit</button>
                <button onClick={() => onDelete(admin.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium">Delete</button>
              </td>
            </tr>
          ))}

          {!isLoading && admins.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-16 text-slate-500">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="font-medium">
                    {activeSearch ? 'No admins match your search.' : 'No admins found.'}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
