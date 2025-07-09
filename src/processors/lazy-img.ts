import fs from "fs-extra";
import path from "node:path";
import * as glob from "glob";
import * as cheerio from "cheerio";
import { getContentPath } from "../utils/epub-utils.js";

/**
 * Add loading="lazy" to all <img> tags in XHTML files
 * @param epubDir Directory containing the extracted EPUB
 */
export async function addLazyLoadingToImages(epubDir: string): Promise<void> {
  try {
    const contentDir = await getContentPath(epubDir);
    const xhtmlFiles = glob.sync(path.join(contentDir, "*.xhtml"));
    if (xhtmlFiles.length === 0) {
      console.log("No XHTML files found for lazy loading");
      return;
    }
    for (const file of xhtmlFiles) {
      try {
        const content = await fs.readFile(file, "utf8");
        const $ = cheerio.load(content, { xmlMode: true });
        let changed = false;
        $("img").each((_, el) => {
          if (!$(el).attr("loading")) {
            $(el).attr("loading", "lazy");
            changed = true;
          }
        });
        if (changed) {
          await fs.writeFile(file, $.xml());
          console.log(`Added loading="lazy" to images in ${path.basename(file)}`);
        }
      } catch (error) {
        console.warn(
          `Failed to add lazy loading to ${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    console.error(
      `Lazy loading image update failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
