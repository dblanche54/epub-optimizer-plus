const fs = require("fs-extra");
const path = require("path");
// Using dynamic imports for all imagemin-related modules
const config = require("../utils/config");

/**
 * Optimize images in a directory recursively
 * @param {string} dir - Directory containing images
 */
async function optimizeImages(dir) {
  const entries = await fs.readdir(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await optimizeImages(fullPath);
    } else if (/\.(jpe?g|png)$/i.test(entry)) {
      await compressImage(fullPath, dir);
    }
  }
}

/**
 * Compress a single image
 * @param {string} imagePath - Path to image file
 * @param {string} destination - Destination directory
 */
async function compressImage(imagePath, destination) {
  // Dynamically import imagemin and its plugins
  const [imagemin, imageminMozjpeg, imageminPngquant] = await Promise.all([
    import("imagemin"),
    import("imagemin-mozjpeg"),
    import("imagemin-pngquant"),
  ]);

  await imagemin.default([imagePath], {
    destination,
    plugins: [
      imageminMozjpeg.default(config.jpegOptions),
      imageminPngquant.default(config.pngOptions),
    ],
  });
}

module.exports = {
  optimizeImages,
};
