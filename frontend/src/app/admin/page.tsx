import AdminClient from './AdminClient';
import { logoutAction } from '../actions/auth';
import LogoutButton from './LogoutButton';

export default async function AdminDashboard() {
  return (
    <div className="min-h-[100dvh] bg-slate-900 p-4 md:p-8 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
        <form action={logoutAction}>
          <LogoutButton />
        </form>
      </div>
      <AdminClient />
    </div>
  );
}
