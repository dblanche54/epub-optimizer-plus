import { spawnSync } from "node:child_process";
import path from "node:path";
import config from "../utils/config.js";
import { parseArgs, handleError } from "./utils.js";

// Parse command line arguments
const argv = parseArgs(false, true);

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
  handleError(error);
}
