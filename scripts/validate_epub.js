const { spawnSync } = require("child_process");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const config = require("../src/utils/config");
const path = require("path");

const argv = yargs(hideBin(process.argv))
  .option("output", {
    alias: "o",
    type: "string",
    description: "Output EPUB file path",
    default: config.outputEPUB,
  })
  .help(false)
  .version(false).argv;

const epubFile = argv.output || config.outputEPUB;
const epubcheckPath = path.join(__dirname, "../" + config.epubcheckPath);

const result = spawnSync("java", ["-jar", epubcheckPath, epubFile], {
  stdio: "inherit",
});

process.exit(result.status);
