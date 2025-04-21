import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import config from "../src/utils/config";
import { parseArgs, handleError } from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const argv = parseArgs(true, true);

// Get the output file path from arguments or default config
const outputEpub = argv.output || config.outputEPUB;

// Get the extraction directory from config
const extractedDir = path.join(__dirname, "..", config.tempDir);
const outputEpubPath = path.join(__dirname, "..", outputEpub);

// Verify the directory exists
if (!fs.existsSync(extractedDir)) {
  console.error(`Error: Directory ${extractedDir} does not exist.`);
  console.error("Please run the optimization script first to extract the EPUB.");
  process.exit(1);
}

// Create a new EPUB file
console.log("Creating new EPUB...");

try {
  // Delete existing output EPUB if it exists
  if (fs.existsSync(outputEpubPath)) {
    fs.unlinkSync(outputEpubPath);
  }

  // Step 1: Add mimetype first, uncompressed, no extra fields
  console.log("Adding mimetype file...");
  execSync(`cd "${extractedDir}" && zip -X0 "${outputEpubPath}" mimetype`);

  // Step 2: Add the rest, compressed, excluding mimetype
  console.log("Adding remaining files...");
  execSync(`cd "${extractedDir}" && zip -Xr9D "${outputEpubPath}" . -x mimetype`);

  console.log(`Created optimized EPUB: ${outputEpub}`);
} catch (error) {
  handleError(error);
}
