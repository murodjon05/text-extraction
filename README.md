# 📄 Universal Text Extractor

A powerful, privacy-first text extraction tool that runs entirely in your browser. Extract text from documents, images, code files, and more without uploading anything to a server.

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-blue)

## ✨ Features

### 🔒 Privacy First
- **100% Client-Side Processing** - All file processing happens in your browser
- **No File Uploads** - Your files never leave your device
- **No Data Collection** - We don't track, store, or collect any data
- **No Database** - Nothing is persisted anywhere

### 💰 Free & Open
- **100% Free** - No payment, no premium features, everything is free
- **No Ads** - Clean, ad-free experience
- **No Sign-up** - No account required, just use it
- **Open Source** - MIT licensed, fork and modify as you wish

### 📁 Supported Formats

| Category | Formats |
|----------|---------|
| **Documents** | PDF, DOC, DOCX, TXT, MD, HTML, RTF, ODT |
| **Data Files** | CSV, XLS, XLSX, JSON, XML, YAML, YML, TSV, TOML |
| **Images (OCR)** | PNG, JPG, JPEG, WEBP, TIFF, TIF, GIF, BMP, ICO, SVG |
| **Code** | JS, TS, JSX, TSX, PY, JAVA, C, CPP, H, HPP, CS, GO, RS, RB, PHP, SWIFT, KT, SCALA, R, MATLAB, PERL, LUA, SHELL, SQL, and more |
| **Notebooks** | IPYNB (Jupyter Notebooks - extracts markdown, code, and outputs) |
| **Config** | ENV, INI, CFG, CONF, PROPERTIES |
| **Other** | LOG, any unknown format (best-effort extraction) |

### 🎯 Extraction Quality
- **Verbatim Extraction** - No summarization, rewriting, or interpretation
- **Formatting Preserved** - Maintains original whitespace, indentation, and structure
- **PDF Page Order** - Preserves page numbers with clear page markers
- **OCR Confidence** - Shows confidence percentage for image text extraction
- **Error Handling** - Clearly marks unreadable or corrupted sections

### 🎨 User Interface
- **Dark/Light Mode** - Toggle between themes (preference is saved)
- **Drag & Drop** - Simply drag files onto the upload area
- **Multi-file Support** - Process multiple files simultaneously
- **Processing Queue** - Visual progress for each file
- **Search & Filter** - Search within extracted text with highlighting
- **Match Navigation** - Jump between search matches with arrows or keyboard
- **Copy & Download** - Copy individual results or download all as text
- **Collapsible Results** - Expand/collapse extraction results

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/murodjon05/text-extraction.git
cd text-extraction

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

1. **Open the app** in your browser (default: http://localhost:5173)
2. **Upload files** by:
   - Dragging and dropping onto the upload area
   - Clicking the upload area to select files
3. **Wait for processing** - Progress is shown for each file
4. **View extracted text** - Results appear below with formatting preserved
5. **Search** - Use the search bar to find specific text (Enter/Shift+Enter to navigate)
6. **Copy or Download** - Use the buttons to copy or download extracted text

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **PDF Processing**: PDF.js
- **Office Documents**: Mammoth.js (DOCX), SheetJS (Excel)
- **OCR**: Tesseract.js
- **Icons**: Lucide React

## 📖 Documentation

- [STRUCTURE.md](./STRUCTURE.md) - Developer guide for understanding and modifying the codebase

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Bug Reports

Found a bug? Please open an issue at [GitHub Issues](https://github.com/murodjon05/text-extraction/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla's PDF rendering library
- [Tesseract.js](https://tesseract.projectnaptha.com/) - Pure JavaScript OCR
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX to text conversion
- [SheetJS](https://sheetjs.com/) - Excel file parsing
- [Lucide](https://lucide.dev/) - Beautiful icons

---

Made with ❤️ by [Murodjon](https://github.com/murodjon05)
