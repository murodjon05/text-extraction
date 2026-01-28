import { useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { ExtractionStatus, FileCategory } from '@/types';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ExtractionStatus | 'all';
  onStatusFilterChange: (status: ExtractionStatus | 'all') => void;
  categoryFilter: FileCategory | 'all';
  onCategoryFilterChange: (category: FileCategory | 'all') => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNavigateMatch: (direction: 'prev' | 'next') => void;
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  totalMatches,
  currentMatchIndex,
  onNavigateMatch,
}: SearchFilterProps) {
  const statuses: (ExtractionStatus | 'all')[] = ['all', 'success', 'partial', 'error'];
  const categories: (FileCategory | 'all')[] = ['all', 'document', 'data', 'image', 'code', 'notebook', 'unknown'];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!searchQuery) return;
    
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onNavigateMatch('prev');
      } else {
        onNavigateMatch('next');
      }
    }
  }, [searchQuery, onNavigateMatch]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search in extracted text..."
          className={cn(
            "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
            "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
            "text-slate-800 dark:text-white placeholder-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Match Count and Navigation */}
      {searchQuery && (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1">
          <span className={cn(
            "text-sm font-medium min-w-[60px] text-center",
            totalMatches > 0 ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"
          )}>
            {totalMatches > 0 
              ? `${currentMatchIndex + 1} / ${totalMatches}` 
              : "0 found"}
          </span>
          <div className="flex gap-0.5 ml-1">
            <button
              onClick={() => onNavigateMatch('prev')}
              disabled={totalMatches === 0}
              className={cn(
                "p-1.5 rounded transition-colors",
                totalMatches > 0
                  ? "hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
                  : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              )}
              title="Previous match (Shift+Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onNavigateMatch('next')}
              disabled={totalMatches === 0}
              className={cn(
                "p-1.5 rounded transition-colors",
                totalMatches > 0
                  ? "hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
                  : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              )}
              title="Next match (Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">Status:</span>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => onStatusFilterChange(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
              statusFilter === status
                ? status === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" :
                  status === 'partial' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" :
                  status === 'error' ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">Type:</span>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value as FileCategory | 'all')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium capitalize",
            "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
            "border-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Keyboard hint */}
      {searchQuery && totalMatches > 0 && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">Enter</kbd>
          <span>next</span>
          <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300 ml-1">Shift+Enter</kbd>
          <span>prev</span>
        </div>
      )}
    </div>
  );
}
