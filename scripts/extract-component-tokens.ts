#!/usr/bin/env tsx
/**
 * extract-component-tokens.ts
 *
 * Scans every `.styles.ts` file under `packages/hx-library/src/components/**`
 * and extracts the per-component CSS custom properties (the "component tier"
 * of the three-tier token system).
 *
 * The component tier is defined by name: a token name `--hx-{seg}-{...}` is a
 * component-tier token if AND only if:
 *   1. `seg` matches the dirname of an `hx-*` component under
 *      `packages/hx-library/src/components/`, AND
 *   2. The token does NOT already exist as a semantic token at the top level
 *      of `packages/hx-tokens/src/tokens.json` (this excludes legacy
 *      semantic namespaces like `input`, `container`, `divider` which happen
 *      to share names with component dirs).
 *
 * Output is a sorted manifest:
 *   { "hx-button": ["--hx-button-bg", "--hx-button-border-radius", ...], ... }
 *
 * This script is the single source of truth for the
 * `component:` block in `packages/hx-tokens/src/tokens.json`. Drift between
 * the inline-authored tokens (in `.styles.ts`) and the JSON manifest is
 * gated by `packages/hx-tokens/src/__tests__/component-manifest-sync.test.ts`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(REPO_ROOT, 'packages/hx-library/src/components');
const TOKENS_JSON_PATH = resolve(REPO_ROOT, 'packages/hx-tokens/src/tokens.json');

/**
 * Recursively find files matching a predicate beneath a root directory.
 */
function findFiles(root: string, predicate: (path: string) => boolean): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (dir === undefined) break;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push(full);
      } else if (st.isFile() && predicate(full)) {
        out.push(full);
      }
    }
  }
  return out;
}

/**
 * Get the set of component dirnames (e.g. "hx-button", "hx-card", ...).
 */
function getComponentDirnames(): Set<string> {
  const result = new Set<string>();
  const entries = readdirSync(COMPONENTS_DIR);
  for (const entry of entries) {
    const full = join(COMPONENTS_DIR, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!entry.startsWith('hx-')) continue;
    result.add(entry);
  }
  return result;
}

/**
 * Build a flat set of every semantic token name that exists at the top level
 * of tokens.json (excluding the `dark`, `high-contrast`, and `component`
 * blocks which are not the light/baseline cascade).
 */
function getSemanticTokenNames(): Set<string> {
  const json = JSON.parse(readFileSync(TOKENS_JSON_PATH, 'utf-8')) as Record<string, unknown>;
  const skip = new Set(['dark', 'high-contrast', 'component']);
  const names = new Set<string>();

  function walk(obj: Record<string, unknown>, prefix: string[]): void {
    for (const [key, val] of Object.entries(obj)) {
      const path = [...prefix, key];
      if (typeof val === 'object' && val !== null && 'value' in val) {
        names.add(`--hx-${path.join('-')}`);
      } else if (typeof val === 'object' && val !== null) {
        walk(val as Record<string, unknown>, path);
      }
    }
  }

  for (const [topKey, topVal] of Object.entries(json)) {
    if (skip.has(topKey)) continue;
    if (typeof topVal !== 'object' || topVal === null) continue;
    walk({ [topKey]: topVal } as Record<string, unknown>, []);
  }

  return names;
}

/**
 * Strip C-style block comments (`/* ... *​/`) and line comments (`// ...`)
 * from a TypeScript / CSS-in-JS source. Used to prevent doc comments that
 * happen to mention `var(--hx-...)` from leaking into the component-token
 * manifest.
 *
 * Note: this is a coarse strip — it does not respect strings or template
 * literals, so a `//` inside a string literal is also removed. That's fine
 * for our use case: the result is fed into a `--hx-*` regex extractor that
 * doesn't care about string boundaries; we just want to drop comment text.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

/**
 * Extract every CSS custom property reference (`var(--hx-...)`) and
 * declaration (`--hx-...:`) from a string. Comments are stripped first so
 * tokens mentioned only in JSDoc / inline notes do not pollute the
 * manifest.
 */
export function extractTokenNamesFromSource(source: string): Set<string> {
  const cleaned = stripComments(source);
  const out = new Set<string>();
  // Tokens must start with `--hx-`, contain only [a-z0-9-], and end on
  // an alphanumeric character (no trailing dash). This excludes
  // documentation placeholders like `--hx-alert-{prop}` which would
  // otherwise greedy-match as `--hx-alert-`.
  const tokenBody = '--hx-[a-z0-9]+(?:-[a-z0-9]+)*';
  // var(--hx-foo, ...)
  const varRe = new RegExp(`var\\(\\s*(${tokenBody})`, 'g');
  let m: RegExpExecArray | null;
  while ((m = varRe.exec(cleaned)) !== null) {
    out.add(m[1]);
  }
  // --hx-foo: <value>;  declarations
  const declRe = new RegExp(`(${tokenBody})\\s*:`, 'g');
  while ((m = declRe.exec(cleaned)) !== null) {
    out.add(m[1]);
  }
  return out;
}

/**
 * Public API used by the manifest-sync vitest.
 *
 * Returns a sorted, alphabetical manifest:
 *   { [componentName]: sorted string[] of `--hx-*` token names }
 *
 * Components with zero component-tier tokens are omitted.
 */
export function extractComponentTokens(): Record<string, string[]> {
  const componentDirs = getComponentDirnames();
  const semanticNames = getSemanticTokenNames();
  const result: Record<string, Set<string>> = {};

  const styleFiles = findFiles(COMPONENTS_DIR, (p) => p.endsWith('.styles.ts'));

  for (const file of styleFiles) {
    const source = readFileSync(file, 'utf-8');
    const tokens = extractTokenNamesFromSource(source);
    for (const token of tokens) {
      // token = "--hx-foo-bar-baz"
      const stripped = token.slice('--hx-'.length); // "foo-bar-baz"
      // Match the longest component-name prefix.
      // Component names are all `hx-{slug}`, so we test `hx-{slug}` against
      // dirnames.  We greedily take the longest prefix that matches a
      // component dirname so that `hx-text-input` wins over `hx-text`.
      const segments = stripped.split('-');
      let matched: string | null = null;
      for (let n = segments.length; n >= 1; n--) {
        const candidate = `hx-${segments.slice(0, n).join('-')}`;
        if (componentDirs.has(candidate)) {
          matched = candidate;
          break;
        }
      }
      if (!matched) continue;
      // If this token is also a semantic token, it's the semantic layer, not
      // the component layer — skip it. (E.g. --hx-divider-color exists in
      // tokens.json's semantic `divider:` block.)
      if (semanticNames.has(token)) continue;
      if (!result[matched]) result[matched] = new Set<string>();
      result[matched].add(token);
    }
  }

  // Sort component names and per-component token lists.
  const sorted: Record<string, string[]> = {};
  for (const compName of Object.keys(result).sort()) {
    sorted[compName] = Array.from(result[compName]).sort();
  }
  return sorted;
}

// CLI: print JSON to stdout when invoked directly via tsx/node.
const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const manifest = extractComponentTokens();
  process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
}
