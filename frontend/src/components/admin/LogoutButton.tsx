'use client';

import { Spinner } from '@/components/common/Spinner';
import { useFormStatus } from 'react-dom';

export default function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-red-600/90 border border-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
    >
      {pending && <Spinner />}
      {pending ? 'Logging out...' : 'Logout'}
    </button>
  );
}
