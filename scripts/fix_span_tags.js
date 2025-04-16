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

/**
 * Extract content from XHTML file using regex
 * @param {string} content - The file content
 * @returns {Object} Extracted components
 */
function extractComponentsFromXhtml(content) {
  const result = {
    title: "",
    uuid: "357D4A11-B428-4518-B5AC-3397035DF163", // Default UUID if not found
    headContent: "",
    bodyAttributes: "",
    divAttributes: "",
    h1Attributes: "",
    headingContent: "",
    bodyContent: "",
  };

  // Extract title
  const titleMatch = /<title>(.*?)<\/title>/i.exec(content);
  if (titleMatch) {
    result.title = titleMatch[1];
  }

  // Extract UUID
  const uuidMatch = /<meta name="EPB-UUID" content="([^"]+)"/i.exec(content);
  if (uuidMatch) {
    result.uuid = uuidMatch[1];
  }

  // Extract body attributes
  const bodyMatch = /<body([^>]*)>/i.exec(content);
  if (bodyMatch) {
    result.bodyAttributes = bodyMatch[1];
  }

  // Extract div attributes
  const divMatch = /<div([^>]*)>/i.exec(content);
  if (divMatch) {
    result.divAttributes = divMatch[1];
  }

  // Extract h1 attributes
  const h1Match = /<h1([^>]*)>/i.exec(content);
  if (h1Match) {
    result.h1Attributes = h1Match[1];
  }

  // Extract heading content - this is the tricky part
  const headingMatch = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(content);
  if (headingMatch) {
    let headingContent = headingMatch[1];

    // Fix unclosed/invalid span tags in heading content
    const spanIdMatch =
      /<span id="([^"]+)">([\s\S]*?)(?:<\/span>)?<\/h1>/i.exec(content);
    if (spanIdMatch) {
      const spanId = spanIdMatch[1];
      let spanText = spanIdMatch[2];

      // If text contains a <br/> tag, handle it properly
      if (spanText.includes("<br") && !spanText.includes("</span>")) {
        spanText = spanText.replace(/<br\s*\/?>/g, "<br/>");
        result.headingContent = `<span id="${spanId}">${spanText}</span>`;
      } else {
        result.headingContent = `<span id="${spanId}">${spanText}</span>`;
      }
    } else {
      // Keep the heading content as is if we couldn't parse it properly
      result.headingContent = headingContent;
    }
  }

  // Extract rest of the body content
  const bodyContentMatch = /<\/h1>([\s\S]*?)<\/div>/i.exec(content);
  if (bodyContentMatch) {
    result.bodyContent = bodyContentMatch[1];
  }

  // Extract head content except title
  const headContent = content.match(/<head>([\s\S]*?)<\/head>/i);
  if (headContent) {
    let headStr = headContent[1];
    // Remove title as we'll add it separately
    headStr = headStr.replace(/<title>.*?<\/title>/i, "");
    result.headContent = headStr;
  }

  return result;
}

/**
 * Reconstruct a well-formed XHTML file
 * @param {Object} components - Extracted components
 * @returns {string} Properly formatted XHTML content
 */
function reconstructXhtml(components) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${components.title}</title>${components.headContent}
</head>
<body${components.bodyAttributes}>
  <div${components.divAttributes}>
    <h1${components.h1Attributes}>${components.headingContent}</h1>${components.bodyContent}
  </div>
</body>
</html>`;
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
