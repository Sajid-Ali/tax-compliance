import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Must come after the Next.js configs so it can disable their stylistic
  // rules — Prettier owns formatting, ESLint owns correctness, and letting
  // both enforce style causes contradictory autofixes.
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated design-sync tooling caches (component preview bundler +
    // vendored React for it) — not hand-authored source, shouldn't be linted.
    ".ds-sync/**",
    ".design-sync/**",
    "ds-bundle/**",
  ]),
]);

export default eslintConfig;
