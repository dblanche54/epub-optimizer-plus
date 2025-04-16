const fs = require("fs");
const path = require("path");
const config = require("../src/utils/config");

// Properly format self-closing tags in XML/XHTML files
function fixXml(content) {
  // Replace all self-closing tags
  let fixed = content
    // First, properly format the document
    .replace(
      /<\?xml\s+version="1\.0"\s+encoding="UTF-8"\?>\s+<html/g,
      '<?xml version="1.0" encoding="UTF-8"?>\n<html'
    )

    // Fix self-closing tags that aren't properly closed - be more aggressive
    .replace(/<(meta|link|img|input|br|hr)([^>]*?)>/g, "<$1$2/>")

    // Fix script tags that don't have closing tags
    .replace(/<script([^>]*)>(?!.*?<\/script>)/g, "<script$1></script>")

    // Fix spaces in self-closing tags (sometimes caused by previous replacements)
    .replace(/\s+\/>/g, "/>")

    // Fix nested self-closing tags (if any got caught by the regex)
    .replace(/\/\/>/g, "/>")

    // Add missing xmlns if needed
    .replace(
      /<html(?!\s+[^>]*xmlns=)/g,
      '<html xmlns="http://www.w3.org/1999/xhtml"'
    );

  // More aggressive fixes for span tags
  fixed = fixed.replace(
    /<span([^>]*)>([^<]*)(<br\/>)([^<]*)<\/h1>/g,
    "<span$1>$2$3$4</span></h1>"
  );

  // Make sure all <br> tags are properly closed
  fixed = fixed.replace(/<br([^/>]*?)>/g, "<br$1/>");

  return fixed;
}

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

// Get all XHTML files
const xhtmlFiles = fs
  .readdirSync(opsDir)
  .filter((file) => file.endsWith(".xhtml"))
  .map((file) => path.join(opsDir, file));

// Fix each file
xhtmlFiles.forEach((file) => {
  try {
    console.log(`Processing ${file}`);
    const content = fs.readFileSync(file, "utf8");
    const fixed = fixXml(content);
    fs.writeFileSync(file, fixed);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log("All files processed.");
