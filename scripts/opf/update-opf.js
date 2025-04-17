// This script fixes/updates the OPF file.
// It is used to fix/update the OPF file after the book is built.

const { execSync } = require("node:child_process");

try {
  // TODO: is add_cover_image_property really needed?
  // execSync("node scripts/opf/add-cover-image-property.js", { stdio: "inherit" });

  // update_cover_linear: Allow to set cover image as linear. It means that the cover image will be displayed
  // on the first page of the book.
  execSync("node scripts/opf/update-cover-linear.js", { stdio: "inherit" });

  console.log("All OPF fixes applied.");
} catch (error) {
  console.error(`Error running OPF fix scripts: ${error.message}`);
  process.exit(1);
}
