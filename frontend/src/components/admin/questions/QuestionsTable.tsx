'use client';

import { Spinner } from '@/components/common/Spinner';
import { Question } from '@/hooks/useQuestions';

type Props = {
  questions: Question[];
  isLoading: boolean;
  activeSearch: string;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
};


export default function QuestionsTable({ questions, isLoading, activeSearch, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto flex-1 relative min-h-[200px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-800/50 rounded pointer-events-none">
          <Spinner className="h-8 w-8 text-blue-500" />
        </div>
      )}
      <table className="w-full text-left border-collapse text-slate-300">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="py-3 px-2 font-semibold text-slate-400">Word</th>
            <th className="py-3 px-2 font-semibold text-slate-400">Mnemonic</th>
            <th className="py-3 px-2 font-semibold text-slate-400 min-w-[200px]">Definition</th>
            <th className="py-3 px-2 font-semibold text-slate-400 w-32 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className={isLoading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
          {questions.map(q => (
            <tr key={q.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <td className="py-3 px-2 font-medium text-white">{q.word}</td>
              <td className="py-3 px-2 text-slate-300">{q.mnemonic}</td>
              <td className="py-3 px-2 text-sm text-slate-400">{q.definition}</td>
              <td className="py-3 px-2 text-right whitespace-nowrap">
                <button onClick={() => onEdit(q)} className="text-blue-400 hover:text-blue-300 transition-colors text-sm mr-4 font-medium">Edit</button>
                <button onClick={() => onDelete(q.id)} className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium">Delete</button>
              </td>
            </tr>
          ))}

          {!isLoading && questions.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-16 text-slate-500">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="font-medium">
                    {activeSearch ? 'No questions match your search.' : 'No questions found. Add one via Batch Import!'}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
