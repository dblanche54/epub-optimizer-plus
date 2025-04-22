import fs from "fs-extra";
import path from "node:path";
import sharp from "sharp";
// Using dynamic imports for all imagemin-related modules
import config from "../utils/config.js";
import { parseArguments } from "../cli.js";

// Store quality values from command line or config
let jpegQuality = config.jpegOptions.quality; // Default value
let pngQuality = config.pngOptions.quality; // Default value

/**
 * Optimize images in a directory recursively
 * @param dir Directory containing images
 */
async function optimizeImages(dir: string): Promise<void> {
  try {
    // Get command line arguments to check for custom quality settings
    const args = await parseArguments();

    // If jpg-quality parameter was provided, use it
    if (args["jpg-quality"] && typeof args["jpg-quality"] === "number") {
      jpegQuality = args["jpg-quality"];
      console.log(`Using custom JPEG quality: ${jpegQuality}`);
    }

    // If png-quality parameter was provided, use it
    if (
      args["png-quality"] &&
      Array.isArray(args["png-quality"]) &&
      args["png-quality"].length > 0
    ) {
      pngQuality = args["png-quality"].map((val) => parseFloat(val.toString()));
      console.log(`Using custom PNG quality: ${pngQuality.join(", ")}`);
    }

    const entries = await fs.readdir(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await optimizeImages(fullPath);
      } else if (/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(entry)) {
        await compressImage(fullPath);
      }
    }
  } catch (error) {
    console.error(
      `Error processing directory ${dir}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Compress a single image using Sharp
 * @param imagePath Path to image file
 */
async function compressImage(imagePath: string): Promise<void> {
  const filename = path.basename(imagePath);

  try {
    const extension = path.extname(imagePath).toLowerCase();
    const imageBuffer = await fs.readFile(imagePath);

    // Skip if image is already small (less than 10KB)
    if (imageBuffer.length < 10 * 1024) {
      console.log(`⏩ Skipping small image: ${filename}`);
      return;
    }

    // Skip SVG files as they're already text/XML
    if (extension === ".svg") {
      return;
    }

    let processedImage = sharp(imageBuffer);
    // Use the first value from the PNG quality array (0-1 scale) and convert to 0-100 scale
    const pngQualityValue = Math.round(pngQuality[0] * 100);

    // Configure compression based on file type
    switch (extension) {
      case ".jpg":
      case ".jpeg":
        processedImage = processedImage.jpeg({
          quality: jpegQuality, // Use jpegQuality from CLI args or config
          mozjpeg: true,
        });
        break;

      case ".png":
        processedImage = processedImage.png({
          quality: pngQualityValue,
          compressionLevel: 9,
          palette: true,
        });
        break;

      case ".webp":
        processedImage = processedImage.webp({
          quality: jpegQuality, // Use jpegQuality from CLI args or config
          lossless: false,
        });
        break;

      case ".gif":
        processedImage = processedImage.gif();
        break;

      case ".avif":
        processedImage = processedImage.avif({
          quality: jpegQuality, // Use jpegQuality from CLI args or config
        });
        break;

      default:
        // Unknown format, skip processing
        return;
    }

    // Write optimized image back to the same path
    const tempPath = `${imagePath}.tmp`;
    await processedImage.toFile(tempPath);
    await fs.rename(tempPath, imagePath);

    // Log optimization result
    const newSize = (await fs.stat(imagePath)).size;
    const savings = (((imageBuffer.length - newSize) / imageBuffer.length) * 100).toFixed(1);

    if (newSize < imageBuffer.length) {
      console.log(`💾 Optimized ${filename}: ${savings}% smaller`);
    }
  } catch (error) {
    console.error(
      `⚠️ Error processing ${filename}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export { optimizeImages };
