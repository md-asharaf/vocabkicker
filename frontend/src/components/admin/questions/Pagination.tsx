'use client';

import { Spinner } from '@/components/common/Spinner';

type Props = {
  currentIndex: number;
  hasNext: boolean;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export default function Pagination({ currentIndex, hasNext, isLoading, onPrev, onNext }: Props) {
  return (
    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
      <button
        onClick={onPrev}
        disabled={currentIndex === 0 || isLoading}
        className="px-4 py-2 text-sm bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors font-medium border border-slate-600/50 flex items-center gap-2"
      >
        {isLoading && <Spinner className="h-4 w-4" />}
        Previous
      </button>
      <span className="text-sm font-medium text-slate-400 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700/50">
        Page {currentIndex + 1}
      </span>
      <button
        onClick={onNext}
        disabled={!hasNext || isLoading}
        className="px-4 py-2 text-sm bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors flex items-center gap-2 font-medium border border-slate-600/50"
      >
        Next
        {isLoading && <Spinner className="h-4 w-4" />}
      </button>
    </div>
  );
}
