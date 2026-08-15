'use client';

import ModalShell from './ModalShell';
import { Spinner } from './Spinner';

type ConfirmModalProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  confirmClassName?: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  title,
  description,
  confirmLabel = 'Delete',
  confirmClassName = 'bg-red-600 hover:bg-red-500 shadow-red-900/20',
  isPending,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <ModalShell maxWidth="max-w-sm">
      <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-400 mb-6 text-sm leading-relaxed">{description}</p>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 ${confirmClassName}`}
        >
          {isPending && <Spinner className="h-4 w-4 text-white" />}
          {isPending ? `${confirmLabel}ing...` : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
