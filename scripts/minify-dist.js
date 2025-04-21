import { readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { minify } from "terser";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");
const srcDir = path.join(distDir, "src");
const scriptsDir = path.join(distDir, "scripts");
const entryPoint = path.join(distDir, "optimize-epub.js");

// Scripts to skip minification due to template literal variable name issues
const skipFiles = ["build.js", "create-epub.js"];

/**
 * Minify a JavaScript file and save the result
 * @param {string} filePath Path to JavaScript file
 */
async function minifyFile(filePath) {
  // Skip files in the skip list
  const fileName = path.basename(filePath);
  if (skipFiles.includes(fileName)) {
    console.log(`⏩ Skipping: ${path.relative(distDir, filePath)} (in skip list)`);
    return true;
  }

  try {
    console.log(`Minifying: ${path.relative(distDir, filePath)}`);
    const code = await readFile(filePath, "utf8");

    const result = await minify(code, {
      compress: true,
      mangle: true,
      module: true,
      sourceMap: false,
      toplevel: true,
      keep_classnames: true,
      keep_fnames: true,
    });

    if (result.code) {
      await writeFile(filePath, result.code);
      console.log(`✓ Success: ${path.relative(distDir, filePath)}`);
      return true;
    } else {
      console.warn(`⚠ No output for: ${path.relative(distDir, filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error minifying ${path.relative(distDir, filePath)}: ${error.message}`);
    return false;
  }
}

/**
 * Recursively process all .js files in a directory
 * @param {string} dir Directory to process
 */
async function processDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.endsWith(".js")) {
      await minifyFile(fullPath);
    }
  }
}

// Main function
async function main() {
  console.log("Starting minification process...");

  // Minify the entry point first
  if (existsSync(entryPoint)) {
    await minifyFile(entryPoint);
  } else {
    console.warn(`Entry point not found: ${entryPoint}`);
  }

  // Minify src/ directory
  if (existsSync(srcDir)) {
    console.log("Processing src/ directory...");
    await processDirectory(srcDir);
  } else {
    console.warn(`Source directory not found: ${srcDir}`);
  }

  // Minify scripts/ directory
  if (existsSync(scriptsDir)) {
    console.log("Processing scripts/ directory...");
    await processDirectory(scriptsDir);
  } else {
    console.warn(`Scripts directory not found: ${scriptsDir}`);
  }

  console.log("Minification complete!");
}

main().catch((error) => {
  console.error("Minification failed:", error);
  process.exit(1);
});
