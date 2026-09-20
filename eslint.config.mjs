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
    // The newui prototype is gitignored reference material, not shipped code.
    // It was being linted alongside the app, so its problems showed up in this
    // project's totals and buried the real ones. tsconfig.json excludes it for
    // the same reason.
    "newui/**",
  ]),
]);

export default eslintConfig;
