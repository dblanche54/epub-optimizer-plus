#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

// Prepare arguments for subprocess
const args = process.argv.slice(2).join(" ");

// Extract input filename from args for cleanup
let inputFile = "mybook.epub"; // Default value
const inputArg = args.match(/-i\s+([^\s]+)/);
if (inputArg?.[1]) {
  inputFile = inputArg[1];
}
const inputBasename = path.basename(inputFile, ".epub");
const fixedFile = `fixed_${inputBasename}.epub`;

try {
  console.log(`Running optimize with arguments: ${args}`);
  execSync(`KEEP_TEMP=true node optimize-epub.js ${args}`, {
    stdio: "inherit",
  });

  console.log("Running fix scripts");
  execSync("node scripts/fix_span_tags.js", { stdio: "inherit" });
  execSync("node scripts/fix_xml.js", { stdio: "inherit" });

  console.log(`Creating EPUB with arguments: ${args}`);
  execSync(`node scripts/create_epub.js ${args}`, { stdio: "inherit" });

  console.log(`Validating EPUB with arguments: ${args}`);
  execSync(`node scripts/validate_epub.js ${args}`, { stdio: "inherit" });

  console.log("Cleaning up temporary files");
  execSync(`rm -rf temp_epub ${fixedFile}`, { stdio: "inherit" });

  console.log("All done!");
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
