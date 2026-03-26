#!/usr/bin/env tsx
/**
 * generate-drupal-libraries.ts
 *
 * Reads the Custom Elements Manifest (CEM) produced by @helixui/library and
 * generates a valid Drupal 10/11 libraries.yml file for the drupal-starter
 * package.  The output file is `packages/drupal-starter/helixui.libraries.yml`.
 *
 * Usage:
 *   pnpm run generate:drupal-libraries
 *   pnpm run generate:drupal-libraries -- --cdn          # CDN (unpkg) mode
 *   pnpm run generate:drupal-libraries -- --base-path /libraries/helixui
 *
 * Options:
 *   --cdn            Use unpkg CDN URLs instead of local /libraries/ paths
 *   --base-path      Override the local asset base path
 *                    (default: /libraries/helixui)
 *   --output         Override the output file path
 *                    (default: packages/drupal-starter/helixui.libraries.yml)
 *
 * Generated sections:
 *   helixui/core     — tokens CSS + full JS runtime (safe default for most pages)
 *   helixui/<tag>    — per-component entry (use for surgical per-page loading)
 *   helixui/all      — convenience entry that pulls in every component
 *   helixui/helixui-behaviors           — Drupal behaviors JS (static)
 *   helixui/helixui-form-behaviors      — form-specific behaviors (static)
 *   helixui/helix-theme-overrides       — theme CSS (static)
 *   helixui/helix-form-layout           — form layout CSS (static)
 *
 * AUTO-GENERATED — do not edit helixui.libraries.yml manually.
 * Regenerate with: pnpm run generate:drupal-libraries
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const cemPath = join(rootDir, 'packages/hx-library/custom-elements.json');
const pkgPath = join(rootDir, 'packages/hx-library/package.json');
const defaultOutput = join(rootDir, 'packages/drupal-starter/helixui.libraries.yml');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArg(flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
}

function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

const cdnMode = hasFlag('--cdn');
const outputPath = getArg('--output') ?? defaultOutput;
const localBasePath = getArg('--base-path') ?? '/libraries/helixui';

// ---------------------------------------------------------------------------
// CEM type definitions (subset)
// ---------------------------------------------------------------------------

interface CemDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  customElement?: boolean;
}

interface CemModule {
  kind: string;
  path: string;
  declarations?: CemDeclaration[];
}

interface Cem {
  schemaVersion: string;
  modules?: CemModule[];
}

interface PackageJson {
  name: string;
  version: string;
}

// ---------------------------------------------------------------------------
// Read inputs
// ---------------------------------------------------------------------------

if (!existsSync(cemPath)) {
  console.error(`ERROR: custom-elements.json not found at ${cemPath}`);
  console.error('Run `pnpm run cem` first to generate the manifest.');
  process.exit(1);
}

const cem = JSON.parse(readFileSync(cemPath, 'utf-8')) as Cem;
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
const version = pkg.version;

// ---------------------------------------------------------------------------
// Derive component directories from the CEM
// ---------------------------------------------------------------------------

/**
 * componentDirs: Set of component directory names (hx-button, hx-card, …)
 * that have at least one custom element defined in the CEM.
 */
const componentDirs = new Set<string>();

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
// Asset path resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the JS path for a component in either local or CDN mode.
 * In CDN mode the version is baked into the URL so Drupal respects
 * the library version for cache-busting.
 */
function jsPath(subPath: string): string {
  if (cdnMode) {
    return `https://unpkg.com/@helixui/library@${version}/${subPath}`;
  }
  return `${localBasePath}/${subPath}`;
}

function cssPath(subPath: string): string {
  if (cdnMode) {
    return `https://unpkg.com/@helixui/library@${version}/${subPath}`;
  }
  return `${localBasePath}/${subPath}`;
}

// ---------------------------------------------------------------------------
// Inter-component dependency map
// Some components depend on another component being loaded first.
// This is intentionally conservative — only well-established composition
// dependencies are listed here.
// ---------------------------------------------------------------------------

const COMPONENT_DEPS: Record<string, string[]> = {
  'hx-button-group': ['helixui/hx-button'],
  'hx-checkbox-group': ['helixui/hx-checkbox'],
  'hx-copy-button': ['helixui/hx-button'],
  'hx-icon-button': ['helixui/hx-icon'],
  'hx-side-nav': ['helixui/hx-nav'],
  'hx-split-button': ['helixui/hx-button'],
  'hx-toggle-button': ['helixui/hx-button'],
  'hx-top-nav': ['helixui/hx-nav'],
};

// ---------------------------------------------------------------------------
// YAML helpers
// ---------------------------------------------------------------------------

/**
 * Indent a block of text by N spaces.
 */
function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : `${pad}${line}`))
    .join('\n');
}

/**
 * Produce the YAML block for a JS asset line.
 * Drupal libraries.yml format for a type=module script:
 *   path/to/file.js: { attributes: { type: module }, minified: true }
 * For external CDN URLs attributes.type must still be set.
 */
function jsEntry(path: string, isCdn: boolean): string {
  const attrs = isCdn
    ? `{ type: external, attributes: { type: module } }`
    : `{ attributes: { type: module }, minified: true }`;
  return `    ${path}: ${attrs}`;
}

/**
 * Produce the YAML block for a CSS asset line.
 */
function cssEntry(path: string, isCdn: boolean): string {
  const attrs = isCdn ? `{ type: external, minified: true }` : `{ minified: true }`;
  return `      ${path}: ${attrs}`;
}

/**
 * Build the full YAML entry for a single component.
 */
function buildComponentEntry(tag: string): string {
  const js = jsPath(`dist/components/${tag}/index.js`);
  const extraDeps = COMPONENT_DEPS[tag] ?? [];
  const allDeps = ['helixui/core', ...extraDeps];

  const lines: string[] = [
    `${tag}:`,
    `  version: ${version}`,
    `  js:`,
    jsEntry(js, cdnMode),
    `  dependencies:`,
    ...allDeps.map((d) => `    - ${d}`),
  ];

  return lines.join('\n');
}

/**
 * Build the `core` entry (tokens CSS + full JS runtime).
 */
function buildCoreEntry(): string {
  const tokensJs = jsPath('dist/index.js');
  const tokensCss = cssPath('dist/css/helix-tokens.css');
  const coreCss = cssPath('dist/css/helix-core.css');

  const lines: string[] = [
    `core:`,
    `  version: ${version}`,
    `  css:`,
    `    theme:`,
    cssEntry(tokensCss, cdnMode),
    cssEntry(coreCss, cdnMode),
    `  js:`,
    jsEntry(tokensJs, cdnMode),
  ];

  return lines.join('\n');
}

/**
 * Build the `all` convenience entry — depends on every component.
 */
function buildAllEntry(): string {
  const depLines = sortedDirs.map((d) => `    - helixui/${d}`);
  const lines: string[] = [
    `all:`,
    `  version: ${version}`,
    `  dependencies:`,
    `    - helixui/core`,
    ...depLines,
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Static sections
// These entries reference files that live within the drupal-starter package
// itself (js/, css/ directories) and are not auto-generated from the CEM.
// They are always emitted in local-path format regardless of --cdn mode.
// ---------------------------------------------------------------------------

function buildStaticSections(): string {
  return [
    `# --- Drupal behaviors ---`,
    ``,
    `helixui-behaviors:`,
    `  version: ${version}`,
    `  js:`,
    `    js/helixui-behaviors.js: {}`,
    `  dependencies:`,
    `    - core/drupal`,
    `    - core/once`,
    ``,
    `helixui-form-behaviors:`,
    `  version: ${version}`,
    `  js:`,
    `    js/helixui-form-behaviors.js: {}`,
    `  dependencies:`,
    `    - core/drupal`,
    `    - core/once`,
    `    - helixui/helixui-behaviors`,
    ``,
    `# --- Theme override CSS ---`,
    ``,
    `helix-theme-overrides:`,
    `  version: ${version}`,
    `  css:`,
    `    theme:`,
    `      css/helix-theme-overrides.css: {}`,
    `  dependencies:`,
    `    - helixui/core`,
    ``,
    `helix-form-layout:`,
    `  version: ${version}`,
    `  css:`,
    `    layout:`,
    `      css/helix-form-layout.css: {}`,
    `  dependencies:`,
    `    - helixui/core`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Build the full YAML document
// ---------------------------------------------------------------------------

const modeLabel = cdnMode
  ? `CDN (unpkg.com/@helixui/library@${version})`
  : `local (${localBasePath})`;

const sections: string[] = [];

// File header
sections.push(
  [
    `# helixui.libraries.yml`,
    `#`,
    `# Drupal 10/11 asset library definitions for @helixui/library`,
    `#`,
    `# AUTO-GENERATED — do not edit this file manually.`,
    `# Regenerate with: pnpm run generate:drupal-libraries`,
    `#`,
    `# Version : ${version}`,
    `# Mode    : ${modeLabel}`,
    `#`,
    `# Twig usage examples:`,
    `#   {{ attach_library('helixui/core') }}`,
    `#   {{ attach_library('helixui/hx-button') }}`,
    `#   {{ attach_library('helixui/all') }}`,
  ].join('\n'),
);

sections.push(``);

// core entry
sections.push(`# --- Base library (tokens CSS + JS runtime) ---`);
sections.push(``);
sections.push(buildCoreEntry());

// per-component entries
sections.push(``);
sections.push(
  [
    `# ─────────────────────────────────────────────────────────────────`,
    `# Individual component libraries`,
    `# Use these for surgical per-page loading (best performance).`,
    `# attach_library('helixui/<tag>') pulls in helixui/core automatically.`,
    `# ─────────────────────────────────────────────────────────────────`,
  ].join('\n'),
);
sections.push(``);

for (const dir of sortedDirs) {
  sections.push(buildComponentEntry(dir));
  sections.push(``);
}

// all entry
sections.push(
  [
    `# ─────────────────────────────────────────────────────────────────`,
    `# Full library bundle — loads every component`,
    `# Use for prototyping or when most components are needed site-wide.`,
    `# ─────────────────────────────────────────────────────────────────`,
  ].join('\n'),
);
sections.push(``);
sections.push(buildAllEntry());

// static sections
sections.push(``);
sections.push(buildStaticSections());
sections.push(``);

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outputDir = dirname(outputPath);
mkdirSync(outputDir, { recursive: true });

const content = sections.join('\n');
writeFileSync(outputPath, content, 'utf-8');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`Generated Drupal libraries YAML`);
console.log(`  Components : ${sortedDirs.length}`);
console.log(`  Version    : ${version}`);
console.log(`  Mode       : ${modeLabel}`);
console.log(`  Output     : ${outputPath}`);
