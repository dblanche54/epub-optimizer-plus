// This script fixes/updates the OPF file.
// It is used to fix/update the OPF file after the book is built.

import { execSync } from "node:child_process";

try {
  // TODO: is add_cover_image_property really needed?
  // execSync("ts-node scripts/opf/add-cover-image-property.ts", { stdio: "inherit" });

  // update_cover_linear: Allow to set cover image as linear. It means that the cover image will be displayed
  // on the first page of the book.
  execSync("ts-node scripts/opf/update-cover-linear.ts", { stdio: "inherit" });

  console.log("All OPF fixes applied.");
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error running OPF fix scripts: ${error.message}`);
  } else {
    console.error("Unknown error running OPF fix scripts", error);
  }
  process.exit(1);
}
