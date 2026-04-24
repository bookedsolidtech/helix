#!/usr/bin/env tsx
/*
 * inject-cssprop.ts
 *
 * Reads cem-accuracy/findings.jsonl, collects every cem-completeness
 * css-property finding, groups by component, and injects the missing
 * @cssprop JSDoc entries into each component .ts class file.
 *
 * Idempotent: skips tokens already present in the file.
 *
 * Usage:
 *   pnpm exec tsx scripts/codex-campaigns/lib/inject-cssprop.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FINDINGS_FILE = path.join(REPO_ROOT, '.reports/codex/campaigns/cem-accuracy/findings.jsonl');
const DRY_RUN = process.argv.includes('--dry-run');

interface Finding {
  category: string;
  target: string;
  tag: string;
  public_surface: string;
  evidence: string;
}

// ─── Fallback extraction ───────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/*
 * From a CSS evidence string like:
 *   font-family: var(--hx-foo, var(--hx-bar, sans-serif));
 * extract the immediate fallback for the given token.
 * Prefers the semantic-token fallback (another var()) over a raw literal.
 */
function extractFallback(evidence: string, tokenName: string): string {
  const re = new RegExp('var\\(\\s*' + escapeRegex(tokenName) + '\\s*,\\s*');
  const match = re.exec(evidence);
  if (!match) return '';

  const start = match.index + match[0].length;
  let depth = 0;
  let i = start;
  for (; i < evidence.length; i++) {
    if (evidence[i] === '(') depth++;
    else if (evidence[i] === ')') {
      if (depth === 0) break;
      depth--;
    }
  }
  const raw = evidence.slice(start, i).trim();

  // If fallback is var(--token, ...) collapse to var(--token) to stay semantic
  const innerVar = /^var\(\s*(--[\w-]+)/.exec(raw);
  if (innerVar) return 'var(' + innerVar[1] + ')';

  return raw;
}

// ─── Description generation ────────────────────────────────────────────────

function describeToken(tokenName: string): string {
  const n = tokenName.replace(/^--hx-/, '');
  if (/(-bg$|-background)/.test(n)) return 'Background color.';
  if (/color/.test(n)) return 'Color.';
  if (/-focus-ring/.test(n)) return 'Focus ring styling.';
  if (/-border-radius/.test(n)) return 'Border radius.';
  if (/-border-width/.test(n)) return 'Border width.';
  if (/-border/.test(n)) return 'Border styling.';
  if (/^space-/.test(n)) return 'Spacing token.';
  if (/^size-/.test(n)) return 'Size token.';
  if (/^font-size/.test(n)) return 'Font size.';
  if (/^font-family/.test(n)) return 'Font family.';
  if (/^font-weight/.test(n)) return 'Font weight.';
  if (/^font/.test(n)) return 'Typography token.';
  if (/^line-height/.test(n)) return 'Line height.';
  if (/^opacity/.test(n)) return 'Opacity.';
  if (/^transition/.test(n)) return 'Transition timing.';
  if (/^duration/.test(n)) return 'Animation duration.';
  if (/^shadow/.test(n)) return 'Box shadow.';
  if (/^z-index/.test(n)) return 'Z-index layer.';
  if (/^overlay/.test(n)) return 'Overlay color.';
  if (/^filter/.test(n)) return 'CSS filter.';
  if (/^touch-target/.test(n)) return 'Minimum touch target size.';
  if (/-padding/.test(n)) return 'Padding.';
  if (/-margin/.test(n)) return 'Margin.';
  if (/-gap/.test(n)) return 'Gap / spacing.';
  if (/-width/.test(n)) return 'Width.';
  if (/-height/.test(n)) return 'Height.';
  if (/-min-/.test(n)) return 'Minimum size.';
  if (/-max-/.test(n)) return 'Maximum size.';
  return 'CSS custom property.';
}

// ─── JSDoc injection ───────────────────────────────────────────────────────

/*
 * For tokens without the component's own prefix (e.g. --hx-space-2 in hx-button),
 * we deliberately omit the default value. The token's canonical default is defined
 * globally; emitting a per-component default would be inconsistent across components
 * that all consume the same semantic token.
 */
function csspropLine(tokenName: string, fallback: string, tag: string): string {
  const desc = describeToken(tokenName);
  const componentSlug = tag.replace(/^hx-/, '');
  const isComponentScoped = tokenName.startsWith('--hx-' + componentSlug + '-');
  const defaultPart = isComponentScoped && fallback ? '=' + fallback : '';
  return ' * @cssprop [' + tokenName + defaultPart + '] - ' + desc;
}

function existingCssProps(source: string): Set<string> {
  const found = new Set<string>();
  for (const m of source.matchAll(/@cssprop\s+\[?(--[\w-]+)/g)) {
    found.add(m[1]);
  }
  return found;
}

/*
 * Finds the JSDoc block immediately before @customElement and inserts new
 * @cssprop lines before its closing marker.
 * Returns modified source, or null if no injection point found.
 */
function injectIntoSource(source: string, lines: string[]): string | null {
  if (lines.length === 0) return source;

  const ceIdx = source.indexOf('@customElement(');
  if (ceIdx === -1) return null;

  const beforeCe = source.slice(0, ceIdx);
  // Search for " */" (with leading space) so we can re-attach it correctly
  // and avoid a whitespace-only orphan line that breaks Prettier's format:check.
  const closingIdx = beforeCe.lastIndexOf(' */');
  if (closingIdx === -1) return null;

  // source.slice(0, closingIdx) ends with the newline of the last existing line.
  // We append the new lines, then a newline, then restore " */" from source.
  const insertion = lines.join('\n') + '\n';
  return source.slice(0, closingIdx) + insertion + source.slice(closingIdx);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const byTarget = new Map<string, { target: string; tag: string; tokens: Map<string, string> }>();

  const rl = readline.createInterface({ input: fs.createReadStream(FINDINGS_FILE) });
  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line) continue;
    let f: Finding;
    try {
      f = JSON.parse(line);
    } catch {
      continue;
    }

    if (f.category !== 'cem-completeness') continue;
    if (!f.public_surface.startsWith('css-property:')) continue;

    const tokenName = f.public_surface.slice('css-property:'.length);
    if (!tokenName.startsWith('--')) continue;

    if (!byTarget.has(f.target)) {
      byTarget.set(f.target, { target: f.target, tag: f.tag, tokens: new Map() });
    }
    const entry = byTarget.get(f.target)!;
    if (!entry.tokens.has(tokenName)) {
      entry.tokens.set(tokenName, extractFallback(f.evidence, tokenName));
    }
  }

  console.log('Components to update: ' + byTarget.size);

  let filesModified = 0;
  let tokensInjected = 0;
  let tokensSkipped = 0;

  for (const { target, tag, tokens } of byTarget.values()) {
    const tsFile = path.join(REPO_ROOT, target, tag + '.ts');
    if (!fs.existsSync(tsFile)) {
      console.warn('  SKIP (file not found): ' + tsFile);
      continue;
    }

    const source = fs.readFileSync(tsFile, 'utf8');
    const existing = existingCssProps(source);

    const toAdd: string[] = [];
    for (const [tokenName, fallback] of tokens) {
      if (existing.has(tokenName)) {
        tokensSkipped++;
        continue;
      }
      toAdd.push(csspropLine(tokenName, fallback, tag));
      tokensInjected++;
    }

    if (toAdd.length === 0) {
      console.log('  OK (all present): ' + tag);
      continue;
    }

    const modified = injectIntoSource(source, toAdd);
    if (!modified) {
      console.warn('  SKIP (no injection point): ' + tag);
      continue;
    }

    if (DRY_RUN) {
      console.log('  DRY-RUN: ' + tag + ' — would add ' + toAdd.length + ' @cssprop entries');
      for (const l of toAdd) console.log('    ' + l.trim());
    } else {
      fs.writeFileSync(tsFile, modified, 'utf8');
      console.log('  UPDATED: ' + tag + ' +' + toAdd.length + ' @cssprop entries');
    }
    filesModified++;
  }

  console.log('');
  console.log('Done.');
  console.log('  Files modified:  ' + (DRY_RUN ? filesModified + ' (dry run)' : filesModified));
  console.log('  Tokens injected: ' + tokensInjected);
  console.log('  Tokens skipped:  ' + tokensSkipped + ' (already present)');
  if (!DRY_RUN && filesModified > 0) {
    console.log('');
    console.log('Next step: pnpm run cem');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
