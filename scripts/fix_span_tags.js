const fs = require("fs-extra");
const path = require("path");
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

// Get all chapter XHTML files
const xhtmlFiles = fs
  .readdirSync(opsDir)
  .filter((file) => file.endsWith(".xhtml"))
  .map((file) => path.join(opsDir, file));

// Fix each file
xhtmlFiles.forEach((file) => {
  try {
    console.log(`Processing ${file}`);
    let content = fs.readFileSync(file, "utf8");
    // Use cheerio for DOM manipulation
    const $ = cheerio.load(content, { xmlMode: true });
    // Example: fix span tags in h1
    const h1 = $("h1");
    h1.each((_, el) => {
      const $el = $(el);
      // Fix unclosed/invalid span tags in heading content
      $el.find("span").each((_, span) => {
        // Example fix: ensure all spans are closed
        // (cheerio auto-closes tags, so just serialize)
      });
    });
    // Serialize back to XML
    const fixed = $.xml();
    fs.writeFileSync(file, fixed);
    console.log(`Fixed ${path.basename(file)}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log("All XHTML files fixed.");
