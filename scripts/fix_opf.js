const fs = require("fs-extra");
const path = require("node:path");
const cheerio = require("cheerio");
const config = require("../src/utils/config");

// Get the extraction directory from config
const extractedDir = path.join(__dirname, "..", config.tempDir);
const opsDir = path.join(extractedDir, "OPS");

// Verify the directory exists
if (!fs.existsSync(extractedDir)) {
  console.error(`Error: Directory ${extractedDir} does not exist.`);
  console.error(
    "Please run the optimization script first to extract the EPUB."
  );
  process.exit(1);
}

if (!fs.existsSync(opsDir)) {
  console.error(`Error: Directory ${opsDir} does not exist.`);
  console.error("Please make sure the extracted EPUB has an OPS directory.");
  process.exit(1);
}

// Fix OPF file
const opfFile = path.join(opsDir, "epb.opf");
if (fs.existsSync(opfFile)) {
  try {
    console.log(`Fixing OPF file: ${opfFile}`);
    const content = fs.readFileSync(opfFile, "utf8");

    // Parse the OPF file with cheerio
    const $ = cheerio.load(content, {
      xmlMode: true,
      decodeEntities: false,
    });

    // 1. Remove the "meta" tag with name="cover"
    // $('meta[name="cover"]').remove();

    // 2. Add properties="cover-image" to the cover-image item
    const coverImageItem = $('item[id="cover-image"]');
    if (coverImageItem.length) {
      coverImageItem.attr("properties", "cover-image");
      console.log('Added properties="cover-image" to cover image');
    } else {
      console.log("Warning: Could not find cover-image item in OPF");
    }

    // Save the updated OPF file
    fs.writeFileSync(opfFile, $.xml());
    console.log("OPF file updated successfully");
  } catch (error) {
    console.error(`Error processing OPF file: ${error.message}`);
  }
} else {
  console.error(`Error: OPF file not found at ${opfFile}`);
}

// Fix cover.xhtml reference in spine
const coverXhtml = path.join(opsDir, "cover.xhtml");
if (fs.existsSync(coverXhtml) && fs.existsSync(opfFile)) {
  try {
    console.log("Fixing cover reference in spine");
    const content = fs.readFileSync(opfFile, "utf8");

    // Parse the OPF file with cheerio
    const $ = cheerio.load(content, {
      xmlMode: true,
      decodeEntities: false,
    });

    // Update the cover itemref to have linear="yes"
    const coverRef = $('itemref[idref="cover"]');
    if (coverRef.length) {
      coverRef.attr("linear", "yes");
      console.log('Updated cover reference to linear="yes"');

      // Save the updated OPF file
      fs.writeFileSync(opfFile, $.xml());
    } else {
      console.log("Warning: Could not find cover reference in spine");
    }
  } catch (error) {
    console.error(`Error updating cover reference: ${error.message}`);
  }
}

console.log("OPF fixes complete.");
