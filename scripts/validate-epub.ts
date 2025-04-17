import { spawnSync } from "node:child_process";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import config from "../src/utils/config.ts";
import path from "node:path";

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option("output", {
    alias: "o",
    type: "string",
    description: "Output EPUB file path",
    default: config.outputEPUB,
  })
  .help(false)
  .version(false).argv as { output: string };

const outputEpub = argv.output || config.outputEPUB;
const epubcheckPath = path.resolve(config.epubcheckPath);

if (!outputEpub) {
  console.error("No output EPUB file specified.");
  process.exit(1);
}

console.log(`Validating EPUB: ${outputEpub}`);

try {
  const result = spawnSync("java", ["-jar", epubcheckPath, outputEpub], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error("EPUB validation failed.");
    process.exit(result.status || 1);
  } else {
    console.log("EPUB validation passed.");
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error validating EPUB: ${error.message}`);
  } else {
    console.error("Unknown error validating EPUB", error);
  }
  process.exit(1);
}
