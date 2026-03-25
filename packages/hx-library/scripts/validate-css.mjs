/**
 * CSS Bundle Validator for @helixui/library
 *
 * Verifies that:
 * - All component CSS files exist in dist/css/
 * - Required bundle files exist
 * - manifest.json is present and non-empty
 * - helix-tokens.css contains :root declarations
 *
 * Run: node scripts/validate-css.mjs
 * Exit code 0 = pass, 1 = fail
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(ROOT, 'src/components');
const OUT_DIR = resolve(ROOT, 'dist/css');

let hasErrors = false;

function fail(msg) {
  console.error(`[css-validate] ✗ ${msg}`);
  hasErrors = true;
}

function pass(msg) {
  console.log(`[css-validate] ✓ ${msg}`);
}

function check(condition, passMsg, failMsg) {
  if (condition) {
    pass(passMsg);
  } else {
    fail(failMsg);
  }
}

// Check dist/css/ exists
check(existsSync(OUT_DIR), 'dist/css/ directory exists', 'dist/css/ directory missing — run pnpm run css:build');

if (!existsSync(OUT_DIR)) {
  process.exit(1);
}

// Check required bundle files
const requiredBundles = [
  'helix-all.css',
  'helix-tokens.css',
  'manifest.json',
  'helix-core.css',
  'helix-forms.css',
  'helix-navigation.css',
];

for (const file of requiredBundles) {
  check(existsSync(join(OUT_DIR, file)), `${file} exists`, `${file} missing — run pnpm run css:build`);
}

// Check helix-tokens.css has :root declaration
const tokensFile = join(OUT_DIR, 'helix-tokens.css');
if (existsSync(tokensFile)) {
  const tokensContent = readFileSync(tokensFile, 'utf-8');
  check(
    tokensContent.includes(':root'),
    'helix-tokens.css contains :root declaration',
    'helix-tokens.css is missing :root declaration',
  );
  check(
    tokensContent.includes('--hx-'),
    'helix-tokens.css contains --hx-* custom properties',
    'helix-tokens.css has no --hx-* custom properties',
  );
}

// Check manifest.json is valid and non-empty
const manifestFile = join(OUT_DIR, 'manifest.json');
if (existsSync(manifestFile)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf-8'));
    check(
      Array.isArray(manifest.components) && manifest.components.length > 0,
      `manifest.json has ${manifest.components?.length ?? 0} components`,
      'manifest.json has no components',
    );
    check(
      typeof manifest.bundles === 'object' && Object.keys(manifest.bundles ?? {}).length > 0,
      'manifest.json has bundle entries',
      'manifest.json has no bundle entries',
    );
  } catch {
    fail('manifest.json is not valid JSON');
  }
}

// Check each component has a CSS file
if (existsSync(COMPONENTS_DIR)) {
  const componentDirs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
    .map((d) => d.name);

  let missingCount = 0;
  for (const name of componentDirs) {
    const cssFile = join(OUT_DIR, `${name}.css`);
    if (!existsSync(cssFile)) {
      fail(`Missing CSS file for component: ${name}`);
      missingCount++;
    }
  }
  if (missingCount === 0) {
    pass(`All ${componentDirs.length} component CSS files present`);
  }
}

// Check helix-all.css is non-empty and contains CSS
const allFile = join(OUT_DIR, 'helix-all.css');
if (existsSync(allFile)) {
  const allContent = readFileSync(allFile, 'utf-8');
  check(
    allContent.length > 100,
    'helix-all.css is non-empty',
    'helix-all.css appears to be empty or nearly empty',
  );
  check(
    allContent.includes('--hx-') || allContent.includes(':host'),
    'helix-all.css contains component styles',
    'helix-all.css does not contain expected component styles',
  );
}

if (hasErrors) {
  console.error('\n[css-validate] Validation FAILED. Run pnpm run css:build to regenerate.');
  process.exit(1);
} else {
  console.log('\n[css-validate] All checks passed.');
  process.exit(0);
}
