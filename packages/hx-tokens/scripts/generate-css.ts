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

// Separate dark mode, high-contrast, and the component manifest from the
// light/baseline cascade. The `component:` block is intentionally NOT emitted
// to CSS — per-component tokens are authored inline in each component's
// `.styles.ts` file so the cascade-driven "undefined unless overridden"
// semantics are preserved (consumers override at the semantic tier; component
// tokens have no default and inherit from the semantics they reference).
// The block exists in tokens.json purely as a manifest for the Figma kit and
// audit tooling. Sync between this manifest and the inline-authored tokens is
// gated by `src/__tests__/component-manifest-sync.test.ts`.
const {
  dark: darkTokens,
  'high-contrast': hcTokens,
  component: _componentManifest,
  ...lightTokens
} = tokens;
void _componentManifest;

// Generate light mode (all primitive + semantic tokens)
const lightEntries = flatten(lightTokens);

// Generate dark mode overrides
const darkEntries = darkTokens ? flatten(darkTokens) : [];

// Generate high-contrast overrides
const hcEntries = hcTokens ? flatten(hcTokens as Record<string, unknown>) : [];

// Build the CSS blocks
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

if (hcEntries.length > 0) {
  // Block 4: @media prefers-contrast: more — auto high-contrast mode
  // Only applies when the user has NOT explicitly set data-hx-contrast="normal"
  // or data-theme="light"/"dark" (those opt out of OS-driven HC promotion).
  lines.push(`@media (prefers-contrast: more) {`);
  lines.push(
    `  :root:not([data-hx-contrast="normal"]):not([data-theme="light"]):not([data-theme="dark"]) {`,
  );
  for (const t of hcEntries) {
    lines.push(`    ${t.name}: ${t.value};`);
  }
  lines.push(`  }`);
  lines.push(`}`);
  lines.push(``);

  // Block 5: manual high-contrast override.
  //
  // Two selectors flip the same token cascade:
  //
  //   - `[data-hx-contrast="high"]` — original orthogonal contrast attribute,
  //     stackable on top of `data-theme` (e.g. dark + high-contrast).
  //   - `[data-theme="high-contrast"]` — third value on the canonical theme
  //     attribute. Storybook's @storybook/addon-themes withThemeByDataAttribute
  //     toolbar drives the three modes (light/dark/high-contrast) through this
  //     attribute; without this selector the toolbar would set the attribute
  //     but the token cascade would not flip, leaving HC mode visually
  //     identical to whichever mode preceded it. Consumers who want a manual
  //     HC toggle (brand registries doing forced-color emulation, Storybook
  //     docs, audit tooling) get a single attribute that mirrors the
  //     light/dark convention.
  //
  // Both selectors share the same token block so the two driver paths are
  // always equivalent. The grouped selector means a brand-overrides
  // stylesheet can target either driver and reach the same HC fallback.
  lines.push(`:root[data-hx-contrast="high"],\n:root[data-theme="high-contrast"] {`);
  for (const t of hcEntries) {
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
  `Generated dist/tokens.css (${lightEntries.length} light tokens, ${darkEntries.length} dark overrides, ${hcEntries.length} high-contrast overrides)`,
);
