const fs = require("fs-extra");
const { parseArguments } = require("./cli");
const { extractEPUB, compressEPUB } = require("./processors/archive-processor");
const { processHTML } = require("./processors/html-processor");
const { optimizeImages } = require("./processors/image-processor");

/**
 * Main function to optimize an EPUB file
 */
async function optimizeEPUB() {
  // Parse command line arguments
  const args = parseArguments();

  try {
    // 1. Extract EPUB file
    await extractEPUB(args.input, args.temp);
    console.log(`📦 Extracted ${args.input} to ${args.temp}`);

    // 2. Process HTML and CSS files
    await processHTML(args.temp);
    console.log("🔄 Optimized HTML/CSS files");

    // 3. Optimize images
    await optimizeImages(args.temp);
    console.log("🖼️  Optimized image files");

    // 4. Recompress as EPUB
    await compressEPUB(args.output, args.temp);
    console.log(`✅ Created optimized EPUB: ${args.output}`);

    // 5. Clean up temporary files if needed
    if (!args["keep-temp"] && process.env.KEEP_TEMP !== "true") {
      await fs.remove(args.temp);
      console.log(`🧹 Removed temporary directory: ${args.temp}`);
    } else if (args["keep-temp"] || process.env.KEEP_TEMP === "true") {
      console.log(
        `📁 Kept temporary directory: ${args.temp} for post-processing`
      );
    }

    // Report file size difference
    const originalSize = (await fs.stat(args.input)).size;
    const optimizedSize = (await fs.stat(args.output)).size;
    const reduction = (
      ((originalSize - optimizedSize) / originalSize) *
      100
    ).toFixed(2);

    console.log(`
📊 File Size Comparison:
   Original: ${formatFileSize(originalSize)}
   Optimized: ${formatFileSize(optimizedSize)}
   Reduction: ${reduction}% (${formatFileSize(
      originalSize - optimizedSize
    )} saved)
    `);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Run the optimizer
optimizeEPUB().catch((error) => {
  console.error(`❌ Unhandled error: ${error.message}`);
  process.exit(1);
});
