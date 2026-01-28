import { useCallback, useState, useRef } from 'react';
import { cn } from '@/utils/cn';
import { SUPPORTED_FORMATS } from '@/utils/fileUtils';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  compact?: boolean;
}

export function FileDropZone({ onFilesSelected, isProcessing, compact = false }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = '';
  };

  // Compact mode - smaller upload area when files have been uploaded
  if (compact) {
    return (
      <div className="w-full">
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex items-center justify-center gap-4 w-full py-4 px-6",
            "border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
            "bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50",
            isDragOver 
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]" 
              : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500",
            isProcessing && "pointer-events-none opacity-60"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleInputChange}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0",
            "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md",
            isDragOver && "scale-110"
          )}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4v16m8-8H4" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
              {isDragOver ? "Drop files here" : "Add more files"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Drop files here or click to upload
            </p>
          </div>
          
          <div className="hidden sm:flex flex-wrap gap-1.5">
            {['PDF', 'DOCX', 'Images', 'Code'].map(format => (
              <span 
                key={format}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
              >
                {format}
              </span>
            ))}
            <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              +more
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full size mode - initial state before any uploads
  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[280px] p-8",
          "border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300",
          "bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50",
          isDragOver 
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]" 
            : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500",
          isProcessing && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className={cn(
          "w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/30",
          isDragOver && "scale-110"
        )}>
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
          {isDragOver ? "Drop files here" : "Drop files or click to upload"}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-2">
          Upload any file to extract its text content
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6">
          Multiple files supported
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {Object.entries(SUPPORTED_FORMATS).map(([category, formats]) => (
            <div key={category} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
                {category}: {formats.slice(0, 3).join(', ')}{formats.length > 3 ? '...' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
