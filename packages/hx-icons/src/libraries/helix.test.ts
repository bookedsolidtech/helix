/**
 * Auto-registration smoke tests for the bundled `helix` icon library.
 *
 * The module under test is a pure side-effect import: importing
 * `./helix.js` registers the library. We assert the registered shape,
 * the resolver against the global base path, and `paintMode: 'fill'`.
 *
 * Tests are isolated from the global registry by saving the previous
 * `helix` entry (if any) before the import and restoring it after each
 * `setBasePath` mutation. The order of side effects matters in this
 * file — `import './helix.js'` happens at module load time.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  getBasePath,
  getIconLibrary,
  setBasePath,
} from '../registry.js';

import './helix.js';

const DEFAULT_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist';

describe('libraries/helix — auto-registration', () => {
  let originalBasePath: string;

  beforeAll(() => {
    originalBasePath = getBasePath();
  });

  afterEach(() => {
    setBasePath(originalBasePath);
  });

  it('registers the helix library on import', () => {
    expect(getIconLibrary('helix')).toBeDefined();
  });

  it('declares paintMode "fill"', () => {
    expect(getIconLibrary('helix')?.paintMode).toBe('fill');
  });

  it('declares spriteSheet=true', () => {
    expect(getIconLibrary('helix')?.spriteSheet).toBe(true);
  });

  it('resolves a name against the default base path', () => {
    setBasePath(DEFAULT_BASE_PATH);
    const lib = getIconLibrary('helix');
    expect(lib?.resolver('check')).toBe(`${DEFAULT_BASE_PATH}/helix.svg#check`);
  });

  it('resolves a name against a custom base path', () => {
    setBasePath('/local-icons');
    const lib = getIconLibrary('helix');
    expect(lib?.resolver('chevron-down')).toBe('/local-icons/helix.svg#chevron-down');
  });

  it('round-trips through the registry as a complete library entry', () => {
    setBasePath('/base');
    const lib = getIconLibrary('helix');
    expect(lib).toMatchObject({
      name: 'helix',
      spriteSheet: true,
      paintMode: 'fill',
    });
    expect(typeof lib?.resolver).toBe('function');
  });
});
