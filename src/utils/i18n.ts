import config from "./config.js";

/**
 * Gets a localized label for the cover
 * @returns The localized string for "cover" in the current language or default language
 */
export function getCoverLabel(): string {
  const lang = config.lang || config.defaultLang;

  return config.labels?.[lang as keyof typeof config.labels]?.cover;
}
