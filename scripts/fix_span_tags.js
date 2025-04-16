const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Process all chapter XHTML files in the extracted directory
const extractedDir = path.join(__dirname, "..", "extracted");
const opsDir = path.join(extractedDir, "OPS");

// Get all chapter XHTML files
const chapterFiles = fs
  .readdirSync(opsDir)
  .filter((file) => file.startsWith("chapter-") && file.endsWith(".xhtml"))
  .map((file) => path.join(opsDir, file));

// Fix each file
chapterFiles.forEach((file) => {
  try {
    console.log(`Processing ${file}`);
    let content = fs.readFileSync(file, "utf8");

    // Find unclosed span tags and close them
    // Look specifically for the pattern: <span id="chapter-X">Text<br/>Text</h1>
    content = content.replace(
      /<span([^>]*)>([^<]*)<br\/>([^<]*)<\/h1>/g,
      "<span$1>$2<br/>$3</span></h1>"
    );

    // A more generic approach for any other unclosed spans
    content = content.replace(
      /<span([^>]*)>([^<]*)((?!<\/span>).)*?<\/(h\d|p|div)/g,
      (match, attrs, text, rest, closing) => {
        return `<span${attrs}>${text}</span></${closing}`;
      }
    );

    fs.writeFileSync(file, content);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log("All span tags fixed. Creating new EPUB...");

// Create the fixed EPUB
exec(
  "cd " +
    extractedDir +
    " && zip -X0 ../fixed_mybook.epub mimetype && zip -Xur9D ../fixed_mybook.epub * -x mimetype",
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating EPUB: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log("Created fixed_mybook.epub");

    // Copy to the output file
    fs.copyFileSync(
      path.join(__dirname, "..", "fixed_mybook.epub"),
      path.join(__dirname, "..", "mybook_opt.epub")
    );
    console.log("Copied to mybook_opt.epub");
  }
);
