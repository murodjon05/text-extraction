import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ExtractionResult } from '@/types';
import { cn } from '@/utils/cn';
import { formatFileSize } from '@/utils/fileUtils';

interface ExtractionCardProps {
  result: ExtractionResult;
  onRemove: (id: string) => void;
  searchQuery?: string;
  activeMatchIndex?: number;
  matchStartIndex?: number;
  onManualCollapse?: (id: string, collapsed: boolean) => void;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function ExtractionCard({ 
  result, 
  onRemove, 
  searchQuery = '', 
  activeMatchIndex = 0,
  matchStartIndex = 0,
  onManualCollapse,
}: ExtractionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const highlightRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prevSearchQueryRef = useRef(searchQuery);

  // Calculate matches in this card
  const matches = useMemo(() => {
    if (!searchQuery || !result.text) return [];
    
    const regex = new RegExp(escapeRegExp(searchQuery), 'gi');
    const matchList: { index: number; length: number }[] = [];
    let match;
    
    while ((match = regex.exec(result.text)) !== null) {
      matchList.push({ index: match.index, length: match[0].length });
    }
    
    return matchList;
  }, [searchQuery, result.text]);

  // Check if active match is in this card
  const localMatchIndex = activeMatchIndex - matchStartIndex;
  const hasActiveMatch = localMatchIndex >= 0 && localMatchIndex < matches.length;

  // Auto-expand when search query changes and there are matches
  useEffect(() => {
    // Only auto-expand if search query changed (not on initial mount)
    if (prevSearchQueryRef.current !== searchQuery) {
      prevSearchQueryRef.current = searchQuery;
      
      // If search query changed and has matches, expand
      if (searchQuery && matches.length > 0) {
        setIsExpanded(true);
      }
    }
  }, [searchQuery, matches.length]);

  // Scroll to active match
  useEffect(() => {
    if (!searchQuery || matches.length === 0 || !hasActiveMatch || !isExpanded) return;
    
    // Wait for render then scroll
    setTimeout(() => {
      const activeHighlight = highlightRefs.current[localMatchIndex];
      if (activeHighlight) {
        activeHighlight.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
  }, [activeMatchIndex, matchStartIndex, matches.length, searchQuery, hasActiveMatch, localMatchIndex, isExpanded]);

  // Handle toggle expand/collapse - this is purely manual control
  const handleToggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    // Notify parent about manual collapse/expand
    onManualCollapse?.(result.id, !newExpanded);
  }, [isExpanded, onManualCollapse, result.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName.replace(/\.[^/.]+$/, '')}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'partial': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getCategoryIcon = () => {
    switch (result.category) {
      case 'document':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'code':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'data':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        );
      case 'notebook':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  // Render highlighted text
  const renderHighlightedText = useCallback(() => {
    if (!searchQuery || !result.text || matches.length === 0) {
      return result.text || '[No text extracted]';
    }

    highlightRefs.current = [];
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, idx) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {result.text.slice(lastIndex, match.index)}
          </span>
        );
      }

      // Calculate if this match is the active one
      const globalMatchIndex = matchStartIndex + idx;
      const isActive = globalMatchIndex === activeMatchIndex;

      // Add highlighted match
      parts.push(
        <span
          key={`match-${idx}`}
          ref={(el) => { highlightRefs.current[idx] = el; }}
          className={cn(
            "rounded px-0.5 transition-all duration-200",
            isActive
              ? "bg-orange-400 dark:bg-orange-500 text-white ring-2 ring-orange-500 dark:ring-orange-400"
              : "bg-yellow-200 dark:bg-yellow-600/70 text-slate-900 dark:text-white"
          )}
        >
          {result.text.slice(match.index, match.index + match.length)}
        </span>
      );

      lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < result.text.length) {
      parts.push(
        <span key="text-end">
          {result.text.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  }, [searchQuery, result.text, matches, activeMatchIndex, matchStartIndex]);

  return (
    <div className={cn(
      "w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border transition-all duration-300",
      "border-slate-200 dark:border-slate-700",
      result.status === 'processing' && "animate-pulse"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {getCategoryIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-white truncate">{result.fileName}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium">
                {result.fileType}
              </span>
              <span>{formatFileSize(result.metadata.size as number)}</span>
              <span>•</span>
              <span>{result.processingTime}ms</span>
              {matches.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    {matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", getStatusColor())}>
            {result.status}
          </span>
          {result.confidence !== undefined && (
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              result.confidence >= 75 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              result.confidence >= 50 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              OCR: {result.confidence}%
            </span>
          )}
          <button
            onClick={handleToggleExpand}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg 
              className={cn("w-5 h-5 text-slate-500 transition-transform", isExpanded && "rotate-180")} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => onRemove(result.id)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-slate-500 hover:text-red-600"
            title="Remove"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Warnings/Errors */}
      {(result.warnings.length > 0 || result.errors.length > 0) && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
          {result.errors.map((error, i) => (
            <div key={`error-${i}`} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          ))}
          {result.warnings.map((warning, i) => (
            <div key={`warning-${i}`} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {result.text.length.toLocaleString()} characters
              {result.metadata.lineCount && ` • ${result.metadata.lineCount} lines`}
              {result.metadata.pageCount && ` • ${result.metadata.pageCount} pages`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  copied 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                )}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
          
          <div className="relative">
            <pre 
              className={cn(
                "w-full p-4 rounded-lg text-sm overflow-auto max-h-[500px]",
                "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200",
                "border border-slate-200 dark:border-slate-700",
                "font-mono whitespace-pre-wrap break-words"
              )}
            >
              {renderHighlightedText()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
