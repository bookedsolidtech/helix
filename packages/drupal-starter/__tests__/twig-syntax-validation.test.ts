import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';
import { describe, it, expect, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

interface LibraryEntry {
  version?: string;
  js?: Record<string, unknown>;
  css?: Record<string, unknown>;
  dependencies?: string[];
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const worktreeRoot = fileURLToPath(new URL('../../../', import.meta.url));
const componentsDir = resolve(worktreeRoot, 'packages/drupal-starter/components');
const librariesPath = resolve(worktreeRoot, 'packages/drupal-starter/helixui.libraries.yml');

// ---------------------------------------------------------------------------
// Fixture data — loaded once
// ---------------------------------------------------------------------------

let componentDirs: string[] = [];
let librariesYml: Record<string, LibraryEntry>;

// ---------------------------------------------------------------------------
// Twig syntax test suite
// ---------------------------------------------------------------------------

describe('Twig syntax validation', () => {
  beforeAll(() => {
    componentDirs = readdirSync(componentsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    librariesYml = load(readFileSync(librariesPath, 'utf8')) as Record<string, LibraryEntry>;
  });

  // Test 1 — all Twig files are non-empty
  it('all Twig files are non-empty', () => {
    const empty: string[] = [];

    for (const dirName of componentDirs) {
      const twigPath = join(componentsDir, dirName, `${dirName}.twig`);
      if (!existsSync(twigPath)) continue;
      const content = readFileSync(twigPath, 'utf8');
      if (content.trim().length === 0) {
        empty.push(dirName);
      }
    }

    expect(empty).toEqual([]);
  });

  // Test 2 — all Twig files have balanced block delimiters
  it('all Twig files have balanced block delimiters {% ... %}', () => {
    const unbalanced: string[] = [];

    for (const dirName of componentDirs) {
      const twigPath = join(componentsDir, dirName, `${dirName}.twig`);
      if (!existsSync(twigPath)) continue;
      const content = readFileSync(twigPath, 'utf8');

      const opens = (content.match(/\{%/g) ?? []).length;
      const closes = (content.match(/%\}/g) ?? []).length;

      if (opens !== closes) {
        unbalanced.push(`${dirName}: {%=${opens} %}=${closes}`);
      }
    }

    expect(unbalanced).toEqual([]);
  });

  // Test 3 — all Twig files have balanced expression delimiters
  it('all Twig files have balanced expression delimiters {{ ... }}', () => {
    const unbalanced: string[] = [];

    for (const dirName of componentDirs) {
      const twigPath = join(componentsDir, dirName, `${dirName}.twig`);
      if (!existsSync(twigPath)) continue;
      const content = readFileSync(twigPath, 'utf8');

      const opens = (content.match(/\{\{/g) ?? []).length;
      const closes = (content.match(/\}\}/g) ?? []).length;

      if (opens !== closes) {
        unbalanced.push(`${dirName}: {{=${opens} }}=${closes}`);
      }
    }

    expect(unbalanced).toEqual([]);
  });

  // Test 4 — all Twig files have balanced if blocks
  it('all Twig files have balanced if blocks ({% if %} / {% endif %})', () => {
    const unbalanced: string[] = [];

    const ifOpenRe = /\{%-?\s*if\b/g;
    const ifCloseRe = /\{%-?\s*endif\b/g;

    for (const dirName of componentDirs) {
      const twigPath = join(componentsDir, dirName, `${dirName}.twig`);
      if (!existsSync(twigPath)) continue;
      const content = readFileSync(twigPath, 'utf8');

      const opens = (content.match(ifOpenRe) ?? []).length;
      const closes = (content.match(ifCloseRe) ?? []).length;

      if (opens !== closes) {
        unbalanced.push(`${dirName}: if=${opens} endif=${closes}`);
      }
    }

    expect(unbalanced).toEqual([]);
  });

  // Test 5 — all Twig files have balanced for blocks
  it('all Twig files have balanced for blocks ({% for %} / {% endfor %})', () => {
    const unbalanced: string[] = [];

    const forOpenRe = /\{%-?\s*for\b/g;
    const forCloseRe = /\{%-?\s*endfor\b/g;

    for (const dirName of componentDirs) {
      const twigPath = join(componentsDir, dirName, `${dirName}.twig`);
      if (!existsSync(twigPath)) continue;
      const content = readFileSync(twigPath, 'utf8');

      const opens = (content.match(forOpenRe) ?? []).length;
      const closes = (content.match(forCloseRe) ?? []).length;

      if (opens !== closes) {
        unbalanced.push(`${dirName}: for=${opens} endfor=${closes}`);
      }
    }

    expect(unbalanced).toEqual([]);
  });

  // Test 6 — all Twig files that compose hx-* components have at least one attach_library call
  //
  // Components with empty dependency arrays in the manifest (e.g. views-grid)
  // use no hx-* components and therefore legitimately omit attach_library.
  // The test applies only to SDCs that do compose HELiX web components.
  it('Twig files that compose hx-* components have at least one attach_library call', () => {
    const missing: string[] = [];

    for (const dirName of componentDirs) {
      const twigPath = join(componentsDir, dirName, `${dirName}.twig`);
      if (!existsSync(twigPath)) continue;
      const content = readFileSync(twigPath, 'utf8');

      // Skip files that reference no hx-* tags at all — they have nothing to attach
      const usesHxComponents = /<hx-[a-z]/i.test(content);
      if (!usesHxComponents) continue;

      if (!content.includes('attach_library(')) {
        missing.push(dirName);
      }
    }

    expect(missing).toEqual([]);
  });

  // Test 7 — attach_library calls reference valid helixui libraries
  it("attach_library calls reference valid library keys in helixui.libraries.yml", () => {
    const invalidRefs: string[] = [];
    const attachLibraryRegex = /attach_library\(['"]helixui\/([^'"]+)['"]\)/g;

    for (const dirName of componentDirs) {
      const twigPath = join(componentsDir, dirName, `${dirName}.twig`);
      if (!existsSync(twigPath)) continue;
      const content = readFileSync(twigPath, 'utf8');

      let match: RegExpExecArray | null;
      while ((match = attachLibraryRegex.exec(content)) !== null) {
        const libraryKey = match[1];
        if (!(libraryKey in librariesYml)) {
          invalidRefs.push(`${dirName}: references non-existent library 'helixui/${libraryKey}'`);
        }
      }
    }

    expect(invalidRefs).toEqual([]);
  });
});
