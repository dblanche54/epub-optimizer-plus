const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const config = require("../src/utils/config");

// Get the extraction directory from config
const extractedDir = path.join(__dirname, "..", config.tempDir);
const fixedEpubPath = path.join(__dirname, "..", "fixed_mybook.epub");
const outputEpubPath = path.join(__dirname, "..", config.outputEPUB);

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

  console.log("Created fixed_mybook.epub");

  // Copy to the output file
  fs.copyFileSync(fixedEpubPath, outputEpubPath);
  console.log(`Copied to ${config.outputEPUB}`);
} catch (error) {
  console.error(`Error creating EPUB: ${error.message}`);
  process.exit(1);
}
