const fs = require("fs");
const path = require("path");
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

/**
 * Fix chapter 10 specific issue with nested span tags
 */
function fixChapter10(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Extract title and head content
  const titleMatch = /<title>(.*?)<\/title>/i.exec(content);
  const title = titleMatch ? titleMatch[1] : "10 About the Author | EbookNext";

  // Extract the UUID if present
  const uuidMatch = /<meta name="EPB-UUID" content="([^"]+)"/i.exec(content);
  const uuid = uuidMatch
    ? uuidMatch[1]
    : "357D4A11-B428-4518-B5AC-3397035DF163";

  // Extract body attributes
  const bodyMatch = /<body([^>]*)>/i.exec(content);
  const bodyAttributes = bodyMatch
    ? bodyMatch[1]
    : ' dir="ltr" onload="Body_onLoad()"';

  // Extract div attributes
  const divMatch = /<div([^>]*)>/i.exec(content);
  const divAttributes = divMatch
    ? divMatch[1]
    : ' class="body s1" style="white-space:pre-wrap;line-break:strict"';

  // Extract h1 and content
  const h1AttributesMatch = /<h1([^>]*)>/i.exec(content);
  const h1Attributes = h1AttributesMatch
    ? h1AttributesMatch[1]
    : ' class="p5" style=""';

  // Extract the paragraph content
  const paragraphMatch = /<p[^>]*>(.*?)<\/p>/i.exec(content);
  const paragraph = paragraphMatch
    ? paragraphMatch[1]
    : "Author name - Blablabla…";

  // Create a fixed version of the file with proper tag structure
  const fixedContent = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${title}</title>
  <link rel="stylesheet" href="css/book.css" type="text/css"/>
  <meta charset="UTF-8"/>
  <meta name="EPB-UUID" content="${uuid}"/>
  <script src="js/book.js"></script>
</head>
<body${bodyAttributes}>
  <div${divAttributes}>
    <h1${h1Attributes}><span id="chapter-10">About the Author</span></h1>
    <h1${h1Attributes}><span id="chapter-10-636">￼<span style="display:inline-block;vertical-align:baseline;width:10.8em;text-indent:0;max-width:100%"><img src="images/monkey-cat.jpg" alt="monkey-cat.jpeg" style="width:100%"/></span></span></h1>
    <p class="p11" style="">${paragraph}</p>
  </div>
</body>
</html>`;

  fs.writeFileSync(filePath, fixedContent);
  console.log("Fixed chapter-10.xhtml with special handling");
}

/**
 * Fix Chapter 4 specific issue with nested span tags
 */
function fixChapter4(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Extract title and head content
  const titleMatch = /<title>(.*?)<\/title>/i.exec(content);
  const title = titleMatch ? titleMatch[1] : "4 Dédicace | EbookNext";

  // Extract the UUID if present
  const uuidMatch = /<meta name="EPB-UUID" content="([^"]+)"/i.exec(content);
  const uuid = uuidMatch
    ? uuidMatch[1]
    : "357D4A11-B428-4518-B5AC-3397035DF163";

  // Extract body attributes
  const bodyMatch = /<body([^>]*)>/i.exec(content);
  const bodyAttributes = bodyMatch
    ? bodyMatch[1]
    : ' dir="ltr" onload="Body_onLoad()"';

  // Extract div attributes
  const divMatch = /<div([^>]*)>/i.exec(content);
  const divAttributes = divMatch
    ? divMatch[1]
    : ' class="body s1" style="white-space:pre-wrap;line-break:strict"';

  // Extract h1 and content
  const h1AttributesMatch = /<h1([^>]*)>/i.exec(content);
  const h1Attributes = h1AttributesMatch
    ? h1AttributesMatch[1]
    : ' class="p5" style=""';

  // Create a fixed version of the file with proper tag structure
  const fixedContent = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${title}</title>
  <link rel="stylesheet" href="css/book.css" type="text/css"/>
  <meta charset="UTF-8"/>
  <meta name="EPB-UUID" content="${uuid}"/>
  <script src="js/book.js"></script>
</head>
<body${bodyAttributes}>
  <div${divAttributes}>
    <h1${h1Attributes}><span id="chapter-4"><span class="c1">Dédicace</span></span></h1>
    <p class="p7" style=""> </p>
    <p class="p9 c4" style="">Tap or click this placeholder text to add a dedication to<br/>your book.</p>
    <p class="p8" style=""> </p>
    <p class="p7" style=""><span style="display:inline-block;vertical-align:baseline;width:21.6em;text-indent:0;max-width:100%"><img src="images/image.png" alt="Group Naked-Solaryen.jpeg Caption: Solaryen dans sa forme originelle Solaryen dans sa forme originelle" style="width:100%"/></span></p>
    <p class="p8" style=""> </p>
  </div>
</body>
</html>`;

  fs.writeFileSync(filePath, fixedContent);
  console.log("Fixed chapter-4.xhtml with special handling");
}

/**
 * Fix TOC file with nav element
 */
function fixTocXhtml(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Extract title
  const titleMatch = /<title>(.*?)<\/title>/i.exec(content);
  const title = titleMatch ? titleMatch[1] : "Table Of Contents";

  // Extract the UUID if present
  const uuidMatch = /<meta name="EPB-UUID" content="([^"]+)"/i.exec(content);
  const uuid = uuidMatch
    ? uuidMatch[1]
    : "357D4A11-B428-4518-B5AC-3397035DF163";

  // Create a fixed version of the file with proper nav structure
  const fixedContent = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>${title}</title>
  <link rel="stylesheet" href="css/book.css" type="text/css"/>
  <meta charset="UTF-8"/>
  <meta name="EPB-UUID" content="${uuid}"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="chapter-1.xhtml">Les Spectres solaires</a></li>
      <li><a href="chapter-2.xhtml">Sommaire</a></li>
      <li><a href="chapter-3.xhtml">Copyright</a></li>
      <li><a href="chapter-4.xhtml">Dédicace</a></li>
      <li><a href="chapter-5.xhtml">Prologue</a></li>
      <li><a href="chapter-6.xhtml">Bien avant leur chute…</a></li>
      <li><a href="chapter-7.xhtml">Chapitre I</a></li>
      <li><a href="chapter-8.xhtml">Longtemps après leur…</a></li>
      <li><a href="chapter-9.xhtml">Chapitre II</a></li>
      <li><a href="chapter-10.xhtml">About the Author</a></li>
    </ol>
  </nav>
</body>
</html>`;

  fs.writeFileSync(filePath, fixedContent);
  console.log("Fixed toc.xhtml with proper TOC structure");
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

    // Special case for chapter-10.xhtml
    if (file.includes("chapter-10.xhtml")) {
      fixChapter10(file);
    }
    // Special case for chapter-4.xhtml
    else if (file.includes("chapter-4.xhtml")) {
      fixChapter4(file);
    }
    // Special case for TOC
    else if (file.includes("toc.xhtml")) {
      fixTocXhtml(file);
    }
    // Regular XHTML files
    else {
      let content = fs.readFileSync(file, "utf8");
      const components = extractComponentsFromXhtml(content);
      const newContent = reconstructXhtml(components);
      fs.writeFileSync(file, newContent);
      console.log(`Fixed ${path.basename(file)}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log("All XHTML files fixed.");
