import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import config from "./utils/config";
import type { Args } from "./types";
import fs from "fs-extra";
import path from "path";

// Get package.json information for version and description
const packageJsonPath = path.join(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

/**
 * Parse command line arguments
 * @returns Promise<Args> Parsed CLI options
 */
function parseArguments(): Promise<Args> {
  return Promise.resolve(
    yargs(hideBin(process.argv))
      .usage(`${packageJson.description}\n\nUsage: pnpm build [options]`)
      .option("input", {
        alias: "i",
        describe: "Input EPUB file path",
        type: "string",
        default: config.inputEPUB,
      })
      .option("output", {
        alias: "o",
        describe: "Output EPUB file path",
        type: "string",
        default: config.outputEPUB,
      })
      .option("temp", {
        alias: "t",
        describe: "Temporary directory for processing",
        type: "string",
        default: config.tempDir,
      })
      .option("jpg-quality", {
        describe: "JPEG compression quality (0-100)",
        type: "number",
        default: config.jpegOptions.quality,
      })
      .option("png-quality", {
        describe: "PNG compression quality (0-1 scale, use decimal)",
        type: "array",
        default: config.pngOptions.quality,
      })
      .option("clean", {
        describe: "Clean temporary files after processing",
        type: "boolean",
        default: false,
      })
      .example("pnpm build -i book.epub -o book-optimized.epub", "Basic optimization")
      .example("pnpm build:clean -i book.epub -o book-opt.epub", "Optimize and clean temp files")
      .example("pnpm build -i book.epub -o book-opt.epub --jpg-quality 85", "Higher JPEG quality")
      .example("pnpm build -i book.epub -o book-opt.epub --png-quality 0.9", "Higher PNG quality")
      .example(
        "pnpm build -i input.epub -o output.epub --jpg-quality 85 --png-quality 0.8",
        "Custom image settings"
      )
      .help()
      .alias("help", "h")
      .version(packageJson.version)
      .alias("version", "v").argv as unknown as Args
  );
}

export { parseArguments };
