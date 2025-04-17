import fs from "fs-extra";
import path from "node:path";
import unzipper from "unzipper";
import { execSync } from "node:child_process";

/**
 * Extract EPUB file contents to a temporary directory
 * @param epubPath Path to EPUB file
 * @param extractDir Directory to extract contents to
 */
async function extractEPUB(
  epubPath: string,
  extractDir: string
): Promise<void> {
  // Ensure extract directory exists and is empty
  await fs.remove(extractDir);
  await fs.mkdir(extractDir);

  // Extract EPUB contents
  await fs
    .createReadStream(epubPath)
    .pipe(unzipper.Extract({ path: extractDir }))
    .promise();
}

/**
 * Recompress directory contents into an EPUB file (Apple Books compatible)
 * @param outputPath Path for output EPUB file
 * @param sourceDir Directory containing EPUB contents
 */
async function compressEPUB(
  outputPath: string,
  sourceDir: string
): Promise<boolean> {
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
}

export { extractEPUB, compressEPUB };
