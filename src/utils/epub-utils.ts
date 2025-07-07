import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";

/**
 * Dynamically reads the OPF file path from META-INF/container.xml
 * This follows the EPUB specification instead of hardcoding filenames
 * @param epubDir Path to the extracted EPUB directory
 * @returns Full path to the OPF file
 * @throws Error if container.xml is not found or OPF path cannot be determined
 */
export async function getOPFPath(epubDir: string): Promise<string> {
  const containerPath = path.join(epubDir, "META-INF", "container.xml");

  if (!(await fs.pathExists(containerPath))) {
    throw new Error(`Container file not found: ${containerPath}`);
  }

  try {
    const content = await fs.readFile(containerPath, "utf8");
    const $ = cheerio.load(content, { xmlMode: true });

    const opfPath = $("rootfile").attr("full-path");

    if (!opfPath) {
      throw new Error("OPF path not found in container.xml rootfile element");
    }

    const fullOpfPath = path.join(epubDir, opfPath);

    // Verify the OPF file actually exists
    if (!(await fs.pathExists(fullOpfPath))) {
      throw new Error(`OPF file not found at path: ${fullOpfPath}`);
    }

    return fullOpfPath;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse container.xml: ${error.message}`);
    }
    throw new Error("Unknown error parsing container.xml");
  }
}

/**
 * Gets the OPS directory path (common EPUB content directory)
 * Falls back to the EPUB root if OPS doesn't exist
 * @param epubDir Path to the extracted EPUB directory
 * @returns Path to the content directory
 */
export async function getContentDir(epubDir: string): Promise<string> {
  const opsDir = path.join(epubDir, "OPS");

  if (await fs.pathExists(opsDir)) {
    return opsDir;
  }

  // Some EPUBs don't use OPS directory, content might be in root
  return epubDir;
}

/**
 * Helper to safely read and parse an OPF file
 * @param opfPath Full path to the OPF file
 * @returns Cheerio instance with parsed OPF content
 */
export async function parseOPF(opfPath: string): Promise<cheerio.CheerioAPI> {
  const content = await fs.readFile(opfPath, "utf8");
  return cheerio.load(content, { xmlMode: true });
}
