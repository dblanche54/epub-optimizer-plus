const { execSync } = require("node:child_process");

try {
  execSync("node scripts/add_cover_image_property.js", { stdio: "inherit" });
  execSync("node scripts/fix_cover_linear.js", { stdio: "inherit" });
  console.log("All OPF fixes applied.");
} catch (error) {
  console.error(`Error running OPF fix scripts: ${error.message}`);
  process.exit(1);
}
