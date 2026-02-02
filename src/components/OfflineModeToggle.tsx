import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

export function OfflineModeToggle() {
  const [isOcrEnabled, setIsOcrEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if OCR offline mode was previously enabled
    const stored = localStorage.getItem('ocr-offline-enabled');
    if (stored === 'true') {
      setIsOcrEnabled(true);
    }

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'OCR_OFFLINE_ENABLED') {
          setIsOcrEnabled(true);
          setIsLoading(false);
          setProgress(0);
        }
      });
    }
  }, []);

  const checkOnlineStatus = () => {
    return navigator.onLine;
  };

  const enableOcrOffline = async () => {
    // Check if already online
    if (!checkOnlineStatus()) {
      setError('You need an internet connection to download OCR language data.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress (actual download happens in service worker)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 2;
        });
      }, 300);

      // Send message to service worker to cache OCR resources
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ENABLE_OCR_OFFLINE'
        });

        // Wait for download to complete (approximate)
        await new Promise(resolve => setTimeout(resolve, 8000));
      } else {
        // If service worker not ready, try again after a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'ENABLE_OCR_OFFLINE'
          });
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      }

      clearInterval(progressInterval);
      setProgress(100);
      
      localStorage.setItem('ocr-offline-enabled', 'true');
      setIsOcrEnabled(true);
      
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Failed to enable OCR offline mode:', error);
      setError('Failed to download. Please try again.');
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Show error message
  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
        <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
        <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Downloading OCR data... {progress}%
          </span>
          <div className="w-24 h-1 bg-amber-200 dark:bg-amber-800 rounded-full mt-1">
            <div 
              className="h-full bg-amber-600 dark:bg-amber-400 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show enabled state (no way to disable - one way only)
  if (isOcrEnabled) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700">
        <svg className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm text-teal-700 dark:text-teal-300">
          <strong>Images Offline Ready</strong>
        </p>
      </div>
    );
  }

  // Show button to enable (default state)
  return (
    <button
      onClick={enableOcrOffline}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
        "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700",
        "hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
      )}
      title="Enable offline support for image OCR (requires ~22MB download)"
    >
      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm text-indigo-700 dark:text-indigo-300">
        <strong>Enable Image OCR Offline</strong> <span className="text-xs">(~22MB)</span>
      </p>
    </button>
  );
}
