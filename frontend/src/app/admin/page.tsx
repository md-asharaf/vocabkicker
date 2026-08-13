import AdminClient from './AdminClient';
import { logoutAction } from '../actions/auth';

export default async function AdminDashboard() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  let fetchedQuestions = [];
  try {
    const res = await fetch(`${apiUrl}/questions`, { cache: 'no-store' });
    if (res.ok) {
      fetchedQuestions = await res.json();
    } else {
      console.error('Failed to fetch questions:', await res.text());
    }
  } catch (err) {
    console.error('Error fetching questions:', err);
  }

  return (
    <div className="min-h-[100dvh] bg-slate-900 p-4 md:p-8 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
        <form action={logoutAction}>
          <button type="submit" className="bg-red-600/90 border border-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors shadow-lg">
            Logout
          </button>
        </form>
      </div>
      <AdminClient initialQuestions={fetchedQuestions} />
    </div>
  );
}
