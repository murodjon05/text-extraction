import { FileCategory } from '../types';

const EXTENSION_MAP: Record<string, { category: FileCategory; mimeType?: string }> = {
  // Documents
  pdf: { category: 'document' },
  doc: { category: 'document' },
  docx: { category: 'document' },
  txt: { category: 'document' },
  md: { category: 'document' },
  markdown: { category: 'document' },
  html: { category: 'document' },
  htm: { category: 'document' },
  rtf: { category: 'document' },
  odt: { category: 'document' },
  
  // Data
  csv: { category: 'data' },
  xls: { category: 'data' },
  xlsx: { category: 'data' },
  json: { category: 'data' },
  xml: { category: 'data' },
  yaml: { category: 'data' },
  yml: { category: 'data' },
  tsv: { category: 'data' },
  
  // Images (OCR)
  png: { category: 'image' },
  jpg: { category: 'image' },
  jpeg: { category: 'image' },
  webp: { category: 'image' },
  tiff: { category: 'image' },
  tif: { category: 'image' },
  gif: { category: 'image' },
  bmp: { category: 'image' },
  
  // Code
  js: { category: 'code' },
  jsx: { category: 'code' },
  ts: { category: 'code' },
  tsx: { category: 'code' },
  py: { category: 'code' },
  java: { category: 'code' },
  c: { category: 'code' },
  cpp: { category: 'code' },
  h: { category: 'code' },
  hpp: { category: 'code' },
  cs: { category: 'code' },
  go: { category: 'code' },
  rs: { category: 'code' },
  rb: { category: 'code' },
  php: { category: 'code' },
  swift: { category: 'code' },
  kt: { category: 'code' },
  scala: { category: 'code' },
  r: { category: 'code' },
  sql: { category: 'code' },
  sh: { category: 'code' },
  bash: { category: 'code' },
  zsh: { category: 'code' },
  ps1: { category: 'code' },
  vue: { category: 'code' },
  svelte: { category: 'code' },
  lua: { category: 'code' },
  perl: { category: 'code' },
  pl: { category: 'code' },
  asm: { category: 'code' },
  vb: { category: 'code' },
  dart: { category: 'code' },
  elm: { category: 'code' },
  ex: { category: 'code' },
  exs: { category: 'code' },
  erl: { category: 'code' },
  clj: { category: 'code' },
  hs: { category: 'code' },
  ml: { category: 'code' },
  fs: { category: 'code' },
  scss: { category: 'code' },
  sass: { category: 'code' },
  less: { category: 'code' },
  css: { category: 'code' },
  graphql: { category: 'code' },
  proto: { category: 'code' },
  makefile: { category: 'code' },
  dockerfile: { category: 'code' },
  
  // Notebooks
  ipynb: { category: 'notebook' },
};

export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function getFileCategory(fileName: string): FileCategory {
  const ext = getFileExtension(fileName);
  return EXTENSION_MAP[ext]?.category || 'unknown';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const SUPPORTED_FORMATS = {
  documents: ['PDF', 'DOC', 'DOCX', 'TXT', 'MD', 'HTML', 'RTF'],
  data: ['CSV', 'XLS', 'XLSX', 'JSON', 'XML', 'YAML'],
  images: ['PNG', 'JPG', 'WEBP', 'TIFF', 'GIF', 'BMP'],
  code: ['JS', 'TS', 'PY', 'JAVA', 'C/C++', 'GO', 'RS', 'RB', 'PHP', 'and 30+ more'],
  notebooks: ['IPYNB'],
};
