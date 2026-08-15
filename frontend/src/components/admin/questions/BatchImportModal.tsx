'use client';

import { useState } from 'react';
import ModalShell from '@/components/common/ModalShell';
import { Spinner } from '@/components/common/Spinner';

type Props = {
  isPending: boolean;
  uploadingStatus: string;
  onSubmit: (file: File) => void;
  onClose: () => void;
};

export default function BatchImportModal({ isPending, uploadingStatus, onSubmit, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) onSubmit(file);
  };

  return (
    <ModalShell>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white tracking-tight">Batch Import Questions</h3>
        <button onClick={onClose} disabled={isPending} className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-800 disabled:opacity-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-300">Select File (.csv, .docx)</label>
          <input
            type="file"
            accept=".csv, .docx, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
          />
        </div>

        {uploadingStatus && (
          <div className="text-sm font-medium text-blue-400 bg-blue-400/10 p-3 rounded-lg flex items-center gap-3">
            <Spinner className="h-4 w-4" />
            {uploadingStatus}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-slate-800">
          <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50 border border-transparent hover:border-slate-700">Cancel</button>
          <button type="submit" disabled={isPending || !file} className="px-5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
            {isPending && <Spinner className="h-4 w-4 text-white" />}
            {isPending ? 'Uploading...' : 'Upload & Import'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
