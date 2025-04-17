const fs = require("fs-extra");
const path = require("node:path");
const cheerio = require("cheerio");
const config = require("../src/utils/config");

const extractedDir = path.join(__dirname, "..", config.tempDir);
const opsDir = path.join(extractedDir, "OPS");
const opfFile = path.join(opsDir, "epb.opf");

if (!fs.existsSync(opfFile)) {
  console.error(`Error: OPF file not found at ${opfFile}`);
  process.exit(1);
}

try {
  console.log(
    `Adding properties=\"cover-image\" to cover-image item in: ${opfFile}`
  );
  const content = fs.readFileSync(opfFile, "utf8");
  const $ = cheerio.load(content, { xmlMode: true, decodeEntities: false });
  const coverImageItem = $('item[id="cover-image"]');
  if (coverImageItem.length) {
    coverImageItem.attr("properties", "cover-image");
    fs.writeFileSync(opfFile, $.xml());
    console.log('Added properties="cover-image" to cover image');
  } else {
    console.log("Warning: Could not find cover-image item in OPF");
  }
} catch (error) {
  console.error(`Error processing OPF file: ${error.message}`);
}
