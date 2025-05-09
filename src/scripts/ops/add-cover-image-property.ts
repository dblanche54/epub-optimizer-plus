import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import config from "../../utils/config";

// Define paths clearly
const extractedDir = path.join(process.cwd(), config.tempDir);
const opsDir = path.join(extractedDir, "OPS");
const opfFile = path.join(opsDir, "epb.opf");

// Check if OPF file exists before proceeding
if (!fs.existsSync(opfFile)) {
  console.error(`Error: OPF file not found at ${opfFile}`);
  process.exit(1);
}

try {
  console.log(`Adding properties="cover-image" to cover-image item in: ${opfFile}`);

  // Read and parse OPF file
  const content = fs.readFileSync(opfFile, "utf8");
  const $ = cheerio.load(content, { xmlMode: true });

  // Find and update cover image item
  const coverImageItem = $('item[id="cover-image"]');

  if (coverImageItem.length) {
    coverImageItem.attr("properties", "cover-image");
    fs.writeFileSync(opfFile, $.xml());
    console.log('Added properties="cover-image" to cover image');
  } else {
    console.log("Warning: Could not find cover-image item in OPF");
  }
} catch (error: unknown) {
  // Properly handle unknown error type
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error processing OPF file: ${errorMessage}`);
}
