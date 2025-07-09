import fs from "fs-extra";
import path from "node:path";
import * as cheerio from "cheerio";
import config from "../../utils/config.js";
import { getCoverLabel } from "../../utils/i18n.js";
import { getContentPath } from "../../utils/epub-utils.js";

// Get the localized cover label
const COVER_LABEL = getCoverLabel();

// Define file paths
const extractedDir = path.join(process.cwd(), config.tempDir);
const contentDir = await getContentPath(extractedDir);
const tocXhtmlFile = path.join(contentDir, "toc.xhtml");
const ncxFile = path.join(contentDir, "epb.ncx");

// Check if files exist
if (!fs.existsSync(tocXhtmlFile)) {
  console.error(`Error: TOC file not found at ${tocXhtmlFile}`);
  process.exit(1);
}

if (!fs.existsSync(ncxFile)) {
  console.error(`Error: NCX file not found at ${ncxFile}`);
  process.exit(1);
}

try {
  // 1. Update toc.xhtml to include cover
  console.log(`Adding cover to TOC file: ${tocXhtmlFile}`);

  let content = fs.readFileSync(tocXhtmlFile, "utf8");
  let $ = cheerio.load(content, { xmlMode: true });

  // Check if cover is already in the TOC
  const coverLink = $('a[href="cover.xhtml"]');

  if (coverLink.length === 0) {
    // Add cover as the first item in the TOC
    const olElement = $('nav[epub\\:type="toc"] > ol');

    if (olElement.length) {
      // Create new list item with cover link
      const coverItem = $('<li class="s3"></li>');
      const anchorElement = $(`<a href="cover.xhtml" class="s3">${COVER_LABEL}</a>`);
      coverItem.append(anchorElement);

      // Add it as the first item
      olElement.prepend(coverItem);

      // Save the updated TOC
      fs.writeFileSync(tocXhtmlFile, $.xml());
      console.log("Successfully added cover to toc.xhtml");
    } else {
      console.log("Warning: Could not find TOC list in toc.xhtml");
    }
  } else {
    console.log("Cover is already in toc.xhtml");
  }

  // 2. Update epb.ncx to include cover
  console.log(`Adding cover to NCX file: ${ncxFile}`);

  content = fs.readFileSync(ncxFile, "utf8");
  $ = cheerio.load(content, { xmlMode: true });

  // Check if cover is already in the NCX navMap
  const coverNavPoint = $(`navPoint navLabel text:contains("${COVER_LABEL}")`).parent().parent();

  if (coverNavPoint.length === 0) {
    const navMap = $("navMap");

    if (navMap.length) {
      // Create a new navPoint for the cover
      const coverNavPoint = $(`
        <navPoint id="navpoint-cover" playOrder="1">
          <navLabel>
            <text>${COVER_LABEL}</text>
          </navLabel>
          <content src="cover.xhtml"/>
        </navPoint>
      `);

      // Add it as the first navPoint
      navMap.prepend(coverNavPoint);

      // Update the playOrder of all subsequent navPoints
      $("navPoint").each((i, el) => {
        const navPoint = $(el);
        if (navPoint.attr("id") !== "navpoint-cover") {
          const currentOrder = parseInt(navPoint.attr("playOrder") || "1");
          navPoint.attr("playOrder", (currentOrder + 1).toString());
        }
      });

      // Save the updated NCX
      fs.writeFileSync(ncxFile, $.xml());
      console.log("Successfully added cover to epb.ncx");
    } else {
      console.log("Warning: Could not find navMap in epb.ncx");
    }
  } else {
    console.log("Cover is already in epb.ncx");
  }

  console.log("TOC updates completed successfully");
} catch (error: unknown) {
  // Properly handle unknown error type
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error updating TOC files: ${errorMessage}`);
}
