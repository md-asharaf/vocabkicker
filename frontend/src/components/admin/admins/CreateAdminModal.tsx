'use client';

import { useState } from 'react';
import ModalShell from '@/components/common/ModalShell';
import { Spinner } from '@/components/common/Spinner';

type Props = {
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
};

export default function CreateAdminModal({ isPending, onSubmit, onCancel }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    onSubmit(formData);
  };

  const inputCls = 'w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600';
  const labelCls = 'block text-sm font-medium mb-1.5 text-slate-300';

  return (
    <ModalShell>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white tracking-tight">Create Admin</h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className={labelCls}>Email</label>
          <input className={inputCls} type="email" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input className={inputCls} type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
        </div>

        <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-slate-800">
          <button type="button" onClick={onCancel} disabled={isPending} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50 border border-transparent hover:border-slate-700">Cancel</button>
          <button type="submit" disabled={isPending} className="px-5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
            {isPending && <Spinner className="h-4 w-4 text-white" />}
            {isPending ? 'Creating...' : 'Create Admin'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
