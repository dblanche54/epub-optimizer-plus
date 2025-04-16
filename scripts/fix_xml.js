const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Properly format self-closing tags in XML/XHTML files
function fixXml(content) {
  // Replace all self-closing tags
  let fixed = content
    // First, properly format the document
    .replace(
      /<\?xml\s+version="1\.0"\s+encoding="UTF-8"\?>\s+<html/g,
      '<?xml version="1.0" encoding="UTF-8"?>\n<html'
    )

    // Fix self-closing tags that aren't properly closed
    .replace(/<(meta|link|img|input|br|hr)([^>]*[^\/])>/g, "<$1$2/>")

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

  return fixed;
}

// Process all XHTML files in the extracted directory
const extractedDir = path.join(__dirname, "..", "extracted");
const opsDir = path.join(extractedDir, "OPS");

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

console.log("All files processed. Creating new EPUB...");

// Create the fixed EPUB
exec(
  "cd extracted && zip -X0 ../fixed_mybook.epub mimetype && zip -Xur9D ../fixed_mybook.epub * -x mimetype",
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating EPUB: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log("Created fixed_mybook.epub");

    // Copy to the output file
    fs.copyFileSync(
      path.join(__dirname, "..", "fixed_mybook.epub"),
      path.join(__dirname, "..", "mybook_opt.epub")
    );
    console.log("Copied to mybook_opt.epub");
  }
);
