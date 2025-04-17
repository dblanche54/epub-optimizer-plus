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
    `Ensuring <itemref idref=\"cover\" linear=\"yes\"/> in: ${opfFile}`
  );
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
  console.error(`Error updating cover reference: ${error.message}`);
}
