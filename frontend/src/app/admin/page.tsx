import type { Metadata } from 'next';
import Dashboard from '@/components/admin/Dashboard';
import { logoutAction } from '@/app/actions/auth';
import LogoutButton from '@/components/admin/LogoutButton';

export const metadata: Metadata = {
  title: 'VocabKicker — Admin Dashboard',
  description: 'Manage vocabulary questions for the VocabKicker quiz game.',
};

export default async function AdminDashboard() {
  return (
    <div className="min-h-[100dvh] bg-slate-900 p-4 md:p-8 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Vocab Kicker</h1>
        <form action={logoutAction}>
          <LogoutButton />
        </form>
      </div>
      <Dashboard />
    </div>
  );
}
