'use client';

import { loginAction } from '@/app/actions/auth';
import toast from 'react-hot-toast';
import { useFormStatus } from 'react-dom';
import { Spinner } from '@/components/common/Spinner';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
    >
      {pending && <Spinner className="h-4 w-4 text-white" />}
      {pending ? 'Logging in...' : 'Login'}
    </button>
  );
}

export default function LoginClient() {
  async function handleSubmit(formData: FormData) {
    const res = await loginAction(formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Logged in successfully!');
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-900 text-slate-200">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">Admin Login</h1>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Email</label>
            <input
              name="email"
              type="email"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Password</label>
            <input
              name="password"
              type="password"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
