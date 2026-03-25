#!/usr/bin/env node
/* global console, process */

/**
 * generate-drupal-libraries.js
 *
 * Reads the Custom Elements Manifest (CEM) and generates a valid Drupal
 * libraries.yml file for the @helixui/library web component set.
 *
 * Usage:
 *   node scripts/generate-drupal-libraries.js [--output <path>] [--base-path <path>]
 *
 * Options:
 *   --output     Output file path (default: drupal/helix.libraries.yml)
 *   --base-path  Base URL path for assets in Drupal (default: /libraries/helix)
 *
 * The generated file contains:
 *   - hx-tokens: standalone design token library
 *   - One entry per component directory (e.g. hx-button, hx-card)
 *   - Category bundles: helix/core, helix/forms, helix/navigation,
 *     helix/data-display, helix/feedback, helix/layout
 *   - helix/all: the full library bundle
 *
 * AUTO-GENERATED output — do not edit helix.libraries.yml manually.
 * Regenerate with: node scripts/generate-drupal-libraries.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const cemPath = join(rootDir, 'custom-elements.json');
const pkgPath = join(rootDir, 'package.json');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const outputPath = getArg('--output') ?? join(rootDir, 'drupal', 'helix.libraries.yml');
const basePath = getArg('--base-path') ?? '/libraries/helix';

// ---------------------------------------------------------------------------
// Category bundles — mirrors COMPONENT_BUNDLES in create-helix-app/templates.ts
// Only components that actually exist in the CEM are included per bundle.
// ---------------------------------------------------------------------------

/**
 * Maps bundle IDs to the component directory names they include.
 * These are component *directory* names (hx-button, hx-card, etc.) rather
 * than individual tag names so that compound components (e.g. hx-accordion
 * which includes hx-accordion-item) are included as a unit.
 */
const CATEGORY_BUNDLES = {
  core: [
    'hx-button',
    'hx-icon-button',
    'hx-button-group',
    'hx-split-button',
    'hx-card',
    'hx-badge',
    'hx-text',
    'hx-icon',
    'hx-avatar',
    'hx-divider',
    'hx-tag',
    'hx-tooltip',
    'hx-popover',
    'hx-link',
    'hx-image',
    'hx-prose',
    'hx-copy-button',
    'hx-visually-hidden',
  ],
  forms: [
    'hx-text-input',
    'hx-select',
    'hx-checkbox',
    'hx-checkbox-group',
    'hx-radio-group',
    'hx-switch',
    'hx-textarea',
    'hx-field',
    'hx-field-label',
    'hx-help-text',
    'hx-combobox',
    'hx-slider',
    'hx-color-picker',
    'hx-date-picker',
    'hx-time-picker',
    'hx-file-upload',
    'hx-number-input',
    'hx-rating',
    'hx-form',
  ],
  navigation: [
    'hx-nav',
    'hx-side-nav',
    'hx-top-nav',
    'hx-tabs',
    'hx-breadcrumb',
    'hx-pagination',
    'hx-menu',
    'hx-overflow-menu',
    'hx-tree-view',
    'hx-steps',
    'hx-action-bar',
  ],
  'data-display': [
    'hx-data-table',
    'hx-table',
    'hx-stat',
    'hx-counter',
    'hx-progress-bar',
    'hx-progress-ring',
    'hx-meter',
    'hx-structured-list',
    'hx-code-snippet',
    'hx-status-indicator',
    'hx-format-date',
    'hx-list',
  ],
  feedback: [
    'hx-alert',
    'hx-toast',
    'hx-dialog',
    'hx-drawer',
    'hx-banner',
    'hx-skeleton',
    'hx-spinner',
    'hx-toggle-button',
  ],
  layout: [
    'hx-grid',
    'hx-stack',
    'hx-split-panel',
    'hx-accordion',
    'hx-carousel',
    'hx-container',
    'hx-popup',
    'hx-dropdown',
    'hx-theme',
  ],
};

// ---------------------------------------------------------------------------
// Read inputs
// ---------------------------------------------------------------------------

if (!existsSync(cemPath)) {
  console.error(`ERROR: custom-elements.json not found at ${cemPath}`);
  console.error('Run `pnpm run cem` first to generate the manifest.');
  process.exit(1);
}

const cem = JSON.parse(readFileSync(cemPath, 'utf-8'));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;

// ---------------------------------------------------------------------------
// Derive component directories from the CEM
// Each directory becomes one Drupal library entry.
// ---------------------------------------------------------------------------

/**
 * componentDirs: Set of component directory names (hx-button, hx-card, …)
 * that have at least one custom element defined in the CEM.
 */
const componentDirs = new Set();

for (const mod of cem.modules ?? []) {
  for (const decl of mod.declarations ?? []) {
    if (decl.customElement && decl.tagName) {
      const match = mod.path.match(/src\/components\/(hx-[^/]+)\//);
      if (match) {
        componentDirs.add(match[1]);
      }
    }
  }
}

const sortedDirs = [...componentDirs].sort();

// ---------------------------------------------------------------------------
// YAML helpers
// ---------------------------------------------------------------------------

/**
 * Produce a YAML block for a single component library entry.
 *
 * @param {string} tag - Component directory name, e.g. 'hx-button'
 * @param {string} ver - Library version string
 * @param {string} base - Base asset path, e.g. '/libraries/helix'
 * @param {string[]} deps - Additional Drupal library dependencies
 * @returns {string} YAML snippet (without the leading entry key)
 */
function componentEntry(tag, ver, base, deps = []) {
  const jsPath = `${base}/dist/components/${tag}/index.js`;
  const allDeps = ['helix/hx-tokens', ...deps];
  const depsYaml = allDeps.map((d) => `    - ${d}`).join('\n');

  return [
    `  version: ${ver}`,
    `  js:`,
    `    ${jsPath}: { attributes: { type: module }, minified: true }`,
    `  dependencies:`,
    depsYaml,
  ].join('\n');
}

/**
 * Produce a YAML block for a bundle (category or 'all') library entry.
 *
 * @param {string[]} includedDirs - Component directory names in this bundle
 * @param {string} ver - Version string
 * @returns {string} YAML snippet
 */
function bundleEntry(includedDirs, ver) {
  const depsYaml = includedDirs.map((d) => `    - helix/${d}`).join('\n');
  return [`  version: ${ver}`, `  dependencies:`, depsYaml].join('\n');
}

// ---------------------------------------------------------------------------
// Build YAML
// ---------------------------------------------------------------------------

const lines = [];

// Header comment
lines.push(
  [
    `# helix.libraries.yml`,
    `#`,
    `# Drupal asset library definitions for @helixui/library v${version}`,
    `#`,
    `# AUTO-GENERATED — do not edit this file manually.`,
    `# Regenerate with: node packages/hx-library/scripts/generate-drupal-libraries.js`,
    `#`,
    `# Usage in Twig:`,
    `#   {{ attach_library('helix/hx-button') }}`,
    `#   {{ attach_library('helix/core') }}`,
    `#   {{ attach_library('helix/all') }}`,
    `#`,
    `# Asset base path: ${basePath}`,
  ].join('\n'),
);

lines.push('');

// ---------------------------------------------------------------------------
// hx-tokens entry — standalone design token library
// ---------------------------------------------------------------------------
lines.push('# Design token CSS custom properties (foundation for all components)');
lines.push('hx-tokens:');
lines.push(`  version: ${version}`);
lines.push(`  css:`);
lines.push(`    theme:`);
lines.push(`      ${basePath}/dist/tokens.css: {}`);
lines.push('');

// ---------------------------------------------------------------------------
// Per-component entries
// ---------------------------------------------------------------------------
lines.push('# ─────────────────────────────────────────────────────────────────');
lines.push('# Individual component libraries');
lines.push('# Use these for surgical per-page loading (best performance).');
lines.push('# ─────────────────────────────────────────────────────────────────');
lines.push('');

for (const dir of sortedDirs) {
  lines.push(`${dir}:`);
  lines.push(componentEntry(dir, version, basePath));
  lines.push('');
}

// ---------------------------------------------------------------------------
// Category bundle entries
// ---------------------------------------------------------------------------
lines.push('# ─────────────────────────────────────────────────────────────────');
lines.push('# Category bundles');
lines.push('# Use these to load a logical group of related components.');
lines.push('# ─────────────────────────────────────────────────────────────────');
lines.push('');

for (const [bundleId, requestedDirs] of Object.entries(CATEGORY_BUNDLES)) {
  // Only include components that actually exist in this build
  const availableDirs = requestedDirs.filter((d) => componentDirs.has(d));

  if (availableDirs.length === 0) {
    continue;
  }

  lines.push(`${bundleId}:`);
  lines.push(bundleEntry(availableDirs, version));
  lines.push('');
}

// ---------------------------------------------------------------------------
// helix/all — full library entry
// ---------------------------------------------------------------------------
lines.push('# ─────────────────────────────────────────────────────────────────');
lines.push('# Full library bundle — loads every component');
lines.push('# Use for prototyping or when most components are needed site-wide.');
lines.push('# ─────────────────────────────────────────────────────────────────');
lines.push('');
lines.push('all:');
lines.push(bundleEntry(sortedDirs, version));
lines.push('');

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outputDir = dirname(outputPath);
mkdirSync(outputDir, { recursive: true });

const content = lines.join('\n');
writeFileSync(outputPath, content, 'utf-8');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const bundleCount = Object.keys(CATEGORY_BUNDLES).length + 1; // categories + all
console.log(`Generated Drupal libraries.yml`);
console.log(`  Components : ${sortedDirs.length}`);
console.log(`  Bundles    : ${bundleCount} (${Object.keys(CATEGORY_BUNDLES).join(', ')}, all)`);
console.log(`  Version    : ${version}`);
console.log(`  Base path  : ${basePath}`);
console.log(`  Output     : ${outputPath}`);
