// This script fixes the span tags in the XHTML files.
// It is used to fix the span tags in the XHTML files after the book is built.
// There were some issues like <span> tags that were not closed.

import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import config from "../../src/utils/config.ts";

// Get the extraction directory from config
const extractedDir = path.join(process.cwd(), config.tempDir);
const opsDir = path.join(extractedDir, "OPS");

// Verify the directory exists
if (!fs.existsSync(extractedDir)) {
  console.error(`Error: Directory ${extractedDir} does not exist.`);
  console.error(
    "Please run the optimization script first to extract the EPUB."
  );
  process.exit(1);
}

if (!fs.existsSync(opsDir)) {
  console.error(`Error: Directory ${opsDir} does not exist.`);
  console.error("Please make sure the extracted EPUB has an OPS directory.");
  process.exit(1);
}

// Get all chapter XHTML files
const xhtmlFiles: string[] = fs
  .readdirSync(opsDir)
  .filter((file: string) => file.endsWith(".xhtml"))
  .map((file: string) => path.join(opsDir, file));

// Fix each file
for (const file of xhtmlFiles) {
  try {
    console.log(`Processing ${file}`);
    const content = fs.readFileSync(file, "utf8");
    // Use cheerio for DOM manipulation
    const $ = cheerio.load(content, { xmlMode: true });
    // Example: fix span tags in h1
    const h1 = $("h1");
    h1.each((_: number, el: cheerio.Element) => {
      const $el = $(el);
      // Fix unclosed/invalid span tags in heading content
      $el.find("span").each((_: number, span: cheerio.Element) => {
        // Example fix: ensure all spans are closed
        // (cheerio auto-closes tags, so just serialize)
      });
    });
    // Serialize back to XML
    const fixed = $.xml();
    fs.writeFileSync(file, fixed);
    console.log(`Fixed ${path.basename(file)}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log("All XHTML files fixed.");
