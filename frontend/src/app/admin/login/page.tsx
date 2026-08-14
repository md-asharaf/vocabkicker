'use client';

import { useState } from 'react';
import { loginAction } from '../../actions/auth';
import toast from 'react-hot-toast';

const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function LoginPage() {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const res = await loginAction(formData);
        if (res?.error) {
            toast.error(res.error);
            setLoading(false);
        } else {
            toast.success('Logged in successfully!');
            // setLoading(false) isn't called because it redirects, keeping the spinner active
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
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="mt-2 bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                    >
                        {loading && <Spinner className="h-4 w-4 text-white" />}
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
