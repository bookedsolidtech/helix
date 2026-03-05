/**
 * helix theme generate
 *
 * Generates a full token override package from brand colors.
 * Supports zero-JavaScript theming via data-theme attribute.
 *
 * Usage:
 *   helix theme generate --name acme --primary "#1a73e8" [--secondary "#34a853"] [--preview] [--output ./my-theme]
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeGenerateOptions {
  /** Theme package name (e.g. "acme" → "@acme/helix-theme") */
  name: string;
  /** Brand primary color as hex string (e.g. "#1a73e8") */
  primary: string;
  /** Brand secondary color as hex string (optional) */
  secondary?: string;
  /** Brand accent color as hex string (optional) */
  accent?: string;
  /** Preview mode: print CSS to stdout instead of writing files */
  preview?: boolean;
  /** Output directory (default: ./<name>-theme) */
  output?: string;
  /** Semantic version for the generated package (default: "1.0.0") */
  version?: string;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Color scale with shades 50–950 */
type ColorScale = Record<string, string>;

// ---------------------------------------------------------------------------
// Color math — no external dependencies
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;

  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);

  function f(n: number): string {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  }

  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/**
 * Generates an 11-stop color scale (50–950) from a single brand color.
 * The input color is anchored at the 500 stop. Lighter shades increase
 * lightness while slightly desaturating; darker shades decrease lightness.
 */
function generateColorScale(hex: string): ColorScale {
  const rgb = hexToRgb(hex);
  const { h, s } = rgbToHsl(rgb);

  // Lightness values for each stop (50 → 950)
  const stops: Array<[string, number, number]> = [
    ['50', s * 0.15, 97],
    ['100', s * 0.25, 93],
    ['200', s * 0.4, 87],
    ['300', s * 0.6, 77],
    ['400', s * 0.8, 64],
    ['500', s, 50],
    ['600', s * 0.95, 40],
    ['700', s * 0.9, 32],
    ['800', s * 0.85, 25],
    ['900', s * 0.8, 18],
    ['950', s * 0.75, 12],
  ];

  const scale: ColorScale = {};
  for (const [stop, sat, light] of stops) {
    scale[stop] = hslToHex(h, Math.round(sat), light);
  }
  return scale;
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

function colorScaleToCssVars(name: string, scale: ColorScale): string {
  return Object.entries(scale)
    .map(([stop, value]) => `  --hx-color-${name}-${stop}: ${value};`)
    .join('\n');
}

/**
 * Builds the complete theme CSS string that overrides Helix design tokens.
 * Uses `[data-theme="<name>"]` so theming is zero-JavaScript.
 */
function buildThemeCss(opts: ThemeGenerateOptions): string {
  const { name, primary, secondary, accent } = opts;

  const primaryScale = generateColorScale(primary);
  const secondaryScale = secondary ? generateColorScale(secondary) : null;
  const accentScale = accent ? generateColorScale(accent) : null;

  const blocks: string[] = [];

  // --- :root override (default theme) ---
  const rootVars: string[] = [colorScaleToCssVars('primary', primaryScale)];
  if (secondaryScale) rootVars.push(colorScaleToCssVars('secondary', secondaryScale));
  if (accentScale) rootVars.push(colorScaleToCssVars('accent', accentScale));

  blocks.push(`/* Helix theme: ${name} */`);
  blocks.push(`/* Generated by helix theme generate — do not edit manually */`);
  blocks.push('');
  blocks.push(':root,');
  blocks.push(`[data-theme="${name}"] {`);
  blocks.push(rootVars.join('\n'));
  blocks.push(`  --hx-color-border-focus: var(--hx-color-primary-500);`);
  blocks.push(`  --hx-color-focus-ring: var(--hx-color-primary-400);`);
  blocks.push(`  --hx-focus-ring-color: var(--hx-color-primary-400);`);
  blocks.push('}');
  blocks.push('');

  // --- Dark mode support ---
  blocks.push(`[data-theme="${name}"][data-color-scheme="dark"],`);
  blocks.push(`[data-theme="${name}"] [data-color-scheme="dark"] {`);
  blocks.push(`  --hx-color-text-primary: var(--hx-color-neutral-100);`);
  blocks.push(`  --hx-color-text-secondary: var(--hx-color-neutral-300);`);
  blocks.push(`  --hx-color-surface-default: var(--hx-color-neutral-900);`);
  blocks.push(`  --hx-color-surface-raised: var(--hx-color-neutral-800);`);
  blocks.push(`  --hx-color-border-default: var(--hx-color-neutral-700);`);
  blocks.push('}');

  return blocks.join('\n');
}

// ---------------------------------------------------------------------------
// Package scaffolding
// ---------------------------------------------------------------------------

function buildPackageJson(opts: ThemeGenerateOptions): string {
  const { name, version = '1.0.0' } = opts;
  const pkg = {
    name: `@${name}/helix-theme`,
    version,
    description: `Helix design system theme for ${name}`,
    type: 'module',
    main: './theme.css',
    exports: {
      '.': './theme.css',
      './theme.css': './theme.css',
    },
    files: ['theme.css', 'README.md'],
    keywords: ['helix', 'design-system', 'theme', 'white-label'],
    peerDependencies: {
      '@helix/tokens': '>=0.1.0',
    },
  };
  return JSON.stringify(pkg, null, 2);
}

function buildReadme(opts: ThemeGenerateOptions): string {
  const { name } = opts;

  return `# @${name}/helix-theme

Enterprise white-label theme for the Helix design system.

## Installation

\`\`\`bash
npm install @${name}/helix-theme @helix/tokens
\`\`\`

## Usage

### Option 1 — CSS import (recommended)

\`\`\`html
<link rel="stylesheet" href="node_modules/@helix/tokens/dist/tokens.css" />
<link rel="stylesheet" href="node_modules/@${name}/helix-theme/theme.css" />
\`\`\`

Then apply the theme via the \`data-theme\` attribute — **no JavaScript required**:

\`\`\`html
<html data-theme="${name}">
  <!-- All Helix components automatically pick up the brand colors -->
  <hx-button>Get started</hx-button>
</html>
\`\`\`

### Option 2 — Scoped to a subtree

\`\`\`html
<div data-theme="${name}">
  <hx-button>Branded button</hx-button>
</div>
\`\`\`

### Option 3 — Dark mode

\`\`\`html
<html data-theme="${name}" data-color-scheme="dark">
  <!-- Dark mode + custom brand colors -->
</html>
\`\`\`

## How it works

This package overrides Helix CSS custom properties at the \`:root\` level (and
scoped to \`[data-theme="${name}"]\`). No JavaScript bundle is required — theming
is pure CSS.

The token cascade is:

\`\`\`
@helix/tokens (base system)
  └─ @${name}/helix-theme (brand overrides)
       └─ hx-* components (consume via --hx-* custom properties)
\`\`\`

## Regenerating

\`\`\`bash
npx helix theme generate \\
  --name ${name} \\
  --primary "<your-brand-primary-hex>" \\
  --output .
\`\`\`
`;
}

// ---------------------------------------------------------------------------
// Preview rendering (terminal)
// ---------------------------------------------------------------------------

function renderPreview(css: string, opts: ThemeGenerateOptions): void {
  const { name, primary, secondary, accent } = opts;

  process.stdout.write('\n');
  process.stdout.write('='.repeat(60) + '\n');
  process.stdout.write(`  Helix Theme Preview: ${name}\n`);
  process.stdout.write('='.repeat(60) + '\n\n');

  process.stdout.write(`  Primary:   ${primary}\n`);
  if (secondary) process.stdout.write(`  Secondary: ${secondary}\n`);
  if (accent) process.stdout.write(`  Accent:    ${accent}\n`);
  process.stdout.write('\n');

  // Show the generated color scale for primary
  const primaryScale = generateColorScale(primary);
  process.stdout.write('  Primary color scale:\n');
  for (const [stop, hex] of Object.entries(primaryScale)) {
    process.stdout.write(`    ${stop.padEnd(4)}: ${hex}\n`);
  }

  process.stdout.write('\n--- Generated CSS ---\n\n');
  process.stdout.write(css);
  process.stdout.write('\n\n');
  process.stdout.write('--- End Preview ---\n');
  process.stdout.write('\nTo generate files, run without --preview\n\n');
}

// ---------------------------------------------------------------------------
// Main entry point for the command
// ---------------------------------------------------------------------------

export async function themeGenerate(opts: ThemeGenerateOptions): Promise<void> {
  const { name, preview = false, output, version = '1.0.0' } = opts;

  if (!name) {
    throw new Error('--name is required');
  }
  if (!opts.primary) {
    throw new Error('--primary is required (e.g. --primary "#1a73e8")');
  }

  const css = buildThemeCss(opts);

  if (preview) {
    renderPreview(css, opts);
    return;
  }

  const outDir = resolve(output ?? `./${name}-theme`);

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'theme.css'), css, 'utf8');
  await writeFile(join(outDir, 'package.json'), buildPackageJson({ ...opts, version }), 'utf8');
  await writeFile(join(outDir, 'README.md'), buildReadme(opts), 'utf8');

  process.stdout.write('\n');
  process.stdout.write(`Theme package generated: ${outDir}\n`);
  process.stdout.write(`\n  Files:\n`);
  process.stdout.write(`    theme.css    — CSS token overrides\n`);
  process.stdout.write(`    package.json — npm package manifest\n`);
  process.stdout.write(`    README.md    — integration guide\n`);
  process.stdout.write(`\n  Publish:\n`);
  process.stdout.write(`    cd ${outDir} && npm publish --access public\n`);
  process.stdout.write('\n');
}
