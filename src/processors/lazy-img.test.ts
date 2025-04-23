import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { addLazyLoadingToImages } from "./lazy-img";

const tempDir = path.join(os.tmpdir(), "epub-optimizer-test-lazy-img");
const opsDir = path.join(tempDir, "OPS");

const xhtmlWithImg = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><img src="foo.jpg" /></body></html>`;
const xhtmlWithLazy = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><img src="foo.jpg" loading="lazy"/></body></html>`;
const xhtmlNoImg = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><p>No images here</p></body></html>`;

describe("addLazyLoadingToImages", () => {
  beforeEach(async () => {
    await fs.remove(tempDir);
    await fs.ensureDir(opsDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('adds loading="lazy" to <img> tags', async () => {
    const file = path.join(opsDir, "test.xhtml");
    await fs.writeFile(file, xhtmlWithImg);
    await addLazyLoadingToImages(tempDir);
    const result = await fs.readFile(file, "utf8");
    expect(result).toContain('loading="lazy"');
  });

  it('does not duplicate loading="lazy" if already present', async () => {
    const file = path.join(opsDir, "test.xhtml");
    await fs.writeFile(file, xhtmlWithLazy);
    await addLazyLoadingToImages(tempDir);
    const result = await fs.readFile(file, "utf8");
    // Should only be one loading="lazy"
    expect(result.match(/loading="lazy"/g)?.length).toBe(1);
  });

  it("skips files with no <img> tags", async () => {
    const file = path.join(opsDir, "noimg.xhtml");
    await fs.writeFile(file, xhtmlNoImg);
    await addLazyLoadingToImages(tempDir);
    const result = await fs.readFile(file, "utf8");
    expect(result).toContain("No images here");
    expect(result).not.toContain('loading="lazy"');
  });
});
