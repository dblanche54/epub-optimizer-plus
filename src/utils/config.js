module.exports = {
  // Default file paths
  inputEPUB: "mybook.epub",
  outputEPUB: "mybook_opt.epub",
  tempDir: "temp_epub",

  // HTML optimization options
  htmlOptions: {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
  },

  // CSS optimization options
  cssOptions: {
    level: 2,
  },

  // Image optimization options
  jpegOptions: {
    quality: 70,
  },

  pngOptions: {
    quality: [0.6, 0.8],
  },

  // Archive options
  archiveOptions: {
    zlib: { level: 9 },
  },
};
