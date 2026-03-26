/**
 * Library References Tests
 *
 * Validates that every `attach_library('helixui/xxx')` call in every Twig
 * template references a library key that is actually defined in
 * `helixui.libraries.yml`.
 *
 * This prevents silent failures in Drupal where an undefined library is
 * referenced but no JS/CSS is loaded for that component.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');

const LIBRARIES_YML = resolve(PACKAGE_ROOT, 'helixui.libraries.yml');
const COMPONENTS_DIR = resolve(PACKAGE_ROOT, 'components');
const TEMPLATES_DIR = resolve(PACKAGE_ROOT, 'templates');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse helixui.libraries.yml and return all top-level library keys. */
function parseLibraryKeys(): Set<string> {
  const content = readFileSync(LIBRARIES_YML, 'utf-8');
  const parsed = yaml.parse(content) as Record<string, unknown>;
  return new Set(Object.keys(parsed));
}

/**
 * Collect all `.twig` / `.html.twig` files under `dir`, recursively.
 */
function collectTwigFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(current: string): void {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.twig')) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

/**
 * Extract all library names referenced via `attach_library('helixui/xxx')` in
 * a Twig source string.  Returns the `xxx` portion only.
 */
function extractAttachLibraryCalls(source: string): string[] {
  const pattern = /attach_library\s*\(\s*['"]helixui\/([^'"]+)['"]\s*\)/g;
  const names: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    names.push(match[1]);
  }
  return names;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('helixui.libraries.yml — file is parseable', () => {
  it('parses without throwing', () => {
    expect(() => parseLibraryKeys()).not.toThrow();
  });

  it('contains at least one library entry', () => {
    const keys = parseLibraryKeys();
    expect(keys.size).toBeGreaterThan(0);
  });

  it('contains core', () => {
    const keys = parseLibraryKeys();
    expect(keys.has('core')).toBe(true);
  });

  it('contains hx-button', () => {
    const keys = parseLibraryKeys();
    expect(keys.has('hx-button')).toBe(true);
  });
});

describe('attach_library() references — all libraries are defined', () => {
  const libraryKeys = parseLibraryKeys();

  // Gather all twig files from both SDC components and standalone templates.
  const allTwigFiles = [
    ...collectTwigFiles(COMPONENTS_DIR),
    ...collectTwigFiles(TEMPLATES_DIR),
  ];

  it('found at least 29 SDC twig files', () => {
    const sdcFiles = collectTwigFiles(COMPONENTS_DIR);
    expect(sdcFiles.length).toBeGreaterThanOrEqual(29);
  });

  it('found at least 4 standalone template twig files', () => {
    const templateFiles = collectTwigFiles(TEMPLATES_DIR);
    expect(templateFiles.length).toBeGreaterThanOrEqual(4);
  });

  // For each twig file, verify every attach_library call resolves.
  for (const twigFile of allTwigFiles) {
    const relativePath = twigFile.replace(PACKAGE_ROOT + '/', '');
    const source = readFileSync(twigFile, 'utf-8');
    const refs = extractAttachLibraryCalls(source);

    if (refs.length === 0) {
      // Templates with no attach_library calls pass trivially.
      it(`${relativePath} — no attach_library calls (ok)`, () => {
        expect(refs.length).toBe(0);
      });
      continue;
    }

    for (const ref of refs) {
      it(`${relativePath} — attach_library('helixui/${ref}') is defined`, () => {
        expect(
          libraryKeys.has(ref),
          `Library key "${ref}" not found in helixui.libraries.yml`,
        ).toBe(true);
      });
    }
  }
});

describe('attach_library() pattern — extract helper', () => {
  it('extracts single-quoted library refs', () => {
    const src = "{{ attach_library('helixui/hx-button') }}";
    expect(extractAttachLibraryCalls(src)).toEqual(['hx-button']);
  });

  it('extracts double-quoted library refs', () => {
    const src = '{{ attach_library("helixui/hx-card") }}';
    expect(extractAttachLibraryCalls(src)).toEqual(['hx-card']);
  });

  it('extracts multiple refs from a template', () => {
    const src = [
      "{{ attach_library('helixui/hx-text') }}",
      "{{ attach_library('helixui/hx-button') }}",
      "{{ attach_library('helixui/hx-icon') }}",
    ].join('\n');
    expect(extractAttachLibraryCalls(src)).toEqual(['hx-text', 'hx-button', 'hx-icon']);
  });

  it('ignores non-helixui library refs', () => {
    const src = "{{ attach_library('core/drupal') }}";
    expect(extractAttachLibraryCalls(src)).toEqual([]);
  });

  it('returns empty array when no calls present', () => {
    expect(extractAttachLibraryCalls('<div>No calls here</div>')).toEqual([]);
  });
});
