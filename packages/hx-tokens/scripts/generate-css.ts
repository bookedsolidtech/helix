import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface TokenDef {
  value: string;
}

function flatten(
  obj: Record<string, unknown>,
  prefix: string[] = [],
): { name: string; value: string }[] {
  const entries: { name: string; value: string }[] = [];

  for (const [key, val] of Object.entries(obj)) {
    const path = [...prefix, key];
    if (typeof val === 'object' && val !== null && 'value' in val) {
      entries.push({
        name: `--hx-${path.join('-')}`,
        value: (val as TokenDef).value,
      });
    } else if (typeof val === 'object' && val !== null) {
      entries.push(...flatten(val as Record<string, unknown>, path));
    }
  }

  return entries;
}

const jsonPath = resolve(__dirname, '../src/tokens.json');
const tokens = JSON.parse(readFileSync(jsonPath, 'utf-8'));

// Separate dark mode tokens from the rest
const { dark: darkTokens, ...lightTokens } = tokens;

// Generate light mode (all primitive + semantic tokens)
const lightEntries = flatten(lightTokens);

// Generate dark mode overrides
const darkEntries = darkTokens ? flatten(darkTokens) : [];

// Build the 3 CSS blocks
const lines: string[] = [];

// Block 1: :root with all light mode tokens (primitives + semantics)
lines.push(`:root {`);
for (const t of lightEntries) {
  lines.push(`  ${t.name}: ${t.value};`);
}
lines.push(`}`);
lines.push(``);

if (darkEntries.length > 0) {
  // Block 2: @media prefers-color-scheme: dark — auto dark mode
  // Only applies when the user has NOT explicitly set data-theme="light"
  lines.push(`@media (prefers-color-scheme: dark) {`);
  lines.push(`  :root:not([data-theme="light"]) {`);
  for (const t of darkEntries) {
    lines.push(`    ${t.name}: ${t.value};`);
  }
  lines.push(`  }`);
  lines.push(`}`);
  lines.push(``);

  // Block 3: :root[data-theme="dark"] — manual dark mode override
  lines.push(`:root[data-theme="dark"] {`);
  for (const t of darkEntries) {
    lines.push(`  ${t.name}: ${t.value};`);
  }
  lines.push(`}`);
  lines.push(``);
}

const css = lines.join('\n');

const outDir = resolve(__dirname, '../dist');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'tokens.css'), css, 'utf-8');

console.log(
  `Generated dist/tokens.css (${lightEntries.length} light tokens, ${darkEntries.length} dark overrides)`,
);
