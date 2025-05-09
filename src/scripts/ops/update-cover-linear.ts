// Sets the cover image as linear in the OPF file
// When linear="yes", the cover will be displayed in the reading order (on the first page)

import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import config from "../../utils/config.js";

// Define file paths
const extractedDir = path.join(process.cwd(), config.tempDir);
const opsDir = path.join(extractedDir, "OPS");
const opfFile = path.join(opsDir, "epb.opf");

// Check if OPF file exists
if (!fs.existsSync(opfFile)) {
  console.error(`Error: OPF file not found at ${opfFile}`);
  process.exit(1);
}

try {
  console.log(`Updating cover in OPF file: ${opfFile}`);

  // Read and parse OPF file
  const content = fs.readFileSync(opfFile, "utf8");
  const $ = cheerio.load(content, { xmlMode: true });

  // Find cover reference in spine
  const coverRef = $('itemref[idref="cover"]');

  if (coverRef.length) {
    // Set cover as linear
    coverRef.attr("linear", "yes");
    fs.writeFileSync(opfFile, $.xml());
    console.log('Successfully set cover to linear: <itemref idref="cover" linear="yes"/>');
  } else {
    console.log("Warning: No cover reference found in spine section of OPF file");
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error updating cover reference: ${error.message}`);
  } else {
    console.error("Unknown error updating cover reference", error);
  }
}
