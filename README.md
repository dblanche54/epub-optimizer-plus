# EPUB Optimizer

A Node.js utility to optimize EPUB files by compressing HTML, CSS, images and recompressing the archive. This tool can significantly reduce EPUB file sizes while maintaining compatibility with e-readers and ensuring EPUB specification compliance.

## Features

- HTML/XHTML minification (removes whitespace, comments, and unnecessary code)
- CSS optimization (minifies and combines rules)
- Image compression (JPEG, PNG, WebP, GIF, AVIF, SVG optimization without significant quality loss)
- Archive recompression (more efficient zip packaging)
- EPUB validation against the EPUB specification
- XML/XHTML validation fixing (automatically repairs common validation issues)
- Command-line interface with customizable options
- File size comparison reporting
- Modern code linting and formatting with Biome

## Requirements

- Node.js 14 or higher
- Java Runtime Environment (JRE) 1.7 or higher (for EPUBCheck validation)
- npm or pnpm for package management

## Installation

### Local Installation

```bash
# Clone the repository
git clone https://github.com/kiki-le-singe/epub-optimizer.git
cd epub-optimizer

# Using npm
npm install

# Using pnpm
pnpm install
```

### Global Installation

```bash
# Using npm
npm install -g epub-optimizer

# Using pnpm
pnpm install -g epub-optimizer
```

### EPUBCheck Setup

This tool requires EPUBCheck to validate EPUB files. Follow these steps:

1. Download EPUBCheck from the [official website](https://www.w3.org/publishing/epubcheck/)
2. Extract the downloaded zip file
3. Copy the extracted `epubcheck-x.x.x` folder (where x.x.x is the version) to the root of this project
4. Make sure the folder is named `epubcheck-5.2.1` to match the path in package.json

### File Placement

When using the default configuration:

1. Place your EPUB file (e.g., `mybook.epub`) at the root of the project
2. The optimized output will be created as `mybook_opt.epub` in the root directory
3. If you want to use different file names, use the command line options (see below)

## Usage

### Scripts

The project includes the following scripts (see also the `package.json`):

| Script          | Description                                                                     |
| --------------- | ------------------------------------------------------------------------------- |
| `optimize`      | Optimize the EPUB file (compression, minification, image optimization)          |
| `optimize:keep` | Optimize and keep temp files for debugging                                      |
| `fix`           | Run all fix scripts on extracted files (fixes span tags, XML, and XHTML issues) |
| `create-epub`   | Repackage EPUB from temp directory                                              |
| `validate`      | Validate EPUB with EPUBCheck                                                    |
| `build`         | Full pipeline: optimize, fix, repackage, validate                               |
| `cleanup`       | Remove temp and intermediate files                                              |
| `build-clean`   | Full pipeline and cleanup                                                       |
| `lint`          | Lint code with Biome                                                            |
| `format`        | Format code with Biome                                                          |

### Basic Usage

```bash
# Complete optimization, fixing, and validation
pnpm build

# Optimize, fix, validate and clean up temporary files
pnpm build-clean

# Individual steps
pnpm optimize        # Only compress the EPUB file
pnpm fix             # Fix XML/XHTML validation issues
pnpm validate        # Check EPUB validity
```

### Advanced Usage Examples

```bash
# Process a file with a specific name
pnpm optimize -- -i mynovel.epub -o mynovel_optimized.epub

# Specify custom JPEG quality (higher quality, larger file)
pnpm optimize -- --jpg-quality 85

# Keep temporary files for inspection
pnpm optimize:keep

# Process files in another location
pnpm optimize -- -i /path/to/books/mybook.epub -o /path/to/output/mybook_optimized.epub
```

### Command Line Options

```
Usage: epub-optimize [options]

Options:
  -i, --input       Input EPUB file path                       [string] [default: "mybook.epub"]
  -o, --output      Output EPUB file path                      [string] [default: "mybook_opt.epub"]
  -t, --temp        Temporary directory for processing         [string] [default: "temp_epub"]
  -k, --keep-temp   Keep temporary files after processing      [boolean] [default: false]
  --jpg-quality     JPEG compression quality (0-100)           [number] [default: 70]
  --png-quality     PNG compression quality (0-1 scale)        [array] [default: [0.6, 0.8]]
  -h, --help        Show help                                  [boolean]
  -v, --version     Show version number                        [boolean]

Examples:
  epub-optimize -i book.epub -o book-optimized.epub   Optimize a specific EPUB file
  epub-optimize -i /path/to/book.epub                 Optimize a file from another directory
```

## Project Structure

```
epub-optimizer/
├── optimize-epub.js         # Main entry point
├── package.json             # Package configuration
├── README.md                # Documentation
├── epubcheck-5.2.1/         # EPUBCheck for EPUB validation
├── scripts/                 # Helper scripts
│   ├── fix_xml.js           # Fixes XML/XHTML validation issues
│   └── fix_span_tags.js     # Fixes span tag validation issues
└── src/                     # Source code directory
    ├── index.js             # Main application logic
    ├── cli.js               # Command-line interface
    ├── processors/          # Processing modules
    │   ├── archiveProcessor.js  # EPUB extraction/compression
    │   ├── htmlProcessor.js     # HTML/CSS processing
    │   └── imageProcessor.js    # Image optimization
    └── utils/               # Utility modules
        └── config.js        # Application configuration
```

## Troubleshooting

### Common Issues

1. **"Error: Unable to access jarfile"**: Make sure Java is installed and EPUBCheck is properly set up in the project root.

2. **XML/XHTML Validation Errors**: If validation fails after optimization, try running the fix script manually:

   ```
   pnpm fix
   ```

3. **Missing Dependencies**: If you get module not found errors, ensure you've run `pnpm install` or `npm install`.

4. **Large Files**: For very large EPUB files, you might need to increase Node.js memory:
   ```
   NODE_OPTIONS=--max-old-space-size=4096 pnpm build
   ```

### Getting Help

If you encounter issues not covered in this documentation, please [open an issue](https://github.com/kiki-le-singe/epub-optimizer/issues) on the project repository.

## Dependencies

- archiver - For creating compressed archives
- cheerio - For robust HTML/XHTML DOM manipulation
- clean-css - For CSS minification
- fs-extra - Enhanced file system operations
- html-minifier-terser - For HTML minification
- sharp - For image optimization (JPEG, PNG, WebP, GIF, AVIF, SVG)
- unzipper - For extracting EPUB files
- yargs - For command-line argument parsing
- epubcheck - For EPUB validation (external dependency)
- @biomejs/biome - For linting and formatting (dev dependency)

## License

MIT
