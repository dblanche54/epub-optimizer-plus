#!/usr/bin/env ts-node

import { execSync } from "node:child_process";

// Prepare arguments for subprocess
const args = process.argv.slice(2).join(" ");

try {
  console.log(`Running optimize with arguments: ${args}`);
  // Use KEEP_TEMP to keep temporary files during processing
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

  console.log("Build completed successfully!");
  console.log(
    'Note: Temporary files have been kept. Use "pnpm cleanup" to remove them if needed.'
  );
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("Unknown error", error);
  }
  process.exit(1);
}
