#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const localesDir = path.join(repoRoot, "ui", "src", "i18n", "locales");

export function flattenKeys(obj, prefix = "") {
  const result = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      result.push(...flattenKeys(val, fullKey));
    } else {
      result.push(fullKey);
    }
  }
  return result;
}

export function compareKeys(reference, candidate) {
  const refKeys = new Set(flattenKeys(reference));
  const candKeys = new Set(flattenKeys(candidate));

  const missing = [...refKeys].filter((k) => !candKeys.has(k));
  const extra = [...candKeys].filter((k) => !refKeys.has(k));

  return { missing, extra };
}

function loadLocale(filePath) {
  const raw = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${path.basename(filePath)}: ${err.message}`);
    process.exit(1);
  }
}

function main() {
  if (!existsSync(localesDir)) {
    console.error(`Locales directory not found: ${localesDir}`);
    process.exit(1);
  }

  const entries = readdirSync(localesDir, { withFileTypes: true });
  const localeFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort();

  const enIndex = localeFiles.indexOf("en.json");
  if (enIndex === -1) {
    console.error("en.json not found in locales directory");
    process.exit(1);
  }

  const en = loadLocale(path.join(localesDir, "en.json"));

  if (typeof en !== "object" || en === null || Array.isArray(en)) {
    console.error("en.json must contain a root object");
    process.exit(1);
  }

  let hasStale = false;

  for (const file of localeFiles) {
    if (file === "en.json") continue;

    const locale = file.replace(/\.json$/, "");
    const localeData = loadLocale(path.join(localesDir, file));

    if (typeof localeData !== "object" || localeData === null || Array.isArray(localeData)) {
      console.error(`${file} must contain a root object`);
      process.exit(1);
    }

    const { missing, extra } = compareKeys(en, localeData);

    if (missing.length > 0) {
      hasStale = true;
      console.error(`\n[STALE] ${locale} is missing ${missing.length} key(s):`);
      for (const k of missing) {
        console.error(`  - ${k}`);
      }
    }

    if (extra.length > 0) {
      hasStale = true;
      console.error(`\n[EXTRA] ${locale} has ${extra.length} key(s) not present in English:`);
      for (const k of extra) {
        console.error(`  - ${k}`);
      }
    }
  }

  if (!hasStale) {
    console.log("All locale files are in sync with en.json");
  }

  process.exit(hasStale ? 1 : 0);
}

const url = new URL(import.meta.url);
const isEntryPoint = process.argv[1] === url.pathname || process.argv[1] === url.href;
if (isEntryPoint) {
  main();
}
