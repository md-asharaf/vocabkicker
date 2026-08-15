import type { Metadata } from 'next';
import ManageAdmins from '@/components/admin/admins/ManageAdmins';
import { logoutAction } from '@/app/actions/auth';
import LogoutButton from '@/components/admin/LogoutButton';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VocabKicker — Manage Admins',
  description: 'View, create, update and delete admin accounts for VocabKicker.',
};

export default async function ManageAdminsPage() {
  return (
    <div className="min-h-[100dvh] bg-slate-900 p-4 md:p-8 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-slate-400 hover:text-white transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-800"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Manage Admins</h1>
        </div>
        <form action={logoutAction}>
          <LogoutButton />
        </form>
      </div>
      <ManageAdmins />
    </div>
  );
}
