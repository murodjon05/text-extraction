import { cn } from '@/utils/cn';

interface ProcessingFile {
  id: string;
  name: string;
  progress: number;
}

interface ProcessingQueueProps {
  files: ProcessingFile[];
}

export function ProcessingQueue({ files }: ProcessingQueueProps) {
  if (files.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800"></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-white">
          Processing {files.length} file{files.length !== 1 ? 's' : ''}...
        </h3>
      </div>
      
      <div className="space-y-3">
        {files.map(file => (
          <div key={file.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80%]">{file.name}</span>
              <span className="text-slate-500 dark:text-slate-400">{Math.round(file.progress)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  "bg-gradient-to-r from-blue-500 to-indigo-500"
                )}
                style={{ width: `${file.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
