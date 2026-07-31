import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const from = resolve("app/globals.css");
const to = resolve(".design-sync/.cache/tailwind-build.css");
const css = readFileSync(from, "utf8");

const result = await postcss([tailwindcss({ base: process.cwd() })]).process(css, { from, to });
writeFileSync(to, result.css);
console.log(`wrote ${to} (${(result.css.length / 1024).toFixed(0)} KB)`);
