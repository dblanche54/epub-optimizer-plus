// This script fixes the XML/XHTML files.
// It is used to fix the XML/XHTML files after the book is built.
// There were some issues like <br> tags that were not self-closed or invalid tags.

import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import config from "../../utils/config.js";

// Properly format self-closing tags in XML/XHTML files
function fixXml(originalContent: string) {
  // Remove all </br> tags (invalid in XHTML)
  let processedContent = originalContent.replace(/<\/br>/gi, "");
  // Convert all <br> to <br/> (self-closing)
  processedContent = processedContent.replace(/<br(?![a-zA-Z0-9/])/gi, "<br/");

  // Ensure XML declaration is immediately followed by <html>
  processedContent = processedContent.replace(/(<\?xml[^>]+>)[\s\r\n]+<html/, "$1<html");

  // Use cheerio for DOM manipulation
  const $ = cheerio.load(processedContent, { xmlMode: true });

  // Remove all <script> tags (not allowed in EPUB XHTML)
  $("script").remove();

  // Only keep <meta> tags that are direct children of <head>
  $("meta").each(function (this: cheerio.Element, _: number, el: cheerio.Element) {
    const parent = $(el).parent();
    if (!parent.is("head")) {
      $(el).remove();
    }
  });

  // Remove any text nodes that are direct children of <html>
  $("html")
    .contents()
    .filter(function (this: cheerio.Element) {
      return this.type === "text";
    })
    .remove();

  // Remove any text nodes that are direct children of <body>
  $("body")
    .contents()
    .filter(function (this: cheerio.Element) {
      return this.type === "text" && $(this).text().trim().length > 0;
    })
    .remove();

  // Serialize back to XML
  return $.xml();
}

// Get the extraction directory from config
const projectRoot = process.cwd();
const extractedDir = path.join(projectRoot, config.tempDir);
const opsDir = path.join(extractedDir, "OPS");

// Verify the directory exists
if (!fs.existsSync(extractedDir)) {
  console.error(`Error: Directory ${extractedDir} does not exist.`);
  console.error("Please run the optimization script first to extract the EPUB.");
  process.exit(1);
}

if (!fs.existsSync(opsDir)) {
  console.error(`Error: Directory ${opsDir} does not exist.`);
  console.error("Please make sure the extracted EPUB has an OPS directory.");
  process.exit(1);
}

// Get all XHTML files
const xhtmlFiles = fs
  .readdirSync(opsDir)
  .filter((file) => file.endsWith(".xhtml"))
  .map((file) => path.join(opsDir, file));

// Fix each file
for (const file of xhtmlFiles) {
  try {
    console.log(`Processing ${file}`);
    const content = fs.readFileSync(file, "utf8");
    const fixed = fixXml(content);
    fs.writeFileSync(file, fixed);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log("All files processed.");
