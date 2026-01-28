import { ExtractionResult } from '@/types';

interface StatsBarProps {
  results: ExtractionResult[];
}

export function StatsBar({ results }: StatsBarProps) {
  if (results.length === 0) return null;

  const successCount = results.filter(r => r.status === 'success').length;
  const partialCount = results.filter(r => r.status === 'partial').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalChars = results.reduce((sum, r) => sum + r.text.length, 0);
  const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">Files:</span>
        <span className="font-semibold text-slate-800 dark:text-white">{results.length}</span>
      </div>
      
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
      
      <div className="flex items-center gap-3">
        {successCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-green-600 dark:text-green-400">{successCount} success</span>
          </div>
        )}
        {partialCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-yellow-600 dark:text-yellow-400">{partialCount} partial</span>
          </div>
        )}
        {errorCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-sm text-red-600 dark:text-red-400">{errorCount} error</span>
          </div>
        )}
      </div>
      
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">Characters:</span>
        <span className="font-semibold text-slate-800 dark:text-white">{totalChars.toLocaleString()}</span>
      </div>
      
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">Total time:</span>
        <span className="font-semibold text-slate-800 dark:text-white">{(totalTime / 1000).toFixed(2)}s</span>
      </div>
    </div>
  );
}
