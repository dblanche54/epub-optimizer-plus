import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", "temp_epub/**"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
  // For all TypeScript files
  {
    files: ["**/*.ts", "**/*.d.ts"],
    languageOptions: {
      parser: tseslint.parser,
      // Disable the project option since it's causing issues with test files
      // parserOptions: {
      //   project: true,
      //   tsconfigRootDir: ".",
      // },
    },
    rules: {
      // Disable rules that require type information since we're not using the project option
      "@typescript-eslint/no-floating-promises": "off",
    },
  }
);
