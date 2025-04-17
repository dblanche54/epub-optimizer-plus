import fs from "fs-extra";
import path from "node:path";
import { minify } from "html-minifier-terser";
import CleanCSS from "clean-css";
import * as cheerio from "cheerio";
import config from "../utils/config.ts";

/**
 * Process HTML and CSS files in a directory
 * @param dir Directory to process
 */
async function processHTML(dir: string): Promise<void> {
  const entries = await fs.readdir(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await processHTML(fullPath);
    } else if (entry.endsWith(".xhtml") || entry.endsWith(".html")) {
      await minifyHTML(fullPath);
    } else if (entry.endsWith(".css")) {
      await minifyCSS(fullPath);
    }
  }
}

/**
 * Minify HTML file using cheerio and html-minifier-terser
 * @param filePath Path to HTML file
 */
async function minifyHTML(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, "utf8");
  // Use cheerio for DOM manipulation (if needed)
  const $ = cheerio.load(content, { xmlMode: filePath.endsWith(".xhtml") });
  // Example: you could manipulate the DOM here if needed
  const domContent = $.html();
  const minified = await minify(domContent, config.htmlOptions);
  await fs.writeFile(filePath, minified);
}

/**
 * Minify CSS file
 * @param filePath Path to CSS file
 */
async function minifyCSS(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, "utf8");
  const minified = new CleanCSS(config.cssOptions).minify(content).styles;
  await fs.writeFile(filePath, minified);
}

export { processHTML };
