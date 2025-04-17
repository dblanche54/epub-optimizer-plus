#!/usr/bin/env ts-node

import { execSync } from "node:child_process";
import path from "node:path";

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
  execSync(`KEEP_TEMP=true ts-node optimize-epub.ts ${args}`, {
    stdio: "inherit",
  });

  console.log("Running fix scripts");
  execSync("ts-node scripts/fix/index.ts", { stdio: "inherit" });

  console.log("Running OPF update script");
  execSync("ts-node scripts/opf/update-opf.ts", { stdio: "inherit" });

  console.log(`Creating EPUB with arguments: ${args}`);
  execSync(`ts-node scripts/create-epub.ts ${args}`, { stdio: "inherit" });

  console.log(`Validating EPUB with arguments: ${args}`);
  execSync(`ts-node scripts/validate-epub.ts ${args}`, { stdio: "inherit" });

  console.log("Cleaning up temporary files");
  execSync(`rm -rf temp_epub ${fixedFile}`, { stdio: "inherit" });

  console.log("All done!");
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("Unknown error", error);
  }
  process.exit(1);
}
