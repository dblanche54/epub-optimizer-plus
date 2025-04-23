import fs from "fs-extra";
import { parseArguments } from "./cli.js";
import { extractEPUB, compressEPUB } from "./processors/archive-processor.js";
import { processHTML } from "./processors/html-processor.js";
import { optimizeImages } from "./processors/image-processor.js";
import type { Args } from "./types.js";
import { subsetFonts } from "./processors/font-processor.js";
import { convertPngToJpeg } from "./processors/image-converter.js";
import { minifyJavaScript } from "./processors/js-processor.js";

/**
 * Main function to optimize an EPUB file
 * Extracts the EPUB, processes its contents, and repackages it
 * @returns Promise resolving to an object containing the operation result
 */
async function optimizeEPUB(): Promise<{ success: boolean; input: string; output: string }> {
  // Parse command line arguments
  const args = (await parseArguments()) as Args;

  try {
    // Validate inputs
    if (!(await fs.pathExists(args.input))) {
      throw new Error(`Input file not found: ${args.input}`);
    }

    // Create parent directory for output if it doesn't exist
    const outputDir = args.output.split("/").slice(0, -1).join("/");
    if (outputDir) {
      await fs.ensureDir(outputDir);
    }

    // 1. Extract EPUB file
    await extractEPUB(args.input, args.temp);
    console.log(`📦 Extracted ${args.input} to ${args.temp}`);

    // 2. Process HTML and CSS files
    await processHTML(args.temp);
    console.log("🔄 Optimized HTML/CSS files");

    // 3. Minify JavaScript
    await minifyJavaScript(args.temp);
    console.log("🔄 Minified JavaScript files");

    // 4. Convert PNG to JPEG where appropriate
    await convertPngToJpeg(args.temp, args.jpgQuality);
    console.log("🖼️  Converted PNG to JPEG");

    // 5. Optimize images
    await optimizeImages(args.temp);
    console.log("🖼️  Optimized image files");

    // 6. Subset fonts
    await subsetFonts(args.temp);
    console.log("🔤 Subset fonts");

    // 7. Recompress as EPUB
    await compressEPUB(args.output, args.temp);
    console.log(`✅ Created optimized EPUB: ${args.output}`);

    // 8. Clean up temporary files if needed
    if (args.clean) {
      await fs.remove(args.temp);
      console.log(`🧹 Removed temporary directory: ${args.temp}`);
    } else {
      console.log(`📁 Kept temporary directory: ${args.temp} for inspection`);
    }

    // Report file size comparison
    await reportFileSizeComparison(args.input, args.output);

    return { success: true, input: args.input, output: args.output };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ Unknown error", error);
    }

    // Only exit the process in a non-test environment
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }

    throw error;
  }
}

/**
 * Compare and report original vs optimized file sizes
 * @param originalPath Path to original file
 * @param optimizedPath Path to optimized file
 */
async function reportFileSizeComparison(
  originalPath: string,
  optimizedPath: string
): Promise<void> {
  try {
    const originalSize = (await fs.stat(originalPath)).size;
    const optimizedSize = (await fs.stat(optimizedPath)).size;
    const reduction = ((originalSize - optimizedSize) / originalSize) * 100;
    const bytesSaved = originalSize - optimizedSize;

    console.log(`
📊 File Size Comparison:
   Original: ${formatFileSize(originalSize)}
   Optimized: ${formatFileSize(optimizedSize)}
   Reduction: ${reduction.toFixed(2)}% (${formatFileSize(bytesSaved)} saved)
    `);
  } catch {
    console.error("⚠️ Could not generate file size comparison");
  }
}

/**
 * Format file size in human readable format
 * @param bytes File size in bytes
 * @returns Formatted file size
 */
function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Run the optimizer only if this file is executed directly (not imported in tests)
if (process.env.NODE_ENV !== "test") {
  optimizeEPUB().catch((error) => {
    if (error instanceof Error) {
      console.error(`❌ Unhandled error: ${error.message}`);
    } else {
      console.error("❌ Unhandled unknown error", error);
    }
    process.exit(1);
  });
}

export { formatFileSize, reportFileSizeComparison, optimizeEPUB };
