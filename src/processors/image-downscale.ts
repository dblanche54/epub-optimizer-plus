import fs from "fs-extra";
import path from "node:path";
import sharp from "sharp";
import * as glob from "glob";
import { getContentPath } from "../utils/epub-utils.js";

/**
 * Downscale large images in the EPUB images directory
 * @param epubDir Directory containing the extracted EPUB
 * @param maxDim Maximum width or height (default 1600px)
 */
export async function downscaleImages(epubDir: string, maxDim = 1600): Promise<void> {
  try {
    const contentDir = await getContentPath(epubDir);
    const imagesDir = path.join(contentDir, "images");
    if (!(await fs.pathExists(imagesDir))) {
      console.log("No images directory found, skipping image downscaling");
      return;
    }
    const imageFiles = glob.sync(path.join(imagesDir, "*.{jpg,jpeg,png,webp,avif}"));
    if (imageFiles.length === 0) {
      console.log("No images found for downscaling");
      return;
    }
    console.log(`Checking ${imageFiles.length} images for downscaling...`);
    for (const imgFile of imageFiles) {
      try {
        const img = sharp(imgFile);
        const meta = await img.metadata();
        if (!meta.width || !meta.height) continue;
        if (meta.width > maxDim || meta.height > maxDim) {
          const originalSize = (await fs.stat(imgFile)).size;
          await img
            .resize({ width: maxDim, height: maxDim, fit: "inside" })
            .toFile(imgFile + ".tmp");
          await fs.rename(imgFile + ".tmp", imgFile);
          const newSize = (await fs.stat(imgFile)).size;
          console.log(
            `Downscaled ${path.basename(imgFile)}: ${meta.width}x${meta.height} → max ${maxDim}px, ${originalSize} → ${newSize} bytes`
          );
        }
      } catch (error) {
        console.warn(
          `Failed to downscale ${path.basename(imgFile)}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    console.error(
      `Image downscaling failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
