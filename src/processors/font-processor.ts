import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import * as glob from "glob";
import * as fontkit from "fontkit";
import subsetFont from "subset-font";
import { getContentPath } from "../utils/epub-utils.js";

/**
 * Subset font files to include only characters used in the EPUB content
 * This significantly reduces font file sizes
 * @param epubDir Directory containing the extracted EPUB
 * @throws Error if font subsetting fails
 */
async function subsetFonts(epubDir: string): Promise<void> {
  try {
    console.log("Subsetting fonts to reduce file size...");

    // Get content directory (OPS, OEBPS, or root)
    const contentDir = await getContentPath(epubDir);
    if (!(await fs.pathExists(contentDir))) {
      console.log("Content directory not found, skipping font subsetting");
      return;
    }

    // Check if fonts directory exists
    const fontsDir = path.join(contentDir, "fonts");
    if (!(await fs.pathExists(fontsDir))) {
      console.log("No fonts directory found, skipping font subsetting");
      return;
    }

    // Get all XHTML files
    const xhtmlFiles = glob.sync(path.join(contentDir, "*.xhtml"));
    if (xhtmlFiles.length === 0) {
      console.log("No XHTML files found, skipping font subsetting");
      return;
    }

    // Extract all text from XHTML files
    let allText = "";
    for (const file of xhtmlFiles) {
      const content = await fs.readFile(file, "utf8");
      const $ = cheerio.load(content, { xmlMode: true });
      allText += $("body").text();
    }

    // Create a set of unique characters
    const uniqueChars = new Set(allText);
    const uniqueCharsString = Array.from(uniqueChars).join("");
    console.log(`Found ${uniqueChars.size} unique characters in EPUB content`);

    // Get all font files
    const fontFiles = glob.sync(path.join(fontsDir, "*.{ttf,otf}"));
    if (fontFiles.length === 0) {
      console.log("No font files found");
      return;
    }

    console.log(`Found ${fontFiles.length} font files to process`);

    // Minimal interface for font objects with hasGlyphForCodePoint
    interface FontLike {
      hasGlyphForCodePoint: (codePoint: number) => boolean;
    }

    function isFontLike(obj: unknown): obj is FontLike {
      return (
        typeof obj === "object" &&
        obj !== null &&
        typeof (obj as { hasGlyphForCodePoint?: unknown }).hasGlyphForCodePoint === "function"
      );
    }

    // Process each font file
    for (const fontFile of fontFiles) {
      try {
        const fontBuffer = await fs.readFile(fontFile);
        let font: unknown = fontkit.create(fontBuffer);
        // If it's a collection, use the first font
        if (Array.isArray((font as { fonts?: unknown[] }).fonts)) {
          font = (font as { fonts: unknown[] }).fonts[0];
        }
        // Only keep characters that are present in the font
        const charsToKeep = Array.from(uniqueCharsString)
          .filter((char) => {
            return isFontLike(font) && font.hasGlyphForCodePoint(char.codePointAt(0) ?? 0);
          })
          .join("");
        // Subset the font
        const subsetBuffer = await subsetFont(fontBuffer, charsToKeep);
        const originalSize = fontBuffer.length;
        const newSize = subsetBuffer.length;
        await fs.writeFile(fontFile, subsetBuffer);
        console.log(
          `Subset font ${path.basename(fontFile)}: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${Math.round((1 - newSize / originalSize) * 100)}% smaller)`
        );
      } catch (error) {
        console.warn(
          `Skipping font ${path.basename(fontFile)}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
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
