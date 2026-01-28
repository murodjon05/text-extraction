import { ExtractionResult } from '../types';
import { getFileCategory, getFileExtension, generateId } from '../utils/fileUtils';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// Configure PDF.js worker - use unpkg for reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractText(file: File): Promise<ExtractionResult> {
  const startTime = performance.now();
  const category = getFileCategory(file.name);
  const extension = getFileExtension(file.name);
  
  const result: ExtractionResult = {
    id: generateId(),
    fileName: file.name,
    fileType: extension.toUpperCase() || 'UNKNOWN',
    category,
    status: 'processing',
    text: '',
    warnings: [],
    errors: [],
    metadata: {
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
    },
    processingTime: 0,
  };

  try {
    switch (category) {
      case 'document':
        await extractDocument(file, result);
        break;
      case 'data':
        await extractData(file, result);
        break;
      case 'image':
        await extractImage(file, result);
        break;
      case 'code':
        await extractCode(file, result);
        break;
      case 'notebook':
        await extractNotebook(file, result);
        break;
      default:
        await extractUnknown(file, result);
    }

    if (result.errors.length === 0 && result.text.length > 0) {
      result.status = result.warnings.length > 0 ? 'partial' : 'success';
    } else if (result.errors.length > 0 && result.text.length > 0) {
      result.status = 'partial';
    } else if (result.errors.length > 0) {
      result.status = 'error';
    }
  } catch (error) {
    result.status = 'error';
    result.errors.push(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  result.processingTime = Math.round(performance.now() - startTime);
  return result;
}

async function extractDocument(file: File, result: ExtractionResult): Promise<void> {
  const ext = getFileExtension(file.name);
  
  switch (ext) {
    case 'pdf':
      await extractPDF(file, result);
      break;
    case 'docx':
      await extractDOCX(file, result);
      break;
    case 'doc':
      result.warnings.push('DOC format has limited support. For best results, convert to DOCX.');
      await extractDOCX(file, result);
      break;
    case 'txt':
    case 'md':
    case 'markdown':
      result.text = await file.text();
      break;
    case 'html':
    case 'htm':
      await extractHTML(file, result);
      break;
    case 'rtf':
      await extractRTF(file, result);
      break;
    default:
      result.text = await file.text();
      result.warnings.push(`Best-effort extraction for .${ext} format`);
  }
}

async function extractPDF(file: File, result: ExtractionResult): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Create loading task with timeout
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
    });
    
    // Add timeout for PDF loading (30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF loading timed out')), 30000);
    });
    
    const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
    
    result.metadata.pageCount = pdf.numPages;
    result.pages = [];
    
    const textParts: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        let lastY: number | null = null;
        
        for (const item of textContent.items) {
          if ('str' in item) {
            const currentY = (item.transform as number[])[5];
            
            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
              pageText += '\n';
            } else if (lastY !== null && pageText.length > 0 && !pageText.endsWith(' ')) {
              pageText += ' ';
            }
            
            pageText += item.str;
            lastY = currentY;
          }
        }
        
        result.pages.push({
          pageNumber: i,
          text: pageText.trim(),
        });
        
        textParts.push(`--- Page ${i} ---\n${pageText.trim()}`);
      } catch (pageError) {
        result.warnings.push(`Page ${i}: Extraction error - possible corruption`);
        result.pages.push({
          pageNumber: i,
          text: '[UNREADABLE: Page extraction failed]',
        });
        textParts.push(`--- Page ${i} ---\n[UNREADABLE: Page extraction failed]`);
      }
    }
    
    result.text = textParts.join('\n\n');
    
    // Clean up
    await pdf.destroy();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`PDF extraction failed: ${errorMessage}`);
    result.text = '[UNREADABLE: PDF extraction failed]';
  }
}

async function extractDOCX(file: File, result: ExtractionResult): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const docResult = await mammoth.extractRawText({ arrayBuffer });
    
    result.text = docResult.value;
    
    if (docResult.messages && docResult.messages.length > 0) {
      docResult.messages.forEach(msg => {
        if (msg.type === 'warning') {
          result.warnings.push(msg.message);
        } else if (msg.type === 'error') {
          result.errors.push(msg.message);
        }
      });
    }
  } catch (error) {
    result.errors.push('Failed to extract DOCX. File may be corrupted or password-protected.');
    result.text = '[UNREADABLE: DOCX extraction failed]';
  }
}

async function extractHTML(file: File, result: ExtractionResult): Promise<void> {
  const html = await file.text();
  
  // Create a DOM parser to extract text while preserving structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style');
  scripts.forEach(el => el.remove());
  
  // Extract text content
  const extractTextFromNode = (node: Node, depth: number = 0): string => {
    let text = '';
    
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent?.trim();
      if (content) {
        text += content;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Add line breaks for block elements
      const blockElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'br', 'hr'];
      if (blockElements.includes(tagName) && text.length > 0) {
        text += '\n';
      }
      
      node.childNodes.forEach(child => {
        text += extractTextFromNode(child, depth + 1);
      });
      
      if (blockElements.includes(tagName)) {
        text += '\n';
      }
    }
    
    return text;
  };
  
  result.text = extractTextFromNode(doc.body)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Also store raw HTML
  result.metadata.rawHtmlLength = html.length;
}

async function extractRTF(file: File, result: ExtractionResult): Promise<void> {
  const content = await file.text();
  
  // Basic RTF to text conversion
  let text = content
    // Remove RTF control words
    .replace(/\\[a-z]+\d* ?/g, '')
    // Remove curly braces groups
    .replace(/\{[^}]*\}/g, '')
    // Remove remaining braces
    .replace(/[{}]/g, '')
    // Convert line breaks
    .replace(/\\par/g, '\n')
    .replace(/\\\n/g, '\n')
    // Clean up whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  result.text = text;
  result.warnings.push('RTF extraction is best-effort. Some formatting may be lost.');
}

async function extractData(file: File, result: ExtractionResult): Promise<void> {
  const ext = getFileExtension(file.name);
  
  switch (ext) {
    case 'csv':
    case 'tsv':
      result.text = await file.text();
      break;
    case 'xlsx':
    case 'xls':
      await extractExcel(file, result);
      break;
    case 'json':
      await extractJSON(file, result);
      break;
    case 'xml':
      result.text = await file.text();
      break;
    case 'yaml':
    case 'yml':
      result.text = await file.text();
      break;
    default:
      result.text = await file.text();
  }
}

async function extractExcel(file: File, result: ExtractionResult): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    result.metadata.sheetCount = workbook.SheetNames.length;
    
    const sheets: string[] = [];
    
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
      sheets.push(`=== Sheet ${index + 1}: ${sheetName} ===\n${csv}`);
    });
    
    result.text = sheets.join('\n\n');
  } catch (error) {
    result.errors.push('Failed to extract Excel file. File may be corrupted or password-protected.');
    result.text = '[UNREADABLE: Excel extraction failed]';
  }
}

async function extractJSON(file: File, result: ExtractionResult): Promise<void> {
  const content = await file.text();
  
  try {
    // Validate JSON and format it
    const parsed = JSON.parse(content);
    result.text = JSON.stringify(parsed, null, 2);
    result.metadata.isValidJson = 1;
  } catch {
    // Return raw content if not valid JSON
    result.text = content;
    result.warnings.push('File does not contain valid JSON');
    result.metadata.isValidJson = 0;
  }
}

async function extractImage(file: File, result: ExtractionResult): Promise<void> {
  try {
    const imageUrl = URL.createObjectURL(file);
    
    // Use improved OCR settings for better accuracy
    // Tesseract.js v5 with eng language trained data
    const ocrResult = await Tesseract.recognize(imageUrl, 'eng', {
      logger: () => {}, // Suppress logging
    });
    
    URL.revokeObjectURL(imageUrl);
    
    result.text = ocrResult.data.text;
    result.confidence = Math.round(ocrResult.data.confidence);
    
    result.metadata.ocrConfidence = result.confidence;
    
    // Add detailed confidence warnings
    if (result.confidence < 30) {
      result.warnings.push(`Very low OCR confidence: ${result.confidence}% - Text extraction is unreliable. The image may contain logos, icons, handwriting, or non-text elements.`);
    } else if (result.confidence < 50) {
      result.warnings.push(`Low OCR confidence: ${result.confidence}% - Text may be inaccurate. Consider using a clearer image.`);
    } else if (result.confidence < 75) {
      result.warnings.push(`Moderate OCR confidence: ${result.confidence}% - Some text may be inaccurate.`);
    }
    
    // Check for potentially problematic areas
    const words = (ocrResult.data as { words?: Array<{ confidence: number; text: string }> }).words || [];
    const lowConfWords = words.filter((w: { confidence: number }) => w.confidence < 60);
    
    if (lowConfWords.length > 0 && lowConfWords.length <= 10) {
      const examples = lowConfWords.slice(0, 3).map((w: { text: string }) => `"${w.text}"`).join(', ');
      result.warnings.push(`${lowConfWords.length} word(s) with low confidence: ${examples}${lowConfWords.length > 3 ? '...' : ''}`);
    } else if (lowConfWords.length > 10) {
      result.warnings.push(`${lowConfWords.length} words with low confidence detected - consider using a higher quality image.`);
    }
    
    if (!result.text.trim()) {
      result.warnings.push('No text detected in image. This could mean: (1) The image contains only graphics/logos, (2) Text is too small or blurry, (3) Text is in an unsupported language, or (4) The image is empty.');
      result.text = '[NO TEXT DETECTED: Image may contain graphics, logos, or non-text content only]';
    }
    
    // Detect if the result looks like garbage (random characters)
    const alphanumericRatio = (result.text.match(/[a-zA-Z0-9]/g) || []).length / Math.max(result.text.length, 1);
    if (result.text.length > 5 && alphanumericRatio < 0.3 && result.confidence < 60) {
      result.warnings.push('Text appears to contain many non-alphanumeric characters. This may indicate the image contains symbols, icons, or non-English text.');
    }
    
  } catch (error) {
    result.errors.push(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.text = '[UNREADABLE: OCR extraction failed]';
  }
}

async function extractCode(file: File, result: ExtractionResult): Promise<void> {
  const content = await file.text();
  const ext = getFileExtension(file.name);
  
  result.text = content;
  result.metadata.lineCount = content.split('\n').length;
  result.metadata.language = ext.toUpperCase();
  
  // Detect encoding issues
  if (content.includes('\uFFFD')) {
    result.warnings.push('File contains replacement characters - possible encoding issues');
  }
}

async function extractNotebook(file: File, result: ExtractionResult): Promise<void> {
  try {
    const content = await file.text();
    const notebook = JSON.parse(content);
    
    const parts: string[] = [];
    
    // Extract metadata
    if (notebook.metadata) {
      const lang = notebook.metadata.kernelspec?.language || 
                   notebook.metadata.language_info?.name || 
                   'unknown';
      result.metadata.notebookLanguage = lang;
    }
    
    // Extract cells
    const cells = notebook.cells || [];
    result.metadata.cellCount = cells.length;
    
    cells.forEach((cell: any, index: number) => {
      const cellNum = index + 1;
      const cellType = cell.cell_type || 'unknown';
      
      parts.push(`=== Cell ${cellNum} (${cellType}) ===`);
      
      // Source content
      if (cell.source) {
        const source = Array.isArray(cell.source) 
          ? cell.source.join('') 
          : cell.source;
        parts.push(source);
      }
      
      // Outputs for code cells
      if (cell.outputs && cell.outputs.length > 0) {
        parts.push('\n--- Output ---');
        cell.outputs.forEach((output: any) => {
          if (output.text) {
            const text = Array.isArray(output.text) 
              ? output.text.join('') 
              : output.text;
            parts.push(text);
          } else if (output.data) {
            if (output.data['text/plain']) {
              const text = Array.isArray(output.data['text/plain'])
                ? output.data['text/plain'].join('')
                : output.data['text/plain'];
              parts.push(text);
            }
          } else if (output.ename) {
            parts.push(`[Error: ${output.ename}] ${output.evalue || ''}`);
          }
        });
      }
      
      parts.push('');
    });
    
    result.text = parts.join('\n');
  } catch (error) {
    result.errors.push('Failed to parse notebook. File may be corrupted.');
    result.text = '[UNREADABLE: Notebook extraction failed]';
  }
}

async function extractUnknown(file: File, result: ExtractionResult): Promise<void> {
  result.warnings.push('Unknown file format - attempting best-effort text extraction');
  
  try {
    // First try to read as text
    const content = await file.text();
    
    // Check if content looks like binary
    const binaryCheck = content.slice(0, 1000);
    const nonPrintable = (binaryCheck.match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
    
    if (nonPrintable > binaryCheck.length * 0.1) {
      // Likely binary file, try to extract any readable text
      result.warnings.push('File appears to be binary - extracted readable portions only');
      
      // Extract only printable ASCII and common Unicode
      const readable = content.replace(/[^\x20-\x7E\r\n\t]/g, ' ')
        .replace(/ {3,}/g, ' ')
        .trim();
      
      if (readable.length < 10) {
        result.errors.push('No readable text content found');
        result.text = '[UNREADABLE: Binary file with no extractable text]';
      } else {
        result.text = readable;
      }
    } else {
      // Appears to be text
      result.text = content;
    }
    
    // Try to detect if it's a zip-based format
    const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (header[0] === 0x50 && header[1] === 0x4B) {
      result.warnings.push('File appears to be a ZIP-based format. Consider extracting individual files.');
      
      try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const textFiles: string[] = [];
        
        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir) {
            try {
              const content = await zipEntry.async('string');
              if (content && content.length > 0) {
                textFiles.push(`=== ${path} ===\n${content}`);
              }
            } catch {
              // Skip non-text files
            }
          }
        }
        
        if (textFiles.length > 0) {
          result.text = textFiles.join('\n\n');
          result.warnings.push(`Extracted ${textFiles.length} text file(s) from archive`);
        }
      } catch {
        // Keep original text if zip extraction fails
      }
    }
  } catch (error) {
    result.errors.push('Could not read file as text');
    result.text = '[UNREADABLE: File extraction failed]';
  }
}
