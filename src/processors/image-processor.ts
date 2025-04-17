import fs from "fs-extra";
import path from "node:path";
import sharp from "sharp";
// Using dynamic imports for all imagemin-related modules
import config from "../utils/config.ts";

/**
 * Optimize images in a directory recursively
 * @param dir Directory containing images
 */
async function optimizeImages(dir: string): Promise<void> {
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
}

/**
 * Compress a single image using Sharp
 * @param imagePath Path to image file
 */
async function compressImage(imagePath: string): Promise<void> {
  try {
    const extension = path.extname(imagePath).toLowerCase();
    const imageBuffer = await fs.readFile(imagePath);
    let processedImage = sharp(imageBuffer);

    // Get image metadata
    const metadata = await processedImage.metadata();

    // Skip if image is already small (less than 10KB)
    if (imageBuffer.length < 10 * 1024) {
      console.log(`⏩ Skipping small image: ${path.basename(imagePath)}`);
      return;
    }

    // Process based on file type
    switch (extension) {
      case ".jpg":
      case ".jpeg":
        processedImage = processedImage.jpeg({
          quality: config.jpegOptions.quality,
          mozjpeg: true,
        });
        break;

      case ".png":
        processedImage = processedImage.png({
          quality: Math.round(config.pngOptions.quality[0] * 100),
          compressionLevel: 9,
          palette: true,
        });
        break;

      case ".webp":
        processedImage = processedImage.webp({
          quality: config.jpegOptions.quality,
          lossless: false,
        });
        break;

      case ".gif":
        processedImage = processedImage.gif();
        break;

      case ".avif":
        processedImage = processedImage.avif({
          quality: config.jpegOptions.quality,
        });
        break;

      case ".svg":
        // Simply return for SVG files - they're already text/XML
        return;

      default:
        // Unknown format, skip processing
        return;
    }

    // Write optimized image back to the same path
    await processedImage.toFile(imagePath + ".tmp");
    await fs.rename(imagePath + ".tmp", imagePath);

    // Log optimization result
    const newSize = (await fs.stat(imagePath)).size;
    const savings = (
      ((imageBuffer.length - newSize) / imageBuffer.length) *
      100
    ).toFixed(1);
    if (newSize < imageBuffer.length) {
      console.log(
        `💾 Optimized ${path.basename(imagePath)}: ${savings}% smaller`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `⚠️ Error processing ${path.basename(imagePath)}: ${error.message}`
      );
    } else {
      console.error(
        `⚠️ Unknown error processing ${path.basename(imagePath)}`,
        error
      );
    }
  }
}

export { optimizeImages };
