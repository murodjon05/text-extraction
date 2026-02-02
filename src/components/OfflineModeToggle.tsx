import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

export function OfflineModeToggle() {
  const [isOfflineEnabled, setIsOfflineEnabled] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if offline mode was previously enabled
    const stored = localStorage.getItem('offline-mode-enabled');
    if (stored === 'true') {
      setIsOfflineEnabled(true);
      checkCacheStatus();
    }
  }, []);

  const checkCacheStatus = async () => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('text-extractor-static-v3');
        const tessdataResponse = await cache.match('/tessdata/eng.traineddata');
        setIsCached(!!tessdataResponse);
      } catch {
        setIsCached(false);
      }
    }
  };

  const enableOfflineMode = async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      // Send message to service worker to cache resources
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ENABLE_OFFLINE_MODE'
        });

        // Wait a bit for caching to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      clearInterval(progressInterval);
      setProgress(100);
      
      localStorage.setItem('offline-mode-enabled', 'true');
      setIsOfflineEnabled(true);
      setIsCached(true);
      
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      console.error('Failed to enable offline mode:', error);
      setIsLoading(false);
      setProgress(0);
    }
  };

  const disableOfflineMode = async () => {
    try {
      if ('caches' in window) {
        const staticCache = await caches.open('text-extractor-static-v3');
        const dynamicCache = await caches.open('text-extractor-dynamic-v3');
        
        // Delete tessdata and external resources
        await staticCache.delete('/tessdata/eng.traineddata');
        
        // Get all cached URLs and delete external ones
        const staticKeys = await staticCache.keys();
        const dynamicKeys = await dynamicCache.keys();
        
        const externalUrls = [
          'https://unpkg.com/pdfjs-dist@',
          'https://cdn.jsdelivr.net/npm/tesseract.js@'
        ];
        
        for (const request of staticKeys) {
          if (externalUrls.some(url => request.url.includes(url))) {
            await staticCache.delete(request);
          }
        }
        
        for (const request of dynamicKeys) {
          await dynamicCache.delete(request);
        }
      }

      localStorage.removeItem('offline-mode-enabled');
      setIsOfflineEnabled(false);
      setIsCached(false);
    } catch (error) {
      console.error('Failed to disable offline mode:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
        <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Caching... {progress}%
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

  if (isOfflineEnabled && isCached) {
    return (
      <button
        onClick={disableOfflineMode}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
          "bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700",
          "hover:bg-teal-100 dark:hover:bg-teal-900/50"
        )}
        title="Click to disable offline mode and free up storage"
      >
        <svg className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
        <p className="text-sm text-teal-700 dark:text-teal-300">
          <strong>Offline Mode On</strong>
        </p>
        <svg className="w-4 h-4 text-teal-500 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={enableOfflineMode}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
        "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600",
        "hover:bg-slate-100 dark:hover:bg-slate-700"
      )}
      title="Enable offline mode to use without internet (uses ~25MB storage)"
    >
      <svg className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        <strong>Enable Offline</strong> <span className="text-xs">(~25MB)</span>
      </p>
    </button>
  );
}
