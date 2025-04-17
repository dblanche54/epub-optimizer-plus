import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import config from "./utils/config.ts";
import type { Args } from "./types.ts";

/**
 * Parse command line arguments
 * @returns Promise<Args> Parsed CLI options
 */
function parseArguments(): Promise<Args> {
  return Promise.resolve(
    yargs(hideBin(process.argv))
      .usage("Usage: $0 [options]")
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
      .option("keep-temp", {
        alias: "k",
        describe: "Keep temporary files after processing",
        type: "boolean",
        default: false,
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
      .example(
        "$0 -i book.epub -o book-optimized.epub",
        "Optimize a specific EPUB file"
      )
      .help()
      .alias("help", "h")
      .version()
      .alias("version", "v")
      .epilog(
        "For more information visit https://github.com/kiki-le-singe/epub-optimizer"
      ).argv as unknown as Args
  );
}

export { parseArguments };
