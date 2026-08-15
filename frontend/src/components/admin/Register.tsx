'use client';

import { registerAction } from '@/app/actions/auth';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useFormStatus } from 'react-dom';
import { Spinner } from '@/components/common/Spinner';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {pending && <Spinner className="h-4 w-4 text-white" />}
      {pending ? 'Creating...' : 'Register'}
    </button>
  );
}

export default function RegisterClient() {
  async function handleSubmit(formData: FormData) {
    const res = await registerAction(formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Admin created successfully! Redirecting...');
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-900 text-slate-200">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">Create Admin</h1>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400" htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email" required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" required minLength={8}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <SubmitButton />
        </form>
        <div className="mt-6 text-center">
          <Link href="/admin" className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
