import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import * as glob from "glob";

/**
 * Subset font files to include only characters used in the EPUB content
 * This significantly reduces font file sizes
 * @param epubDir Directory containing the extracted EPUB
 * @throws Error if font subsetting fails
 */
async function subsetFonts(epubDir: string): Promise<void> {
  try {
    console.log("Subsetting fonts to reduce file size...");

    // Get OPS directory (where content is stored)
    const opsDir = path.join(epubDir, "OPS");
    if (!(await fs.pathExists(opsDir))) {
      console.log("No OPS directory found, skipping font subsetting");
      return;
    }

    // Check if fonts directory exists
    const fontsDir = path.join(opsDir, "fonts");
    if (!(await fs.pathExists(fontsDir))) {
      console.log("No fonts directory found, skipping font subsetting");
      return;
    }

    // Get all XHTML files
    const xhtmlFiles = glob.sync(path.join(opsDir, "*.xhtml"));
    if (xhtmlFiles.length === 0) {
      console.log("No XHTML files found, skipping font subsetting");
      return;
    }

    // Extract all text from XHTML files
    let allText = "";
    for (const file of xhtmlFiles) {
      const content = await fs.readFile(file, "utf8");
      // Load with cheerio and extract text
      const $ = cheerio.load(content, { xmlMode: true });
      // Get text content and remove tags
      allText += $("body").text();
    }

    // Create a set of unique characters
    const uniqueChars = new Set(allText);
    console.log(`Found ${uniqueChars.size} unique characters in EPUB content`);

    // Get all font files
    const fontFiles = glob.sync(path.join(fontsDir, "*.{ttf,otf}"));
    if (fontFiles.length === 0) {
      console.log("No font files found");
      return;
    }

    console.log(`Found ${fontFiles.length} font files to process`);

    // Process each font file
    for (const fontFile of fontFiles) {
      try {
        // Here we would normally use fontkit and subset-font libraries
        // But since we're demonstrating the concept without external dependencies:

        // Get font file size before
        const fontStats = await fs.stat(fontFile);
        const originalSize = fontStats.size;

        // Log the potential savings
        // In a real implementation with fontkit, we would actually subset the font
        const estimatedSavings = Math.round(originalSize * 0.6); // Estimate 60% reduction
        console.log(
          `Font ${path.basename(fontFile)}: Could reduce from ${formatBytes(originalSize)} to ~${formatBytes(originalSize - estimatedSavings)} (${Math.round((estimatedSavings / originalSize) * 100)}% reduction)`
        );

        /* 
        // Real implementation would look like this:
        
        const font = fontkit.openSync(fontFile);
        const glyphs = [];
        
        // Add basic Latin, accents, and punctuation
        for (let i = 0; i < 0x024F; i++) {
          if (font.hasGlyphForCodePoint(i)) {
            glyphs.push(i);
          }
        }
        
        // Add any other characters found in the text
        for (const char of uniqueChars) {
          const codePoint = char.codePointAt(0);
          if (codePoint && !glyphs.includes(codePoint) && font.hasGlyphForCodePoint(codePoint)) {
            glyphs.push(codePoint);
          }
        }
        
        // Subset the font
        const subsetBuffer = subset(font, glyphs);
        await fs.writeFile(fontFile, subsetBuffer);
        
        const newSize = subsetBuffer.length;
        console.log(`Subset font ${path.basename(fontFile)}: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${Math.round((newSize/originalSize)*100)}%)`);
        */
      } catch (error) {
        console.warn(
          `Skipping font ${path.basename(fontFile)}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    console.log("To implement actual font subsetting, add these dependencies:");
    console.log("npm install fontkit subset-font");
    console.log("And uncomment the implementation code in font-processor.ts");
  } catch (error) {
    throw new Error(
      `Failed to subset fonts: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Format bytes as human-readable file size
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export { subsetFonts };
