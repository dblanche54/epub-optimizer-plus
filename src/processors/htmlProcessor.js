const fs = require("fs-extra");
const path = require("path");
const { minify } = require("html-minifier-terser");
const CleanCSS = require("clean-css");
const config = require("../utils/config");

/**
 * Process HTML and CSS files in a directory
 * @param {string} dir - Directory to process
 */
async function processHTML(dir) {
  const entries = await fs.readdir(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await processHTML(fullPath);
    } else if (entry.endsWith(".xhtml") || entry.endsWith(".html")) {
      await minifyHTML(fullPath);
    } else if (entry.endsWith(".css")) {
      await minifyCSS(fullPath);
    }
  }
}

/**
 * Minify HTML file
 * @param {string} filePath - Path to HTML file
 */
async function minifyHTML(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const minified = await minify(content, config.htmlOptions);
  await fs.writeFile(filePath, minified);
}

/**
 * Minify CSS file
 * @param {string} filePath - Path to CSS file
 */
async function minifyCSS(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const minified = new CleanCSS(config.cssOptions).minify(content).styles;
  await fs.writeFile(filePath, minified);
}

module.exports = {
  processHTML,
};
