#!/usr/bin/env node

const { execSync } = require("child_process");

// Prepare arguments for subprocess
const args = process.argv.slice(2).join(" ");

try {
  console.log(`Running optimize with arguments: ${args}`);
  // Use KEEP_TEMP to keep temporary files during processing
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

  console.log("Build completed successfully!");
  console.log(
    'Note: Temporary files have been kept. Use "pnpm cleanup" to remove them if needed.'
  );
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
