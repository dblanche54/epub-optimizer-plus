import fs from "fs-extra";
import path from "node:path";
import unzipper from "unzipper";
import { execSync } from "node:child_process";

/**
 * Extract EPUB file contents to a temporary directory
 * @param epubPath Path to EPUB file
 * @param extractDir Directory to extract contents to
 * @throws Error if extraction fails
 */
async function extractEPUB(
  epubPath: string,
  extractDir: string
): Promise<void> {
  try {
    // Ensure extract directory exists and is empty
    await fs.remove(extractDir);
    await fs.mkdir(extractDir);

    // Extract EPUB contents
    await fs
      .createReadStream(epubPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .promise();
  } catch (error) {
    throw new Error(
      `Failed to extract EPUB: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Recompress directory contents into an EPUB file (Apple Books compatible)
 * EPUB requires specific compression:
 * 1. mimetype file must be first, uncompressed, with no extra fields
 * 2. All other files should be compressed normally
 *
 * @param outputPath Path for output EPUB file
 * @param sourceDir Directory containing EPUB contents
 * @returns True if compression succeeded
 * @throws Error if compression fails
 */
async function compressEPUB(
  outputPath: string,
  sourceDir: string
): Promise<boolean> {
  try {
    const absOutput = path.resolve(outputPath);
    const absSource = path.resolve(sourceDir);

    // Ensure mimetype exists and is correct
    const mimetypePath = path.join(absSource, "mimetype");
    await fs.writeFile(mimetypePath, "application/epub+zip");

    // Remove output if exists
    if (await fs.pathExists(absOutput)) await fs.unlink(absOutput);

    // Step 1: Add mimetype first, uncompressed, no extra fields
    execSync(`cd "${absSource}" && zip -X0 "${absOutput}" mimetype`);

    // Step 2: Add the rest, compressed, excluding mimetype
    execSync(`cd "${absSource}" && zip -Xr9D "${absOutput}" . -x mimetype`);

    return true;
  } catch (error) {
    throw new Error(
      `Failed to compress EPUB: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export { extractEPUB, compressEPUB };
