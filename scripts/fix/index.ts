import { execSync } from "node:child_process";

try {
  execSync("ts-node scripts/fix/fix-span-tags.ts", { stdio: "inherit" });
  execSync("ts-node scripts/fix/fix-xml.ts", { stdio: "inherit" });
  console.log("All general fixes applied.");
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error running general fix scripts: ${error.message}`);
  } else {
    console.error("Unknown error running general fix scripts", error);
  }
  process.exit(1);
}
