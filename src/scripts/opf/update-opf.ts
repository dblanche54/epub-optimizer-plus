// This script fixes/updates the OPF file.
// It is used to fix/update the OPF file after the book is built.

import { runCommand, handleError } from "../utils.js";

try {
  // TODO: is add_cover_image_property really needed?
  // runCommand("node dist/src/scripts/opf/add-cover-image-property.js");

  // update_cover_linear: Allow to set cover image as linear. It means that the cover image will be displayed
  // on the first page of the book.
  runCommand("node dist/src/scripts/opf/update-cover-linear.js");

  console.log("All OPF fixes applied.");
} catch (error) {
  handleError(error);
}
