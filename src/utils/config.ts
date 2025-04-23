const config = {
  // Default file paths
  inputEPUB: "mybook.epub",
  outputEPUB: "mybook_opt.epub",
  tempDir: "temp_epub",

  // Language settings
  lang: "fr", // Current language (fr = French, en = English)
  defaultLang: "en",

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

  // EPUBCheck path
  epubcheckPath: "epubcheck/epubcheck.jar",

  // UI Localization
  labels: {
    fr: {
      cover: "Couverture",
    },
    en: {
      cover: "Cover",
    },
  },
};

export default config;
