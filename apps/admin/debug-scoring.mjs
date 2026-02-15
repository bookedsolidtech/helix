/**
 * Debug script to examine actual scoring behavior
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Simulate the hasDocsPage function
function hasDocsPage(tagName) {
  const docsRoot = resolve(process.cwd(), "../docs");
  const docsPath = resolve(docsRoot, `src/content/docs/component-library/${tagName}.mdx`);
  const exists = existsSync(docsPath);
  console.log(`\nDocs check for ${tagName}:`);
  console.log(`  Path: ${docsPath}`);
  console.log(`  Exists: ${exists}`);
  return exists;
}

// Test all components
const components = [
  "wc-alert",
  "wc-badge",
  "wc-button",
  "wc-card",
  "wc-checkbox",
  "wc-container",
  "wc-form",
  "wc-prose",
  "wc-radio",
  "wc-radio-group",
  "wc-select",
  "wc-switch",
  "wc-text-input",
  "wc-textarea",
];

console.log("Current working directory:", process.cwd());
console.log("\n=== Testing Docs Detection ===");

for (const comp of components) {
  hasDocsPage(comp);
}

console.log("\n=== Summary ===");
const withDocs = components.filter(c => hasDocsPage(c));
console.log(`Components with docs: ${withDocs.length}/${components.length}`);
console.log(`Missing docs: ${components.filter(c => !hasDocsPage(c)).join(", ") || "none"}`);
