// Allow to set cover image as linear. It means that the cover image will be displayed
// on the first page of the book.

import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import config from "../../src/utils/config.ts";

const extractedDir = path.join(process.cwd(), config.tempDir);
const opsDir = path.join(extractedDir, "OPS");
const opfFile = path.join(opsDir, "epb.opf");

if (!fs.existsSync(opfFile)) {
  console.error(`Error: OPF file not found at ${opfFile}`);
  process.exit(1);
}

try {
  console.log(`Ensuring <itemref idref="cover" linear="yes"/> in: ${opfFile}`);
  const content = fs.readFileSync(opfFile, "utf8");
  const $ = cheerio.load(content, { xmlMode: true, decodeEntities: false });
  const coverRef = $('itemref[idref="cover"]');
  if (coverRef.length) {
    coverRef.attr("linear", "yes");
    fs.writeFileSync(opfFile, $.xml());
    console.log('Set <itemref idref="cover" linear="yes"/>');
  } else {
    console.log("Warning: Could not find cover reference in spine");
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error updating cover reference: ${error.message}`);
  } else {
    console.error("Unknown error updating cover reference", error);
  }
}
