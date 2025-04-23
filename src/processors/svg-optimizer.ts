import fs from "fs-extra";
import path from "node:path";
import * as glob from "glob";
import { optimize as svgoOptimize } from "svgo";

/**
 * Optimize SVG files in the EPUB images directory
 * @param epubDir Directory containing the extracted EPUB
 */
export async function optimizeSVGs(epubDir: string): Promise<void> {
  try {
    const opsDir = path.join(epubDir, "OPS");
    const imagesDir = path.join(opsDir, "images");
    if (!(await fs.pathExists(imagesDir))) {
      console.log("No images directory found, skipping SVG optimization");
      return;
    }
    const svgFiles = glob.sync(path.join(imagesDir, "*.svg"));
    if (svgFiles.length === 0) {
      console.log("No SVG files found");
      return;
    }
    console.log(`Optimizing ${svgFiles.length} SVG files...`);
    for (const svgFile of svgFiles) {
      try {
        const original = await fs.readFile(svgFile, "utf8");
        const result = svgoOptimize(original, { multipass: true });
        if (result.data && result.data.length < original.length) {
          await fs.writeFile(svgFile, result.data);
          console.log(
            `Optimized ${path.basename(svgFile)}: ${original.length} → ${result.data.length} bytes`
          );
        } else {
          console.log(`No optimization for ${path.basename(svgFile)}`);
        }
      } catch (error) {
        console.warn(
          `Failed to optimize ${path.basename(svgFile)}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    console.error(
      `SVG optimization failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
