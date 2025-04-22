import { execSync } from "node:child_process";
import path from "node:path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import config from "../utils/config.js";

/**
 * Defines the shape of args returned by parseArgs
 */
export interface CommandArgs {
  input?: string;
  output?: string;
  [key: string]: unknown;
}

/**
 * Info about the input file
 */
export interface InputFileInfo {
  inputFile: string;
  inputBasename: string;
  args: string;
}

/**
 * Parse command line arguments consistently across all scripts
 * @param includeInputOption Whether to include input option
 * @param includeOutputOption Whether to include output option
 * @returns Parsed args object
 */
export function parseArgs(includeInputOption = true, includeOutputOption = true): CommandArgs {
  const parser = yargs(hideBin(process.argv));

  if (includeInputOption) {
    parser.option("input", {
      alias: "i",
      type: "string",
      description: "Input EPUB file path",
      default: config.inputEPUB,
    });
  }

  if (includeOutputOption) {
    parser.option("output", {
      alias: "o",
      type: "string",
      description: "Output EPUB file path",
      default: config.outputEPUB,
    });
  }

  return parser.help(false).version(false).argv as unknown as CommandArgs;
}

/**
 * Get input file name from command line args
 * @returns Input file name and basename
 */
export function getInputFileInfo(): InputFileInfo {
  const args = process.argv.slice(2).join(" ");
  let inputFile = config.inputEPUB; // Default value
  const inputArg = args.match(/-i\s+([^\s]+)/);
  if (inputArg?.[1]) {
    inputFile = inputArg[1];
  }
  const inputBasename = path.basename(inputFile, ".epub");

  return { inputFile, inputBasename, args };
}

/**
 * Standard error handler for scripts
 * @param error The error to handle
 */
export function handleError(error: unknown): never {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("Unknown error", error);
  }
  process.exit(1);
}

/**
 * Run a command with proper error handling
 * @param command The command to run
 * @param options Options for the command
 */
export function runCommand(command: string, options = { stdio: "inherit" as const }): void {
  try {
    execSync(command, options);
  } catch (error) {
    handleError(error);
  }
}
