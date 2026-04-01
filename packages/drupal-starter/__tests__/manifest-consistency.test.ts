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
const manifestPath = resolve(worktreeRoot, 'packages/drupal-starter/helix-sdc.manifest.yml');
const librariesPath = resolve(worktreeRoot, 'packages/drupal-starter/helixui.libraries.yml');

// ---------------------------------------------------------------------------
// Fixture data — loaded once
// ---------------------------------------------------------------------------

let componentDirs: string[] = [];
let manifest: Record<string, string[]>;
let librariesYml: Record<string, LibraryEntry>;

// ---------------------------------------------------------------------------
// Manifest consistency test suite
// ---------------------------------------------------------------------------

describe('manifest-consistency', () => {
  beforeAll(() => {
    componentDirs = readdirSync(componentsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    manifest = load(readFileSync(manifestPath, 'utf8')) as Record<string, string[]>;
    librariesYml = load(readFileSync(librariesPath, 'utf8')) as Record<string, LibraryEntry>;
  });

  // Test 1 — manifest loads and is a valid YAML object
  it('manifest loads and is a valid YAML object with at least one key', () => {
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe('object');
    expect(manifest).not.toBeNull();
    expect(Object.keys(manifest).length).toBeGreaterThan(0);
  });

  // Test 2 — all manifest component keys have a corresponding component directory
  it('all manifest component keys have a corresponding component directory', () => {
    const missing: string[] = [];

    for (const key of Object.keys(manifest)) {
      const dirPath = join(componentsDir, key);
      if (!existsSync(dirPath)) {
        missing.push(`${key}: directory not found at components/${key}/`);
      }
    }

    expect(missing).toEqual([]);
  });

  // Test 3 — all non-hx-* component directories appear as manifest keys
  it('all non-hx-* component directories are listed in the manifest', () => {
    const manifestKeys = new Set(Object.keys(manifest));
    const unlisted: string[] = [];

    for (const dirName of componentDirs) {
      if (dirName.startsWith('hx-')) continue;
      if (!manifestKeys.has(dirName)) {
        unlisted.push(dirName);
      }
    }

    expect(unlisted).toEqual([]);
  });

  // Test 4 — all manifest dependency values reference valid hx-* component names
  //
  // A dependency name is valid if it either:
  //   (a) exists as a component directory in components/, OR
  //   (b) exists as a library key in helixui.libraries.yml
  it('all manifest dependency values reference valid hx-* component names', () => {
    const componentDirSet = new Set(componentDirs);
    const libraryKeys = new Set(Object.keys(librariesYml));
    const invalid: string[] = [];

    for (const [sdcName, deps] of Object.entries(manifest)) {
      if (!Array.isArray(deps)) continue;
      for (const dep of deps) {
        const isInComponents = componentDirSet.has(dep);
        const isInLibraries = libraryKeys.has(dep);
        if (!isInComponents && !isInLibraries) {
          invalid.push(`${sdcName}: dependency '${dep}' not found in components/ or libraries.yml`);
        }
      }
    }

    expect(invalid).toEqual([]);
  });

  // Test 5 — libraries.yml loads and contains a core entry with a version field
  it('libraries.yml loads and contains a core entry with a version field', () => {
    expect(librariesYml).toBeDefined();
    expect(typeof librariesYml).toBe('object');
    expect(librariesYml).not.toBeNull();
    expect('core' in librariesYml).toBe(true);
    expect(librariesYml['core'].version).toBeDefined();
    expect(typeof librariesYml['core'].version).toBe('string');
  });

  // Test 6 — all hx-* component directories have a library entry in helixui.libraries.yml
  it('all hx-* component directories have a library entry in helixui.libraries.yml', () => {
    const missing: string[] = [];

    for (const dirName of componentDirs) {
      if (!dirName.startsWith('hx-')) continue;
      if (!(dirName in librariesYml)) {
        missing.push(`${dirName}: no library entry found in helixui.libraries.yml`);
      }
    }

    expect(missing).toEqual([]);
  });

  // Test 7 — all helixui.libraries.yml dependency references are valid
  //
  // For each library entry that has `dependencies`, any dependency of the
  // form `helixui/X` must have X be a valid library key in the same file.
  // Dependencies prefixed with `core/` are Drupal core libraries and are exempt.
  it('all helixui.libraries.yml dependency references are valid', () => {
    const libraryKeys = new Set(Object.keys(librariesYml));
    const invalid: string[] = [];

    for (const [libName, entry] of Object.entries(librariesYml)) {
      if (!Array.isArray(entry.dependencies)) continue;
      for (const dep of entry.dependencies) {
        if (typeof dep !== 'string') continue;
        if (!dep.startsWith('helixui/')) continue;
        const refKey = dep.slice('helixui/'.length);
        if (!libraryKeys.has(refKey)) {
          invalid.push(`${libName}: dependency '${dep}' references unknown library key '${refKey}'`);
        }
      }
    }

    expect(invalid).toEqual([]);
  });
});
