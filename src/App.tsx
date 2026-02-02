import { useState, useCallback, useMemo, useRef } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { FileDropZone } from '@/components/FileDropZone';
import { ExtractionCard } from '@/components/ExtractionCard';
import { ProcessingQueue } from '@/components/ProcessingQueue';
import { FormatGuide } from '@/components/FormatGuide';
import { StatsBar } from '@/components/StatsBar';
import { SearchFilter } from '@/components/SearchFilter';
import { OfflineModeToggle } from '@/components/OfflineModeToggle';
import { ExtractionResult, ExtractionStatus, FileCategory } from '@/types';
import { extractText } from '@/services/extractors';
import { generateId } from '@/utils/fileUtils';
import { cn } from '@/utils/cn';

interface ProcessingFile {
  id: string;
  name: string;
  progress: number;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function AppContent() {
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExtractionStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'all'>('all');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  
  // Track matches per result for navigation
  const matchCountsRef = useRef<Map<string, number>>(new Map());

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = searchQuery === '' || 
        r.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [results, searchQuery, statusFilter, categoryFilter]);

  // Calculate total matches across all filtered results
  const totalMatches = useMemo(() => {
    if (!searchQuery) return 0;
    
    let total = 0;
    const regex = new RegExp(escapeRegExp(searchQuery), 'gi');
    
    filteredResults.forEach(r => {
      const matches = r.text.match(regex);
      const count = matches ? matches.length : 0;
      matchCountsRef.current.set(r.id, count);
      total += count;
    });
    
    return total;
  }, [searchQuery, filteredResults]);

  // Calculate match start indices for each result
  const matchStartIndices = useMemo(() => {
    const indices: Map<string, number> = new Map();
    let runningTotal = 0;
    
    filteredResults.forEach(r => {
      indices.set(r.id, runningTotal);
      runningTotal += matchCountsRef.current.get(r.id) || 0;
    });
    
    return indices;
  }, [filteredResults, totalMatches]);

  // Reset match index when search changes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentMatchIndex(0);
  }, []);

  // Handle manual collapse/expand of a card
  const handleManualCollapse = useCallback((id: string, collapsed: boolean) => {
    // This is just for tracking, the card handles its own state now
    console.log(`Card ${id} manually ${collapsed ? 'collapsed' : 'expanded'}`);
  }, []);

  // Navigate between matches
  const handleNavigateMatch = useCallback((direction: 'prev' | 'next') => {
    if (totalMatches === 0) return;
    
    setCurrentMatchIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % totalMatches;
      } else {
        return prev === 0 ? totalMatches - 1 : prev - 1;
      }
    });
  }, [totalMatches]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    // Add files to processing queue
    const newProcessingFiles = files.map(file => ({
      id: generateId(),
      name: file.name,
      progress: 0,
    }));
    
    setProcessingFiles(prev => [...prev, ...newProcessingFiles]);

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const processingId = newProcessingFiles[i].id;
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingFiles(prev => 
          prev.map(pf => 
            pf.id === processingId 
              ? { ...pf, progress: Math.min(pf.progress + 10, 90) } 
              : pf
          )
        );
      }, 200);

      try {
        const result = await extractText(file);
        
        clearInterval(progressInterval);
        
        // Remove from processing queue
        setProcessingFiles(prev => prev.filter(pf => pf.id !== processingId));
        
        // Add to results
        setResults(prev => [result, ...prev]);
      } catch (error) {
        clearInterval(progressInterval);
        setProcessingFiles(prev => prev.filter(pf => pf.id !== processingId));
        
        // Add error result
        const errorResult: ExtractionResult = {
          id: generateId(),
          fileName: file.name,
          fileType: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          category: 'unknown',
          status: 'error',
          text: '',
          warnings: [],
          errors: [`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          metadata: { size: file.size },
          processingTime: 0,
        };
        setResults(prev => [errorResult, ...prev]);
      }
    }
  }, []);

  const handleRemoveResult = useCallback((id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
    // Reset match index when removing a result
    setCurrentMatchIndex(0);
  }, []);

  const handleClearAll = useCallback(() => {
    setResults([]);
    setSearchQuery('');
    setCurrentMatchIndex(0);
  }, []);

  const handleDownloadAll = useCallback(() => {
    if (results.length === 0) return;
    
    const combinedText = results
      .filter(r => r.text)
      .map(r => `========================================\nFILE: ${r.fileName}\nTYPE: ${r.fileType}\nSTATUS: ${r.status}\n========================================\n\n${r.text}`)
      .join('\n\n\n');
    
    const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_text_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const isProcessing = processingFiles.length > 0;
  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Info Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Privacy Badge */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Privacy First:</strong> All processing happens in your browser. No files uploaded or stored. No data collected.
            </p>
          </div>

          {/* Free to Use Badge */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>100% Free</strong> forever
            </p>
          </div>

          {/* No Ads Badge */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>No Ads</strong>
            </p>
          </div>

          {/* Offline Mode Toggle */}
          <OfflineModeToggle />


          {/* Open Source Badge */}
          <a 
            href="https://github.com/murodjon05/text-extraction" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-700 dark:text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Open Source</strong>
            </p>
          </a>
        </div>

        {/* Upload Area - compact when has results */}
        <FileDropZone 
          onFilesSelected={handleFilesSelected} 
          isProcessing={isProcessing} 
          compact={hasResults}
        />
        
        {/* Format Guide - only show when no results */}
        {!hasResults && <FormatGuide />}
        
        {/* Processing Queue */}
        <ProcessingQueue files={processingFiles} />
        
        {/* Results Section */}
        {hasResults && (
          <div className="space-y-4">
            <StatsBar results={results} />
            
            {/* Always show search filter when there are results */}
            <SearchFilter
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              totalMatches={totalMatches}
              currentMatchIndex={currentMatchIndex}
              onNavigateMatch={handleNavigateMatch}
            />
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {filteredResults.length === results.length 
                  ? `Extracted Results (${results.length})`
                  : `Showing ${filteredResults.length} of ${results.length} results`}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadAll}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "bg-blue-100 text-blue-700 hover:bg-blue-200",
                    "dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All
                </button>
                <button
                  onClick={handleClearAll}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "bg-red-100 text-red-700 hover:bg-red-200",
                    "dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredResults.map(result => (
                <ExtractionCard 
                  key={result.id} 
                  result={result} 
                  onRemove={handleRemoveResult}
                  searchQuery={searchQuery}
                  activeMatchIndex={currentMatchIndex}
                  matchStartIndex={matchStartIndices.get(result.id) || 0}
                  onManualCollapse={handleManualCollapse}
                />
              ))}
              {filteredResults.length === 0 && results.length > 0 && (
                <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400">No results match your filters</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Features Section - only show when no results */}
        {!hasResults && !isProcessing && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-8">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Fast Processing",
                description: "Client-side extraction for instant results"
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "100% Private",
                description: "No uploads, no storage, no tracking"
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                ),
                title: "Exact Preservation",
                description: "Whitespace, indentation, and formatting kept"
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                title: "OCR Support",
                description: "Extract text from images with confidence levels"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Footer - Only GitHub links */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-6">
            <a 
              href="https://github.com/murodjon05/text-extraction" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span>Source Code</span>
            </a>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <a 
              href="https://github.com/murodjon05/text-extraction/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Report Issue
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
