import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.template.js",
    "dist/**", ".vercel/**", ".vinext/**", ".wrangler/**",
    "output/**", "tmp/**", ".playwright-cli/**", "**/*.tsbuildinfo",
    "리코더 운지 - Google Play package/**",
  ]),
]);

export default eslintConfig;
