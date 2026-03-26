/**
 * Component Existence Tests
 *
 * Validates that every hx-* component referenced in:
 *   1. `helix-sdc.manifest.yml` (explicit dependency declarations)
 *   2. Twig templates (parsed `<hx-*` open tags)
 *
 * …actually exists as a directory in `packages/hx-library/src/components/`.
 *
 * This catches mis-spellings, renamed components, and components that were
 * removed from the library but still referenced in drupal-starter templates.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import yaml from 'yaml';
import { collectTwigFiles } from './helpers/twig-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');
const MONOREPO_ROOT = resolve(PACKAGE_ROOT, '..', '..');

const MANIFEST_PATH = resolve(PACKAGE_ROOT, 'helix-sdc.manifest.yml');
const COMPONENTS_DIR = resolve(PACKAGE_ROOT, 'components');
const TEMPLATES_DIR = resolve(PACKAGE_ROOT, 'templates');
const HX_LIBRARY_COMPONENTS = resolve(MONOREPO_ROOT, 'packages', 'hx-library', 'src', 'components');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return a Set of all component directory names in hx-library/src/components/.
 * Filters out the `__tests__` pseudo-directory.
 */
function getLibraryComponentNames(): Set<string> {
  const entries = readdirSync(HX_LIBRARY_COMPONENTS);
  return new Set(
    entries.filter((e) => {
      const fullPath = join(HX_LIBRARY_COMPONENTS, e);
      return statSync(fullPath).isDirectory() && !e.startsWith('_');
    }),
  );
}

/**
 * Parse helix-sdc.manifest.yml and return all unique hx-* component names
 * referenced across all SDCs.
 */
function getManifestComponents(): Set<string> {
  const content = readFileSync(MANIFEST_PATH, 'utf-8');
  const parsed = yaml.parse(content) as Record<string, string[] | null>;
  const names = new Set<string>();
  for (const components of Object.values(parsed)) {
    if (Array.isArray(components)) {
      for (const c of components) {
        names.add(c);
      }
    }
  }
  return names;
}

/**
 * Strip Twig comment blocks ({# ... #}) from source before tag scanning.
 * This prevents tags mentioned in documentation comments from being treated
 * as runtime dependencies.  Handles nested `{# ... {# ... #} ... #}` blocks
 * by tracking depth.
 */
function stripTwigComments(source: string): string {
  let result = '';
  let depth = 0;
  let i = 0;

  while (i < source.length) {
    if (i + 1 < source.length && source[i] === '{' && source[i + 1] === '#') {
      depth++;
      i += 2;
    } else if (i + 1 < source.length && source[i] === '#' && source[i + 1] === '}') {
      if (depth > 0) {
        depth--;
      }
      i += 2;
    } else {
      if (depth === 0) {
        result += source[i];
      }
      i++;
    }
  }

  return result;
}

/**
 * Extract all `<hx-*` tag names from Twig source.
 * Returns only the custom element tag names (e.g. `hx-button`, `hx-card`).
 * Twig comments are stripped first so example tags in docs are not flagged.
 */
function extractHxTags(source: string): Set<string> {
  const stripped = stripTwigComments(source);
  const pattern = /<(hx-[a-z-]+)[\s/>]/g;
  const tags = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(stripped)) !== null) {
    tags.add(match[1]);
  }
  return tags;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('hx-library/src/components/ — sanity checks', () => {
  it('directory is accessible', () => {
    expect(() => readdirSync(HX_LIBRARY_COMPONENTS)).not.toThrow();
  });

  it('contains at least 70 component directories', () => {
    const names = getLibraryComponentNames();
    expect(names.size).toBeGreaterThanOrEqual(70);
  });

  it('contains hx-button', () => {
    expect(getLibraryComponentNames().has('hx-button')).toBe(true);
  });

  it('contains hx-card', () => {
    expect(getLibraryComponentNames().has('hx-card')).toBe(true);
  });

  it('contains hx-text', () => {
    expect(getLibraryComponentNames().has('hx-text')).toBe(true);
  });
});

describe('helix-sdc.manifest.yml — all components exist in hx-library', () => {
  const libraryComponents = getLibraryComponentNames();
  const manifestComponents = getManifestComponents();

  it('manifest references at least one component', () => {
    expect(manifestComponents.size).toBeGreaterThan(0);
  });

  for (const componentName of manifestComponents) {
    it(`${componentName} exists in hx-library/src/components/`, () => {
      expect(
        libraryComponents.has(componentName),
        `"${componentName}" is listed in helix-sdc.manifest.yml but has no directory in hx-library/src/components/`,
      ).toBe(true);
    });
  }
});

describe('Twig templates — all <hx-*> tags exist in hx-library', () => {
  const libraryComponents = getLibraryComponentNames();

  const allTwigFiles = [
    ...collectTwigFiles(COMPONENTS_DIR),
    ...collectTwigFiles(TEMPLATES_DIR),
  ];

  // Build a deduplicated map of tag -> files that use it.
  const tagToFiles = new Map<string, string[]>();
  for (const twigFile of allTwigFiles) {
    const source = readFileSync(twigFile, 'utf-8');
    const relativePath = twigFile.replace(PACKAGE_ROOT + '/', '');
    for (const tag of extractHxTags(source)) {
      if (!tagToFiles.has(tag)) tagToFiles.set(tag, []);
      tagToFiles.get(tag)!.push(relativePath);
    }
  }

  it('found hx-* tags in at least one template', () => {
    expect(tagToFiles.size).toBeGreaterThan(0);
  });

  for (const [tag, files] of tagToFiles) {
    it(`<${tag}> (used in ${files.length} template(s)) exists in hx-library`, () => {
      expect(
        libraryComponents.has(tag),
        `<${tag}> is used in [${files.join(', ')}] but "${tag}" has no directory in hx-library/src/components/`,
      ).toBe(true);
    });
  }
});

describe('extractHxTags() helper', () => {
  it('extracts a single tag', () => {
    const tags = extractHxTags('<hx-button variant="primary">Click</hx-button>');
    expect(tags.has('hx-button')).toBe(true);
  });

  it('extracts self-closing tags', () => {
    const tags = extractHxTags('<hx-icon name="arrow" />');
    expect(tags.has('hx-icon')).toBe(true);
  });

  it('extracts multiple distinct tags', () => {
    const tags = extractHxTags('<hx-card><hx-text>Hi</hx-text></hx-card>');
    expect(tags.has('hx-card')).toBe(true);
    expect(tags.has('hx-text')).toBe(true);
  });

  it('returns empty set for non-hx HTML', () => {
    const tags = extractHxTags('<div class="foo"><span>bar</span></div>');
    expect(tags.size).toBe(0);
  });

  it('does not include closing tags', () => {
    // </hx-card> should not create a match since the pattern requires a
    // character after the name that is not part of the name.
    const tags = extractHxTags('</hx-card>');
    expect(tags.size).toBe(0);
  });
});
