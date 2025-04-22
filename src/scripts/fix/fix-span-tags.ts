// This script fixes the span tags in the XHTML files after the book is built.
// There were some issues like <span> tags that were not closed.

import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import config from "../../utils/config.js";

// Use the project root directory for file paths
const projectRoot = process.cwd();
const extractedDir = path.join(projectRoot, config.tempDir);
const opsDir = path.join(extractedDir, "OPS");

async function main() {
  // Verify the directories exist
  if (!(await fs.pathExists(extractedDir))) {
    console.error(`Error: Directory ${extractedDir} does not exist.`);
    console.error("Please run the optimization script first to extract the EPUB.");
    process.exit(1);
  }

  if (!(await fs.pathExists(opsDir))) {
    console.error(`Error: Directory ${opsDir} does not exist.`);
    console.error("Please make sure the extracted EPUB has an OPS directory.");
    process.exit(1);
  }

  // Get all chapter XHTML files
  const files = (await fs.readdir(opsDir))
    .filter((file) => file.endsWith(".xhtml"))
    .map((file) => path.join(opsDir, file));

  for (const file of files) {
    await fixFile(file);
  }

  console.log("All XHTML files fixed.");
}

async function fixFile(file: string) {
  try {
    console.log(`Processing ${file}`);
    const content = await fs.readFile(file, "utf8");
    const $ = cheerio.load(content, { xmlMode: true });
    // Cheerio auto-closes tags on serialization
    const fixed = $.xml();
    await fs.writeFile(file, fixed);
    console.log(`Fixed ${path.basename(file)}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

// Use void operator to explicitly mark the promise as intentionally not awaited
void main();
