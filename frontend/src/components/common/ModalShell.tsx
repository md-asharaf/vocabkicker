'use client';

import { ReactNode } from 'react';

type ModalShellProps = {
  children: ReactNode;
  maxWidth?: string;
};

export default function ModalShell({ children, maxWidth = 'max-w-md' }: ModalShellProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 w-full ${maxWidth} shadow-2xl animate-in zoom-in-95 duration-200`}>
        {children}
      </div>
    </div>
  );
}
