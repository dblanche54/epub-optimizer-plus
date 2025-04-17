const { execSync } = require("node:child_process");

try {
  execSync("node scripts/fix/fix_span_tags.js", { stdio: "inherit" });
  execSync("node scripts/fix/fix_xml.js", { stdio: "inherit" });
  console.log("All general fixes applied.");
} catch (error) {
  console.error(`Error running general fix scripts: ${error.message}`);
  process.exit(1);
}
