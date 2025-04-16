const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const config = require("../src/utils/config");

// Properly format self-closing tags in XML/XHTML files
function fixXml(content) {
  // Remove all </br> tags (invalid in XHTML)
  content = content.replace(/<\/br>/gi, "");
  // Convert all <br> to <br/> (self-closing)
  content = content.replace(/<br(?![\w\/])/gi, "<br/");

  // Ensure XML declaration is immediately followed by <html>
  content = content.replace(/(<\?xml[^>]+>)[\s\r\n]+<html/, "$1<html");

  // Use cheerio for DOM manipulation
  const $ = cheerio.load(content, { xmlMode: true });

  // Remove all <script> tags (not allowed in EPUB XHTML)
  $("script").remove();

  // Only keep <meta> tags that are direct children of <head>
  $("meta").each((_, el) => {
    const parent = $(el).parent();
    if (!parent.is("head")) {
      $(el).remove();
    }
  });

  // Remove any text nodes that are direct children of <html> (including whitespace)
  $("html")
    .contents()
    .filter(function () {
      return (
        (this.type === "text" && $(this).text().trim().length === 0) ||
        (this.type === "text" && $(this).text().trim().length > 0)
      );
    })
    .remove();

  // Remove any text nodes that are direct children of <body> (not allowed)
  $("body")
    .contents()
    .filter(function () {
      return this.type === "text" && $(this).text().trim().length > 0;
    })
    .remove();

  // Example: ensure all <br> tags are self-closed
  $("br").each((_, el) => {
    // cheerio with xmlMode will output <br/>
  });
  // Example: ensure all <meta>, <link>, <img>, <input>, <hr> are self-closed
  ["meta", "link", "img", "input", "hr"].forEach((tag) => {
    $(tag).each((_, el) => {
      // cheerio with xmlMode will output self-closed tags
    });
  });
  // Serialize back to XML
  return $.xml();
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
