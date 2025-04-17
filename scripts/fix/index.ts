import { runCommand, handleError } from "../utils.ts";

try {
  runCommand("ts-node scripts/fix/fix-span-tags.ts");
  runCommand("ts-node scripts/fix/fix-xml.ts");
  console.log("All general fixes applied.");
} catch (error) {
  handleError(error);
}
