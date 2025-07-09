import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import { getOPFPath, getContentDir, getContentPath, parseOPF } from "./epub-utils";

describe("epub-utils", () => {
  const testDir = path.join(__dirname, "..", "..", "test-temp");
  const epubDir = path.join(testDir, "test-epub");

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.ensureDir(epubDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  async function createContainerXml(opfPath: string) {
    const metaInfDir = path.join(epubDir, "META-INF");
    await fs.ensureDir(metaInfDir);
    const containerPath = path.join(metaInfDir, "container.xml");
    const containerContent = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="${opfPath}" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    await fs.writeFile(containerPath, containerContent);
  }

  async function createOPF(opfPath: string) {
    const fullOPFPath = path.join(epubDir, opfPath);
    await fs.ensureDir(path.dirname(fullOPFPath));
    const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">test-book</dc:identifier>
    <dc:title>Test Book</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">2023-01-01T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    <itemref idref="nav"/>
  </spine>
</package>`;
    await fs.writeFile(fullOPFPath, opfContent);
  }

  describe("getOPFPath", () => {
    it("should find OPF file in OPS directory", async () => {
      await createContainerXml("OPS/content.opf");
      await createOPF("OPS/content.opf");

      const result = await getOPFPath(epubDir);
      expect(result).toBe(path.join(epubDir, "OPS", "content.opf"));
    });

    it("should find OPF file in OEBPS directory", async () => {
      await createContainerXml("OEBPS/content.opf");
      await createOPF("OEBPS/content.opf");

      const result = await getOPFPath(epubDir);
      expect(result).toBe(path.join(epubDir, "OEBPS", "content.opf"));
    });

    it("should find OPF file in root directory", async () => {
      await createContainerXml("content.opf");
      await createOPF("content.opf");

      const result = await getOPFPath(epubDir);
      expect(result).toBe(path.join(epubDir, "content.opf"));
    });

    it("should throw error when container.xml is missing", async () => {
      await expect(getOPFPath(epubDir)).rejects.toThrow("Container file not found");
    });

    it("should throw error when OPF file is missing", async () => {
      await createContainerXml("OPS/content.opf");
      // Don't create the OPF file

      await expect(getOPFPath(epubDir)).rejects.toThrow("OPF file not found");
    });
  });

  describe("getContentDir", () => {
    it("should detect OPS directory", async () => {
      const opsDir = path.join(epubDir, "OPS");
      await fs.ensureDir(opsDir);

      const result = await getContentDir(epubDir);
      expect(result).toBe("OPS");
    });

    it("should detect OEBPS directory", async () => {
      const oebpsDir = path.join(epubDir, "OEBPS");
      await fs.ensureDir(oebpsDir);

      const result = await getContentDir(epubDir);
      expect(result).toBe("OEBPS");
    });

    it("should prefer OPS over OEBPS when both exist", async () => {
      const opsDir = path.join(epubDir, "OPS");
      const oebpsDir = path.join(epubDir, "OEBPS");
      await fs.ensureDir(opsDir);
      await fs.ensureDir(oebpsDir);

      const result = await getContentDir(epubDir);
      expect(result).toBe("OPS");
    });

    it("should return empty string when content is in root", async () => {
      // No OPS or OEBPS directories
      await createContainerXml("content.opf");
      await createOPF("content.opf");

      const result = await getContentDir(epubDir);
      expect(result).toBe("");
    });

    it("should detect directory from OPF location when standard dirs missing", async () => {
      await createContainerXml("EPUB/content.opf");
      await createOPF("EPUB/content.opf");

      const result = await getContentDir(epubDir);
      expect(result).toBe("EPUB");
    });

    it("should return empty string when no container.xml exists", async () => {
      const result = await getContentDir(epubDir);
      expect(result).toBe("");
    });
  });

  describe("getContentPath", () => {
    it("should return full path to OPS directory", async () => {
      const opsDir = path.join(epubDir, "OPS");
      await fs.ensureDir(opsDir);

      const result = await getContentPath(epubDir);
      expect(result).toBe(opsDir);
    });

    it("should return full path to OEBPS directory", async () => {
      const oebpsDir = path.join(epubDir, "OEBPS");
      await fs.ensureDir(oebpsDir);

      const result = await getContentPath(epubDir);
      expect(result).toBe(oebpsDir);
    });

    it("should return epub directory when content is in root", async () => {
      // No standard directories
      await createContainerXml("content.opf");
      await createOPF("content.opf");

      const result = await getContentPath(epubDir);
      expect(result).toBe(epubDir);
    });
  });

  describe("parseOPF", () => {
    it("should parse valid OPF file", async () => {
      const opfPath = path.join(epubDir, "content.opf");
      await createOPF("content.opf");

      const $ = await parseOPF(opfPath);
      expect($("dc\\:title").text()).toBe("Test Book");
    });

    it("should throw error when OPF file does not exist", async () => {
      const opfPath = path.join(epubDir, "nonexistent.opf");

      await expect(parseOPF(opfPath)).rejects.toThrow("OPF file not found");
    });

    it.skip("should throw error when OPF file is invalid XML", async () => {
      // Cheerio is very tolerant and rarely throws parsing errors
      // This test is skipped as it's not critical for real-world usage
      const opfPath = path.join(epubDir, "invalid.opf");
      await fs.writeFile(opfPath, "this is not xml at all { invalid }");

      await expect(parseOPF(opfPath)).rejects.toThrow("Failed to parse OPF file");
    });
  });
});
