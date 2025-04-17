import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import config from "../src/utils/config.ts";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option("input", {
    alias: "i",
    type: "string",
    description: "Input EPUB file path",
    default: config.inputEPUB,
  })
  .option("output", {
    alias: "o",
    type: "string",
    description: "Output EPUB file path",
    default: config.outputEPUB,
  })
  .help(false)
  .version(false).argv as { input: string; output: string };

// Get the input and output file paths from arguments or default config
const inputEpub = argv.input || config.inputEPUB;
const outputEpub = argv.output || config.outputEPUB;

// Get the basename for creating the fixed file
const inputBasename = path.basename(inputEpub, ".epub");
const fixedEpubName = `fixed_${inputBasename}.epub`;

// Get the extraction directory from config
const extractedDir = path.join(__dirname, "..", config.tempDir);
const fixedEpubPath = path.join(__dirname, "..", fixedEpubName);
const outputEpubPath = path.join(__dirname, "..", outputEpub);

// Verify the directory exists
if (!fs.existsSync(extractedDir)) {
  console.error(`Error: Directory ${extractedDir} does not exist.`);
  console.error(
    "Please run the optimization script first to extract the EPUB."
  );
  process.exit(1);
}

// Always create a new EPUB file after fixing
console.log("Creating new EPUB...");

try {
  // Use execSync instead of exec to ensure it completes before moving on
  // Delete existing fixed EPUB if it exists
  if (fs.existsSync(fixedEpubPath)) {
    fs.unlinkSync(fixedEpubPath);
  }

  // Step 1: Add mimetype first, uncompressed, no extra fields
  console.log("Adding mimetype file...");
  execSync(`cd "${extractedDir}" && zip -X0 "${fixedEpubPath}" mimetype`);

  // Step 2: Add the rest, compressed, excluding mimetype
  console.log("Adding remaining files...");
  execSync(
    `cd "${extractedDir}" && zip -Xr9D "${fixedEpubPath}" . -x mimetype`
  );

  console.log(`Created ${fixedEpubName}`);

  // Copy to the output file
  fs.copyFileSync(fixedEpubPath, outputEpubPath);
  console.log(`Copied to ${outputEpub}`);
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error creating EPUB: ${error.message}`);
  } else {
    console.error("Unknown error creating EPUB", error);
  }
  process.exit(1);
}
