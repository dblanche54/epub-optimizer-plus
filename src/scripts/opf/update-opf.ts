// This script fixes/updates the OPF file.
// It is used to fix/update the OPF file after the book is built.

import { runCommand, handleError } from "../utils.js";

try {
  // TODO: is add_cover_image_property really needed?
  // runCommand("node dist/src/scripts/opf/add-cover-image-property.js");

  // update_cover_linear: Allow to set cover image as linear. It means that the cover image will be displayed
  // on the first page of the book.
  runCommand("node dist/src/scripts/opf/update-cover-linear.js");

  // update_toc_with_cover: Add the cover image to the table of contents in both toc.xhtml and epb.ncx
  runCommand("node dist/src/scripts/opf/update-toc-with-cover.js");

  // update_summary_page: Add the cover to the summary page and remove the self-reference
  runCommand("node dist/src/scripts/opf/update-summary-page.js");

  console.log("All OPF fixes applied.");
} catch (error) {
  handleError(error);
}
