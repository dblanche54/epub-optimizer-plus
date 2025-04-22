import { runCommand, handleError } from "../utils.js";

try {
  runCommand("node dist/src/scripts/fix/fix-span-tags.js");
  runCommand("node dist/src/scripts/fix/fix-xml.js");
  console.log("All general fixes applied.");
} catch (error) {
  handleError(error);
}
