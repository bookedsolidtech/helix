/**
 * Auto-registration smoke tests for the bundled `feather` icon library.
 *
 * Mirrors `fa-free.test.ts`. The feather library resolves names against
 * the `feather.svg` sprite shipped from the build output and declares
 * `paintMode: 'stroke'` (Feather glyphs are outline icons).
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  getBasePath,
  getIconLibrary,
  setBasePath,
} from '../registry.js';

import './feather.js';

const DEFAULT_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist';

describe('libraries/feather — auto-registration', () => {
  let originalBasePath: string;

  beforeAll(() => {
    originalBasePath = getBasePath();
  });

  afterEach(() => {
    setBasePath(originalBasePath);
  });

  it('registers the feather library on import', () => {
    expect(getIconLibrary('feather')).toBeDefined();
  });

  it('declares paintMode "stroke"', () => {
    expect(getIconLibrary('feather')?.paintMode).toBe('stroke');
  });

  it('declares spriteSheet=true', () => {
    expect(getIconLibrary('feather')?.spriteSheet).toBe(true);
  });

  it('resolves a name against the default base path', () => {
    setBasePath(DEFAULT_BASE_PATH);
    const lib = getIconLibrary('feather');
    expect(lib?.resolver('activity')).toBe(
      `${DEFAULT_BASE_PATH}/feather.svg#activity`,
    );
  });

  it('resolves a name against a custom base path', () => {
    setBasePath('/cdn/icons');
    const lib = getIconLibrary('feather');
    expect(lib?.resolver('heart')).toBe('/cdn/icons/feather.svg#heart');
  });

  it('round-trips through the registry as a complete library entry', () => {
    setBasePath('/base');
    const lib = getIconLibrary('feather');
    expect(lib).toMatchObject({
      name: 'feather',
      spriteSheet: true,
      paintMode: 'stroke',
    });
    expect(typeof lib?.resolver).toBe('function');
  });
});
