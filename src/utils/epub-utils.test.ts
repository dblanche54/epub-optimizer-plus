import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { getOPFPath, getContentDir, parseOPF } from "./epub-utils";

describe("EPUB Utilities", () => {
  const tempDir = path.join(os.tmpdir(), "epub-utils-test");
  const epubDir = path.join(tempDir, "test-epub");

  beforeEach(async () => {
    await fs.ensureDir(epubDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe("getOPFPath", () => {
    it("reads OPF path from container.xml with standard naming", async () => {
      // Create META-INF/container.xml with standard OPF path
      await fs.ensureDir(path.join(epubDir, "META-INF"));
      await fs.writeFile(
        path.join(epubDir, "META-INF", "container.xml"),
        `<?xml version="1.0"?>
        <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
          <rootfiles>
            <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
          </rootfiles>
        </container>`
      );

      // Create the OPF file
      await fs.writeFile(
        path.join(epubDir, "content.opf"),
        `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"></package>`
      );

      const opfPath = await getOPFPath(epubDir);
      expect(opfPath).toBe(path.join(epubDir, "content.opf"));
    });

    it("reads OPF path from container.xml with custom naming", async () => {
      // Create META-INF/container.xml with custom OPF path
      await fs.ensureDir(path.join(epubDir, "META-INF"));
      await fs.writeFile(
        path.join(epubDir, "META-INF", "container.xml"),
        `<?xml version="1.0"?>
        <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
          <rootfiles>
            <rootfile full-path="OPS/9781712452227Z733.opf" media-type="application/oebps-package+xml"/>
          </rootfiles>
        </container>`
      );

      // Create the OPF file in OPS directory
      await fs.ensureDir(path.join(epubDir, "OPS"));
      await fs.writeFile(
        path.join(epubDir, "OPS", "9781712452227Z733.opf"),
        `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"></package>`
      );

      const opfPath = await getOPFPath(epubDir);
      expect(opfPath).toBe(path.join(epubDir, "OPS", "9781712452227Z733.opf"));
    });

    it("throws error when container.xml is missing", async () => {
      await expect(getOPFPath(epubDir)).rejects.toThrow("Container file not found");
    });

    it("throws error when OPF path is not found in container.xml", async () => {
      await fs.ensureDir(path.join(epubDir, "META-INF"));
      await fs.writeFile(
        path.join(epubDir, "META-INF", "container.xml"),
        `<?xml version="1.0"?>
        <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
          <rootfiles>
          </rootfiles>
        </container>`
      );

      await expect(getOPFPath(epubDir)).rejects.toThrow("OPF path not found in container.xml");
    });

    it("throws error when OPF file doesn't exist", async () => {
      await fs.ensureDir(path.join(epubDir, "META-INF"));
      await fs.writeFile(
        path.join(epubDir, "META-INF", "container.xml"),
        `<?xml version="1.0"?>
        <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
          <rootfiles>
            <rootfile full-path="nonexistent.opf" media-type="application/oebps-package+xml"/>
          </rootfiles>
        </container>`
      );

      await expect(getOPFPath(epubDir)).rejects.toThrow("OPF file not found at path");
    });
  });

  describe("getContentDir", () => {
    it("returns OPS directory when it exists", async () => {
      await fs.ensureDir(path.join(epubDir, "OPS"));

      const contentDir = await getContentDir(epubDir);
      expect(contentDir).toBe(path.join(epubDir, "OPS"));
    });

    it("returns epub root when OPS doesn't exist", async () => {
      const contentDir = await getContentDir(epubDir);
      expect(contentDir).toBe(epubDir);
    });
  });

  describe("parseOPF", () => {
    it("parses OPF file correctly", async () => {
      const opfPath = path.join(epubDir, "test.opf");
      await fs.writeFile(
        opfPath,
        `<?xml version="1.0"?>
        <package xmlns="http://www.idpf.org/2007/opf">
          <metadata>
            <dc:title>Test Book</dc:title>
          </metadata>
        </package>`
      );

      const $ = await parseOPF(opfPath);
      expect($("dc\\:title").text()).toBe("Test Book");
    });
  });
});
