'use client';

type RefreshButtonProps = {
  isLoading: boolean;
  onClick: () => void;
};

export default function RefreshButton({ isLoading, onClick }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="text-sm bg-slate-700/50 text-slate-300 border border-slate-700 px-4 py-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
    >
      <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  );
}
