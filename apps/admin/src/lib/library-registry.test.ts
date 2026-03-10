import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ── Helpers ──────────────────────────────────────────────────────────────────

let tmpDir: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'library-registry-test-'));
  // Create src/data directory so the registry can be written
  mkdirSync(join(tmpDir, 'src', 'data'), { recursive: true });
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
});

afterEach(() => {
  cwdSpy.mockRestore();
  rmSync(tmpDir, { recursive: true, force: true });
});

// Re-import the module AFTER mocking cwd so the path resolves correctly.
// Because vitest caches modules, we use dynamic imports inside each test group.
async function importRegistry() {
  // Force re-evaluation by appending a cache-busting query (vitest doesn't cache ESM queries)
  const mod = await import('./library-registry?t=' + Date.now().toString());
  return mod;
}

// ── getRegistry ───────────────────────────────────────────────────────────────

describe('getRegistry', () => {
  it('returns empty array when registry file does not exist', async () => {
    const { getRegistry } = await importRegistry();
    expect(getRegistry()).toEqual([]);
  });

  it('returns entries from existing registry file', async () => {
    const { addLibrary, getRegistry } = await importRegistry();
    addLibrary({
      name: 'Test Library',
      source: 'local',
      cemPath: 'packages/test/custom-elements.json',
      prefix: 'test-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });
    const entries = getRegistry();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.name).toBe('Test Library');
  });
});

// ── addLibrary ────────────────────────────────────────────────────────────────

describe('addLibrary', () => {
  it('adds a local library and returns the entry with generated ID', async () => {
    const { addLibrary, getRegistry } = await importRegistry();
    const entry = addLibrary({
      name: 'My Component Library',
      source: 'local',
      cemPath: 'packages/my-lib/custom-elements.json',
      prefix: 'mc-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });

    expect(entry.id).toBe('my-component-library');
    expect(entry.name).toBe('My Component Library');
    expect(getRegistry()).toHaveLength(1);
  });

  it('adds a CDN library with packageName and version', async () => {
    const { addLibrary } = await importRegistry();
    const entry = addLibrary({
      name: 'Shoelace',
      source: 'cdn',
      packageName: '@shoelace-style/shoelace',
      version: '2.15.0',
      prefix: 'sl-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });

    expect(entry.id).toBe('shoelace');
    expect(entry.packageName).toBe('@shoelace-style/shoelace');
  });

  it('adds an npm library with packageName', async () => {
    const { addLibrary } = await importRegistry();
    const entry = addLibrary({
      name: 'Carbon Web Components',
      source: 'npm',
      packageName: '@carbon/web-components',
      version: '1.0.0',
      prefix: 'cds-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });

    expect(entry.source).toBe('npm');
    expect(entry.packageName).toBe('@carbon/web-components');
  });

  it('throws when local library is missing cemPath', async () => {
    const { addLibrary } = await importRegistry();
    expect(() =>
      addLibrary({
        name: 'Missing CEM',
        source: 'local',
        prefix: 'mc-',
        isDefault: false,
        lastScored: null,
        componentCount: 0,
      }),
    ).toThrow('cemPath is required for local libraries');
  });

  it('throws when cdn library is missing packageName', async () => {
    const { addLibrary } = await importRegistry();
    expect(() =>
      addLibrary({
        name: 'Missing Package',
        source: 'cdn',
        prefix: 'mp-',
        isDefault: false,
        lastScored: null,
        componentCount: 0,
      }),
    ).toThrow('packageName is required for cdn and npm libraries');
  });

  it('throws when npm library is missing packageName', async () => {
    const { addLibrary } = await importRegistry();
    expect(() =>
      addLibrary({
        name: 'No Package',
        source: 'npm',
        prefix: 'np-',
        isDefault: false,
        lastScored: null,
        componentCount: 0,
      }),
    ).toThrow('packageName is required for cdn and npm libraries');
  });

  it('throws on duplicate ID', async () => {
    const { addLibrary } = await importRegistry();
    addLibrary({
      name: 'Dupe Library',
      source: 'local',
      cemPath: 'packages/dupe/cem.json',
      prefix: 'du-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });

    expect(() =>
      addLibrary({
        name: 'Dupe Library',
        source: 'local',
        cemPath: 'packages/dupe2/cem.json',
        prefix: 'du2-',
        isDefault: false,
        lastScored: null,
        componentCount: 0,
      }),
    ).toThrow('already exists');
  });
});

// ── getLibrary ────────────────────────────────────────────────────────────────

describe('getLibrary', () => {
  it('returns the entry for a known ID', async () => {
    const { addLibrary, getLibrary } = await importRegistry();
    addLibrary({
      name: 'Lookup Library',
      source: 'local',
      cemPath: 'packages/lookup/cem.json',
      prefix: 'lu-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });

    const entry = getLibrary('lookup-library');
    expect(entry).toBeDefined();
    expect(entry?.name).toBe('Lookup Library');
  });

  it('returns undefined for an unknown ID', async () => {
    const { getLibrary } = await importRegistry();
    expect(getLibrary('nonexistent')).toBeUndefined();
  });
});

// ── getDefaultLibrary ─────────────────────────────────────────────────────────

describe('getDefaultLibrary', () => {
  it('returns the default library', async () => {
    const { addLibrary, getDefaultLibrary } = await importRegistry();
    addLibrary({
      name: 'Default Lib',
      source: 'local',
      cemPath: 'packages/default/cem.json',
      prefix: 'df-',
      isDefault: true,
      lastScored: null,
      componentCount: 0,
    });
    addLibrary({
      name: 'Secondary Lib',
      source: 'local',
      cemPath: 'packages/secondary/cem.json',
      prefix: 'sc-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });

    const entry = getDefaultLibrary();
    expect(entry?.name).toBe('Default Lib');
  });

  it('returns undefined when no default is set', async () => {
    const { getDefaultLibrary } = await importRegistry();
    expect(getDefaultLibrary()).toBeUndefined();
  });
});

// ── updateLibrary ─────────────────────────────────────────────────────────────

describe('updateLibrary', () => {
  it('partially updates an existing library', async () => {
    const { addLibrary, updateLibrary, getLibrary } = await importRegistry();
    addLibrary({
      name: 'Update Target',
      source: 'local',
      cemPath: 'packages/update/cem.json',
      prefix: 'up-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });

    const updated = updateLibrary('update-target', { componentCount: 12 });
    expect(updated.componentCount).toBe(12);
    expect(updated.name).toBe('Update Target');
    expect(getLibrary('update-target')?.componentCount).toBe(12);
  });

  it('throws when updating a non-existent library', async () => {
    const { updateLibrary } = await importRegistry();
    expect(() => updateLibrary('ghost-lib', { componentCount: 5 })).toThrow('not found');
  });
});

// ── removeLibrary ─────────────────────────────────────────────────────────────

describe('removeLibrary', () => {
  it('removes a non-default library', async () => {
    const { addLibrary, removeLibrary, getRegistry } = await importRegistry();
    addLibrary({
      name: 'Removable Lib',
      source: 'local',
      cemPath: 'packages/removable/cem.json',
      prefix: 'rm-',
      isDefault: false,
      lastScored: null,
      componentCount: 0,
    });

    expect(getRegistry()).toHaveLength(1);
    removeLibrary('removable-lib');
    expect(getRegistry()).toHaveLength(0);
  });

  it('throws when removing the default library', async () => {
    const { addLibrary, removeLibrary } = await importRegistry();
    addLibrary({
      name: 'Protected Default',
      source: 'local',
      cemPath: 'packages/protected/cem.json',
      prefix: 'pd-',
      isDefault: true,
      lastScored: null,
      componentCount: 0,
    });

    expect(() => removeLibrary('protected-default')).toThrow('Cannot remove the default library');
  });

  it('throws when removing a non-existent library', async () => {
    const { removeLibrary } = await importRegistry();
    expect(() => removeLibrary('no-such-lib')).toThrow('not found');
  });
});
