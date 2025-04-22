import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "node:os";
import { execSync } from "node:child_process";
import { optimizeEPUB } from "./index";
import { parseArguments } from "./cli";
import type { Args } from "./types";

// Mock the CLI module to avoid parsing real argv
vi.mock("./cli", async (importOriginal) => {
  const originalModule = await importOriginal<typeof import("./cli")>();
  return {
    ...originalModule,
    parseArguments: vi.fn(),
  };
});

describe("EPUB Optimization Integration Tests", () => {
  const tempDir = path.join(os.tmpdir(), "epub-optimizer-integration-test");
  const mockInputEpub = path.join(tempDir, "input.epub");
  const mockOutputEpub = path.join(tempDir, "output.epub");
  const extractDir = path.join(tempDir, "extract");

  // Mock the args that would normally come from CLI
  const mockArgs: Args = {
    input: mockInputEpub,
    output: mockOutputEpub,
    temp: extractDir,
    clean: true,
    "jpg-quality": 80,
    jpgQuality: 80,
    "png-quality": [0.6, 0.8],
    pngQuality: [0.6, 0.8],
    _: [],
    $0: "epub-optimizer",
  };

  beforeEach(async () => {
    // Create the test directory
    await fs.ensureDir(tempDir);

    // Mock the parseArguments to return our test args
    vi.mocked(parseArguments).mockResolvedValue(mockArgs);

    // Create a minimal valid EPUB for testing
    await createMinimalEpub(mockInputEpub);

    // Spy on console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    // Clean up test files
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("optimizes an EPUB file end-to-end", async () => {
    // Run the optimization process
    const result = await optimizeEPUB();

    // Verify successful completion
    expect(result).toEqual({
      success: true,
      input: mockInputEpub,
      output: mockOutputEpub,
    });

    // Verify output file exists
    expect(await fs.pathExists(mockOutputEpub)).toBe(true);

    // Verify temporary files were cleaned up
    expect(await fs.pathExists(extractDir)).toBe(false);
  });

  it("optimizes an EPUB and preserves temporary files when clean=false", async () => {
    // Override the clean flag
    vi.mocked(parseArguments).mockResolvedValue({
      ...mockArgs,
      clean: false,
    });

    // Run the optimization process
    await optimizeEPUB();

    // Verify temporary files were preserved
    expect(await fs.pathExists(extractDir)).toBe(true);
  });

  it("handles missing input file gracefully", async () => {
    // Override the input to a non-existent file
    const nonExistentInput = path.join(tempDir, "nonexistent.epub");
    vi.mocked(parseArguments).mockResolvedValue({
      ...mockArgs,
      input: nonExistentInput,
    });

    // Delete the input file if it somehow exists
    if (await fs.pathExists(nonExistentInput)) {
      await fs.unlink(nonExistentInput);
    }

    // Should throw an error about the missing input file
    await expect(optimizeEPUB()).rejects.toThrow("Input file not found");
  });

  it("optimizes an EPUB with custom quality settings", async () => {
    // Override quality settings
    vi.mocked(parseArguments).mockResolvedValue({
      ...mockArgs,
      jpgQuality: 90,
      pngQuality: [0.7, 0.9],
    });

    // Run the optimization process
    await optimizeEPUB();

    // Verify successful output
    expect(await fs.pathExists(mockOutputEpub)).toBe(true);
  });

  it("optimizes an EPUB with no images gracefully", async () => {
    // Create a minimal EPUB with no images
    const noImageEpub = path.join(tempDir, "no-image.epub");
    const noImageExtractDir = path.join(tempDir, "no-image-extract");
    const noImageOutput = path.join(tempDir, "no-image-output.epub");

    // Helper to create a no-image EPUB
    await createMinimalEpub(noImageEpub, { withImage: false });

    // Mock args for this test
    vi.mocked(parseArguments).mockResolvedValue({
      ...mockArgs,
      input: noImageEpub,
      output: noImageOutput,
      temp: noImageExtractDir,
    });

    // Run the optimizer
    const result = await optimizeEPUB();

    // Should succeed
    expect(result.success).toBe(true);
    expect(await fs.pathExists(noImageOutput)).toBe(true);
  });
});

// Update the helper to accept an options object
async function createMinimalEpub(filePath: string, opts: { withImage?: boolean } = {}) {
  // This is a simplified version that depends on your environment
  // In a real implementation, you would create a valid EPUB structure and zip it
  // For testing purposes, we'll create a mock file

  const tempStructureDir = path.join(path.dirname(filePath), "temp-epub-structure");
  await fs.ensureDir(tempStructureDir);

  // Create mimetype file (must be first in the ZIP with no compression)
  await fs.writeFile(path.join(tempStructureDir, "mimetype"), "application/epub+zip");

  // Create META-INF directory
  await fs.ensureDir(path.join(tempStructureDir, "META-INF"));

  // Create container.xml
  await fs.writeFile(
    path.join(tempStructureDir, "META-INF", "container.xml"),
    `<?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
        <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
      </rootfiles>
    </container>`
  );

  // Create content OPF file
  await fs.writeFile(
    path.join(tempStructureDir, "content.opf"),
    `<?xml version="1.0"?>
    <package xmlns="http://www.idpf.org/2007/opf">
      <metadata>
        <dc:title>Test Book</dc:title>
        <dc:language>en</dc:language>
        <dc:identifier>test-id</dc:identifier>
      </metadata>
      <manifest>
        <item id="content" href="content.html" media-type="application/xhtml+xml"/>
        ${opts.withImage === false ? "" : '<item id="image" href="image.jpg" media-type="image/jpeg"/>'}
      </manifest>
      <spine>
        <itemref idref="content"/>
      </spine>
    </package>`
  );

  // Create a minimal HTML file
  await fs.writeFile(
    path.join(tempStructureDir, "content.html"),
    `<!DOCTYPE html>
    <html>
      <head><title>Test</title></head>
      <body><h1>Hello World</h1>${opts.withImage === false ? "" : '<img src="image.jpg" alt="Test Image">'}</body>
    </html>`
  );

  // Only add image if requested
  if (opts.withImage !== false) {
    const testImageBuffer = Buffer.alloc(1000, 0xff);
    await fs.writeFile(path.join(tempStructureDir, "image.jpg"), testImageBuffer);
  }

  // Use the system ZIP command to create the EPUB (if available)
  try {
    // Create EPUB archive
    const createZipCmd = `cd "${tempStructureDir}" && zip -X0 "${filePath}" mimetype && zip -Xr9D "${filePath}" . -x mimetype`;
    execSync(createZipCmd);

    // Cleanup temp structure
    await fs.remove(tempStructureDir);
  } catch (error) {
    // Fallback if zip command fails or isn't available
    console.error("Failed to create test EPUB using zip command:", error);

    // Just create a dummy file so tests can proceed
    await fs.writeFile(filePath, "dummy epub content");
  }
}
