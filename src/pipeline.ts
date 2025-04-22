import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

// Helper to run a node script in dist/src/scripts with args
function runScript(script: string, args: string[], label: string) {
  const scriptPath = path.join("dist", "src", "scripts", ...script.split("/"));
  console.log(`\n=== ${label} ===`);
  const result = spawnSync("node", [scriptPath, ...args], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed.`);
    process.exit(result.status || 1);
  }
}

// Parse CLI args
const rawArgs = process.argv.slice(2);
const hasClean = rawArgs.includes("--clean");
const filteredArgs = rawArgs.filter((arg) => arg !== "--clean");

// Step 1: Optimize EPUB (main logic)
runScript("../../optimize-epub.js", filteredArgs, "Optimize EPUB");

// Step 2: General Fixes
runScript("fix/index.js", filteredArgs, "General Fixes");

// Step 3: OPF Fixes
runScript("opf/update-opf.js", filteredArgs, "OPF Fixes");

// Step 4: Create EPUB
runScript("create-epub.js", filteredArgs, "Create EPUB");

// Step 5: Validate EPUB
runScript("validate-epub.js", filteredArgs, "Validate EPUB");

// Step 6: Cleanup if --clean
if (hasClean) {
  console.log("\n=== Cleanup ===");
  const cleanupResult = spawnSync("rm", ["-rf", "temp_epub"], { stdio: "inherit" });
  if (cleanupResult.status !== 0) {
    console.error("✗ Cleanup failed.");
    process.exit(cleanupResult.status || 1);
  }
  console.log("All done!\n");
} else {
  console.log(
    "\nBuild completed successfully!\nNote: Temporary files have been kept. Use --clean to remove them.\n"
  );
}
