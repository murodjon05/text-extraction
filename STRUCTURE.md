# 🏗️ Project Structure Guide

This guide helps developers understand the codebase structure so you can easily modify and extend the application.

## 📁 Directory Overview

```
text-extraction/
├── public/                  # Static assets (empty, Vite handles assets)
├── src/
│   ├── components/          # React UI components
│   │   ├── ExtractionCard.tsx    # Individual result card
│   │   ├── FileDropZone.tsx      # File upload area
│   │   ├── FormatGuide.tsx       # Supported formats info
│   │   ├── Header.tsx            # App header with title
│   │   ├── ProcessingIndicator.tsx # Loading spinner
│   │   ├── SearchFilter.tsx      # Search bar with navigation
│   │   └── ThemeContext.tsx      # Dark/Light mode provider
│   │
│   ├── services/            # Business logic
│   │   └── extractionService.ts  # All file extraction logic
│   │
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles & Tailwind config
│   ├── main.tsx             # React entry point
│   └── vite-env.d.ts        # Vite TypeScript declarations
│
├── index.html               # HTML entry point
├── package.json             # Dependencies & scripts
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── README.md                # Project documentation
├── STRUCTURE.md             # This file
└── .gitignore               # Git ignore rules
```

---

## 🧩 Component Details

### `src/App.tsx` - Main Application

**Purpose**: The root component that orchestrates everything.

**Key State Variables**:
```typescript
results: ExtractionResult[]      // Array of all extraction results
processingQueue: ProcessingFile[] // Files currently being processed
searchQuery: string              // Current search text
currentMatchIndex: number        // Active highlighted match
filterStatus: string             // Filter by 'all', 'success', 'error'
filterCategory: string           // Filter by file category
```

**Key Functions**:
| Function | Purpose |
|----------|---------|
| `handleFilesSelected(files)` | Processes dropped/selected files |
| `removeResult(id)` | Removes a single result |
| `clearAllResults()` | Clears all results |
| `handleNavigateMatch(direction)` | Navigate search matches |
| `copyAllToClipboard()` | Copy all extracted text |
| `downloadAllAsText()` | Download as .txt file |

**To Modify**:
- **Change main layout**: Edit the JSX structure in the return statement
- **Add new feature badges**: Find the `{/* Info badges */}` section
- **Change footer**: Find the `{/* Footer */}` section
- **Modify result display logic**: Edit the `filteredResults` useMemo

---

### `src/components/FileDropZone.tsx` - Upload Area

**Purpose**: The drag-and-drop file upload component.

**Props**:
```typescript
onFilesSelected: (files: File[]) => void  // Callback when files are dropped
disabled?: boolean                         // Disable during processing
compact?: boolean                          // Small version after first upload
```

**Key Elements**:
- Full size mode: Large icon, detailed text, format badges
- Compact mode: Horizontal layout, minimal text

**To Modify**:
- **Change upload icon**: Find `<Upload className=...` or `<Plus className=...`
- **Change upload text**: Edit the `<p>` and `<span>` elements
- **Change format badges**: Edit the arrays in the JSX (e.g., `['PDF', 'DOCX']`)
- **Change colors**: Modify the `border-*`, `bg-*`, `text-*` Tailwind classes
- **Change compact height**: Modify `h-16` in the compact mode section
- **Change full height**: Modify `h-[280px]` in the full mode section

**Example - Change upload text**:
```tsx
// Find this in FileDropZone.tsx:
<p className="text-xl font-semibold ...">
  Drop files or click to upload  {/* Change this text */}
</p>
```

---

### `src/components/ExtractionCard.tsx` - Result Card

**Purpose**: Displays a single extraction result with copy/download options.

**Props**:
```typescript
result: ExtractionResult      // The extraction result data
onRemove: (id: string) => void // Callback to remove this card
searchQuery?: string          // Current search query for highlighting
activeMatchIndex?: number     // Which match is currently active
matchStartIndex?: number      // This card's starting match index
```

**Key Sections**:
1. **Header**: File icon, name, status badge, action buttons
2. **Metadata**: File size, processing time, character count
3. **Content**: Extracted text with optional highlighting

**To Modify**:
- **Change card styling**: Modify the outer `<div className="bg-white dark:bg-gray-800...`
- **Change status badges**: Find the status badge section with `result.status`
- **Change action buttons**: Find `<button>` elements with Copy/Download icons
- **Change text display**: Modify the `<pre>` element styling
- **Change highlight colors**: Modify `bg-yellow-300` and `bg-orange-400` classes

**Example - Change card background**:
```tsx
// Find this in ExtractionCard.tsx:
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg...">
// Change to:
<div className="bg-blue-50 dark:bg-blue-900 rounded-xl shadow-lg...">
```

---

### `src/components/SearchFilter.tsx` - Search Bar

**Purpose**: Search input with match count and navigation arrows.

**Props**:
```typescript
searchQuery: string                        // Current search text
onSearchChange: (query: string) => void    // Callback on text change
filterStatus: string                       // Current status filter
onFilterStatusChange: (status: string) => void
filterCategory: string                     // Current category filter
onFilterCategoryChange: (category: string) => void
categories: string[]                       // Available categories
totalMatches: number                       // Total matches found
currentMatchIndex: number                  // Active match index
onNavigateMatch: (direction: 'prev' | 'next') => void
```

**Key Elements**:
- Search input with icon
- Match counter (X / Y)
- Up/Down navigation arrows
- Status dropdown (All, Success, Error)
- Category dropdown

**To Modify**:
- **Change search placeholder**: Find `placeholder="Search in extracted text..."`
- **Change navigation arrows**: Find `<ChevronUp>` and `<ChevronDown>` components
- **Add more filters**: Add new `<select>` elements following the existing pattern
- **Change match counter style**: Modify the `{totalMatches > 0 && ...}` section

---

### `src/components/Header.tsx` - App Header

**Purpose**: Displays the app title and dark/light mode toggle.

**To Modify**:
- **Change app title**: Edit the `<h1>` text
- **Change title icon**: Replace `<FileText>` with another Lucide icon
- **Change toggle button**: Modify the button with `<Sun>` and `<Moon>` icons
- **Add navigation links**: Add new elements after the title

**Example - Change title**:
```tsx
// Find in Header.tsx:
<h1 className="text-2xl font-bold...">
  Universal Text Extractor  {/* Change this */}
</h1>
```

---

### `src/components/ThemeContext.tsx` - Dark/Light Mode

**Purpose**: Provides theme state and toggle function to all components.

**Usage in components**:
```tsx
import { useTheme } from './ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  // theme is 'light' or 'dark'
}
```

**To Modify**:
- **Change default theme**: Modify the initial state logic
- **Add more themes**: Extend the theme type and add new CSS variables

---

### `src/components/FormatGuide.tsx` - Supported Formats

**Purpose**: Shows the list of supported file formats.

**Structure**: Grid of format categories with icons and format lists.

**To Modify**:
- **Add new format**: Add to the appropriate `formats` array
- **Add new category**: Add a new object to the `formats` array
- **Change icons**: Replace Lucide icon components
- **Change layout**: Modify the grid classes (`grid-cols-2 md:grid-cols-3...`)

---

### `src/components/ProcessingIndicator.tsx` - Loading Spinner

**Purpose**: Animated spinner shown during file processing.

**To Modify**:
- **Change spinner style**: Modify the SVG or use a different animation
- **Change size**: Modify `w-*` and `h-*` classes
- **Change colors**: Modify the stroke/fill colors

---

## ⚙️ Service Details

### `src/services/extractionService.ts` - Extraction Logic

**Purpose**: Contains all file extraction logic for different formats.

**Main Function**:
```typescript
extractText(file: File): Promise<ExtractionResult>
```

**Extractor Functions**:
| Function | Formats | Library Used |
|----------|---------|--------------|
| `extractPDF()` | PDF | PDF.js |
| `extractDOCX()` | DOCX | Mammoth.js |
| `extractExcel()` | XLS, XLSX | SheetJS |
| `extractImage()` | PNG, JPG, etc. | Tesseract.js |
| `extractNotebook()` | IPYNB | Built-in JSON |
| `extractCSV()` | CSV | Built-in |
| `extractJSON()` | JSON | Built-in |
| `extractXML()` | XML | Built-in |
| `extractHTML()` | HTML | Built-in |
| `extractPlainText()` | TXT, MD, Code | Built-in |

**To Modify**:
- **Add new format**: 
  1. Add extension to `getFileCategory()` 
  2. Create new extractor function
  3. Add case to the switch in `extractText()`
- **Change extraction behavior**: Modify the specific extractor function
- **Add post-processing**: Modify the result before returning

**Example - Add EPUB support**:
```typescript
// 1. Add to getFileCategory():
case 'epub':
  return 'document';

// 2. Create extractor:
async function extractEPUB(file: File): Promise<string> {
  // Your extraction logic
}

// 3. Add to switch in extractText():
case 'epub':
  text = await extractEPUB(file);
  break;
```

---

## 🎨 Styling Guide

### `src/index.css` - Global Styles

**Structure**:
```css
@import "tailwindcss";           /* Tailwind base styles */
@custom-variant dark (&:where(.dark, .dark *));  /* Dark mode support */

/* Custom component styles */
.upload-zone { ... }
.result-card { ... }
```

**Dark Mode**:
- Uses class-based dark mode (`.dark` class on `<html>`)
- Use `dark:` prefix for dark mode styles: `bg-white dark:bg-gray-800`

**To Modify**:
- **Change primary color**: Search for `indigo` or `blue` and replace
- **Change dark mode background**: Search for `dark:bg-gray-*` classes
- **Add custom animations**: Add `@keyframes` rules

---

## 🔧 Common Modifications

### Change the Primary Color Theme

1. Search for `indigo` in all files
2. Replace with your color (e.g., `blue`, `purple`, `emerald`)
3. Common places: buttons, links, focus rings, badges

### Add a New Info Badge

In `App.tsx`, find the `{/* Info badges */}` section and add:
```tsx
<div className="flex items-center gap-1.5 bg-pink-500/10 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-full text-sm font-medium">
  <Heart className="h-3.5 w-3.5" />
  <span>Your Text</span>
</div>
```

### Change the Footer Links

In `App.tsx`, find the `{/* Footer */}` section and modify the links:
```tsx
<a href="https://your-link.com" target="_blank" rel="noopener noreferrer">
  Your Link Text
</a>
```

### Modify Upload Box Size

In `FileDropZone.tsx`:
- Full size height: Change `h-[280px]` 
- Compact height: Change `h-16`
- Width: Change the parent container in `App.tsx`

### Change the Result Card Layout

In `ExtractionCard.tsx`:
- Card max height: Change `max-h-[400px]`
- Text area max height: Change `max-h-96`
- Card padding: Change `p-*` classes

### Add a New File Format

See the "Add new format" section under `extractionService.ts` above.

---

## 🚀 Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type check
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

---

## 📝 Tips

1. **Use React DevTools**: Install the browser extension to inspect component state
2. **Tailwind IntelliSense**: Install the VS Code extension for class autocomplete
3. **Check the Console**: Extraction errors are logged to the browser console
4. **Test with Different Files**: Keep sample files of each format for testing

---

## ❓ Need Help?

- Check [README.md](./README.md) for general usage
- Open an issue on [GitHub](https://github.com/murodjon05/text-extraction/issues)
- Review Tailwind CSS docs: https://tailwindcss.com/docs
- Review React docs: https://react.dev/
