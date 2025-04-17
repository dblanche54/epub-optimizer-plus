#!/usr/bin/env ts-node

import { getInputFileInfo, handleError, runCommand } from "./utils.ts";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

// Parse command options including clean flag
const argv = yargs(hideBin(process.argv))
  .option("clean", {
    type: "boolean",
    description: "Clean temporary files after build",
    default: false,
  })
  .help(false)
  .version(false).argv as { clean: boolean };

// Get input file info and args
const { inputFile, fixedFile, args } = getInputFileInfo();

try {
  console.log(`Running optimize with arguments: ${args}`);
  runCommand(`KEEP_TEMP=true ts-node optimize-epub.ts ${args}`);

  console.log("Running fix scripts");
  runCommand("ts-node scripts/fix/index.ts");

  console.log("Running OPF update script");
  runCommand("ts-node scripts/opf/update-opf.ts");

  console.log(`Creating EPUB with arguments: ${args}`);
  runCommand(`ts-node scripts/create-epub.ts ${args}`);

  console.log(`Validating EPUB with arguments: ${args}`);
  runCommand(`ts-node scripts/validate-epub.ts ${args}`);

  if (argv.clean) {
    console.log("Cleaning up temporary files");
    runCommand(`rm -rf temp_epub ${fixedFile}`);
    console.log("All done!");
  } else {
    console.log("Build completed successfully!");
    console.log(
      'Note: Temporary files have been kept. Use "pnpm cleanup" or run with --clean flag to remove them.'
    );
  }
} catch (error) {
  handleError(error);
}
