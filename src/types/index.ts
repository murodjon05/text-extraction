export type FileCategory = 
  | 'document' 
  | 'data' 
  | 'image' 
  | 'code' 
  | 'notebook' 
  | 'unknown';

export type ExtractionStatus = 
  | 'pending' 
  | 'processing' 
  | 'success' 
  | 'partial' 
  | 'error';

export interface ExtractionResult {
  id: string;
  fileName: string;
  fileType: string;
  category: FileCategory;
  status: ExtractionStatus;
  text: string;
  pages?: PageContent[];
  confidence?: number;
  warnings: string[];
  errors: string[];
  metadata: Record<string, string | number>;
  processingTime: number;
}

export interface PageContent {
  pageNumber: number;
  text: string;
  confidence?: number;
}

export interface ExtractorOptions {
  preserveFormatting: boolean;
  ocrLanguage: string;
}
