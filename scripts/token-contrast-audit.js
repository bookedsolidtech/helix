#!/usr/bin/env node

/**
 * Token Contrast Audit Script
 *
 * Reads the design token palette from packages/hx-tokens/src/tokens.json and
 * audits foreground/background color pairs for WCAG 2.1 AA contrast compliance.
 *
 * Usage:
 *   node scripts/token-contrast-audit.js
 *   node scripts/token-contrast-audit.js --level=AAA
 *   node scripts/token-contrast-audit.js --json
 *
 * Options:
 *   --level=AA|AAA   Minimum conformance level (default: AA)
 *   --json           Output results as JSON instead of table
 *
 * Audited pairs:
 *   - Text colors (500-950) on light backgrounds (0-200)
 *   - Text colors on white (#FFFFFF)
 *   - Error/warning/success text tokens on their respective backgrounds
 *   - Semantic text tokens (--hx-color-error-text, etc.) on neutral backgrounds
 *
 * Exit code:
 *   0 = all pairs pass
 *   1 = one or more pairs fail
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(__dirname, '../packages/hx-tokens/src/tokens.json');

// ─── WCAG Contrast Ratio Calculation ───

/**
 * Parse a hex color string to [r, g, b] in 0-255 range.
 */
function hexToRgb(hex) {
  const h = hex.replace(/^#/, '');
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * Compute relative luminance per WCAG 2.1 definition.
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Compute WCAG contrast ratio between two hex colors.
 * Returns a value >= 1.
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Token Loading ───

function loadTokens() {
  const raw = readFileSync(tokensPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Extract flat color map from nested token structure.
 * Returns entries like: { 'primary-500': '#2563EB', 'neutral-0': '#FFFFFF', ... }
 */
function extractColors(tokens) {
  const colors = {};
  const colorSection = tokens.color || {};

  for (const [group, shades] of Object.entries(colorSection)) {
    if (typeof shades !== 'object' || shades === null) continue;
    for (const [shade, def] of Object.entries(shades)) {
      if (def && typeof def === 'object' && 'value' in def && typeof def.value === 'string') {
        colors[`${group}-${shade}`] = def.value.toUpperCase();
      }
    }
  }

  return colors;
}

// ─── Audit Pairs ───

/**
 * Generate the set of foreground/background pairs to audit.
 */
function generatePairs(colors) {
  const pairs = [];

  // Define background groups (light surfaces)
  const bgTokens = ['neutral-0', 'neutral-50', 'neutral-100', 'neutral-200'];

  // Define foreground groups (text colors)
  const fgGroups = [
    'primary',
    'secondary',
    'accent',
    'neutral',
    'error',
    'warning',
    'success',
    'info',
  ];
  const fgShades = ['500', '600', '700', '800', '900', '950'];

  // Standard text on light backgrounds
  for (const bg of bgTokens) {
    const bgHex = colors[bg];
    if (!bgHex) continue;

    for (const group of fgGroups) {
      for (const shade of fgShades) {
        const key = `${group}-${shade}`;
        const fgHex = colors[key];
        if (!fgHex) continue;

        pairs.push({
          foreground: `--hx-color-${key}`,
          fgHex,
          background: `--hx-color-${bg}`,
          bgHex,
          context: 'text-on-surface',
        });
      }
    }
  }

  // Semantic text tokens on white
  const semanticTextPairs = [
    { token: 'error-text', resolves: 'error-700', bg: 'neutral-0' },
    { token: 'success-text', resolves: 'success-700', bg: 'neutral-0' },
    { token: 'warning-text', resolves: 'warning-700', bg: 'neutral-0' },
  ];

  for (const { token, resolves, bg } of semanticTextPairs) {
    const fgHex = colors[resolves];
    const bgHex = colors[bg];
    if (fgHex && bgHex) {
      pairs.push({
        foreground: `--hx-color-${token} (resolves to ${resolves})`,
        fgHex,
        background: `--hx-color-${bg}`,
        bgHex,
        context: 'semantic-text',
      });
    }
  }

  // Error/warning/success on their own light backgrounds
  const statusPairs = [
    { fg: 'error-700', bg: 'error-50' },
    { fg: 'error-700', bg: 'error-100' },
    { fg: 'warning-700', bg: 'warning-50' },
    { fg: 'warning-700', bg: 'warning-100' },
    { fg: 'success-700', bg: 'success-50' },
    { fg: 'success-700', bg: 'success-100' },
    { fg: 'info-700', bg: 'info-50' },
    { fg: 'info-700', bg: 'info-100' },
  ];

  for (const { fg, bg } of statusPairs) {
    const fgHex = colors[fg];
    const bgHex = colors[bg];
    if (fgHex && bgHex) {
      pairs.push({
        foreground: `--hx-color-${fg}`,
        fgHex,
        background: `--hx-color-${bg}`,
        bgHex,
        context: 'status-on-status-bg',
      });
    }
  }

  return pairs;
}

// ─── Main ───

function main() {
  const args = process.argv.slice(2);
  const levelArg = args.find((a) => a.startsWith('--level='));
  const level = levelArg ? levelArg.split('=')[1].toUpperCase() : 'AA';
  const jsonOutput = args.includes('--json');

  const minRatio = level === 'AAA' ? 7.0 : 4.5;
  const minRatioLarge = level === 'AAA' ? 4.5 : 3.0;

  const tokens = loadTokens();
  const colors = extractColors(tokens);
  const pairs = generatePairs(colors);

  const results = pairs.map((pair) => {
    const ratio = contrastRatio(pair.fgHex, pair.bgHex);
    const passNormal = ratio >= minRatio;
    const passLarge = ratio >= minRatioLarge;

    return {
      ...pair,
      ratio: Math.round(ratio * 100) / 100,
      passNormal,
      passLarge,
      status: passNormal ? 'PASS' : passLarge ? 'PASS (large text only)' : 'FAIL',
    };
  });

  const failures = results.filter((r) => !r.passNormal);
  const passes = results.filter((r) => r.passNormal);

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          level,
          minRatio,
          total: results.length,
          passes: passes.length,
          failures: failures.length,
          results,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`\nToken Contrast Audit (WCAG ${level})`);
    console.log(`Minimum ratio: ${minRatio}:1 (normal text), ${minRatioLarge}:1 (large text)`);
    console.log(`Total pairs audited: ${results.length}`);
    console.log(`Passing: ${passes.length}  |  Failing: ${failures.length}\n`);

    if (failures.length > 0) {
      console.log('FAILURES:');
      console.log('-'.repeat(100));
      console.log(
        'Foreground'.padEnd(45) + 'Background'.padEnd(25) + 'Ratio'.padEnd(10) + 'Status',
      );
      console.log('-'.repeat(100));

      for (const r of failures) {
        console.log(
          `${r.foreground} (${r.fgHex})`.padEnd(45) +
            `${r.background} (${r.bgHex})`.padEnd(25) +
            `${r.ratio}:1`.padEnd(10) +
            r.status,
        );
      }
      console.log('');
    }

    if (failures.length === 0) {
      console.log('All token pairs pass WCAG ' + level + ' contrast requirements.');
    }
  }

  process.exit(failures.length > 0 ? 1 : 0);
}

main();
