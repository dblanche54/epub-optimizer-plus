// src/scripts/ops/decode-entities.ts
import { promises as fs } from "fs";
import path from "path";
import fg from "fast-glob";
import * as cheerio from "cheerio";
import { decodeXML } from "entities";

export default async function decodeEntitiesOp(rootDir: string) {
  const root = rootDir.replace(/\\/g, "/");
  const patterns = [
    path.posix.join(root, "**/*.xhtml"),
    path.posix.join(root, "**/*.html"),
  ];

  const files = await fg(patterns, { dot: true });
  for (const file of files) {
    const src = await fs.readFile(file, "utf8");

    // Cheerio v1: use { xml: true } for XHTML
    const $ = cheerio.load(src, { xml: true });

    // Decode text nodes
    $("*")
      .contents()
      .each((_, node) => {
        if (node.type === "text" && node.data) {
          const dec = decodeXML(node.data);
          if (dec !== node.data) node.data = dec;
        }
      });

    // Decode attribute values
    $("*").each((_, el) => {
      const attribs = (el as any).attribs as Record<string, string> | undefined;
      if (!attribs) return;
      for (const key of Object.keys(attribs)) {
        const v = attribs[key];
        const dec = decodeXML(v);
        if (dec !== v) attribs[key] = dec;
      }
    });

    const out = $.xml(); // re-escapes only XML-reserved chars
    if (out !== src) {
      await fs.writeFile(file, out, "utf8");
      console.log("[decode-entities] Updated:", file);
    }
  }

  console.log(`[decode-entities] Done. Processed ${files.length} files.`);
}
