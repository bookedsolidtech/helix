/**
 * Auto-registration smoke tests for the bundled `lucide` icon library.
 *
 * Mirrors `fa-free.test.ts`. The lucide library resolves names against
 * the `lucide.svg` sprite shipped from the build output and declares
 * `paintMode: 'stroke'` (Lucide glyphs are outline icons).
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  getBasePath,
  getIconLibrary,
  setBasePath,
} from '../registry.js';

import './lucide.js';

const DEFAULT_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist';

describe('libraries/lucide — auto-registration', () => {
  let originalBasePath: string;

  beforeAll(() => {
    originalBasePath = getBasePath();
  });

  afterEach(() => {
    setBasePath(originalBasePath);
  });

  it('registers the lucide library on import', () => {
    expect(getIconLibrary('lucide')).toBeDefined();
  });

  it('declares paintMode "stroke"', () => {
    expect(getIconLibrary('lucide')?.paintMode).toBe('stroke');
  });

  it('declares spriteSheet=true', () => {
    expect(getIconLibrary('lucide')?.spriteSheet).toBe(true);
  });

  it('resolves a name against the default base path', () => {
    setBasePath(DEFAULT_BASE_PATH);
    const lib = getIconLibrary('lucide');
    expect(lib?.resolver('activity')).toBe(
      `${DEFAULT_BASE_PATH}/lucide.svg#activity`,
    );
  });

  it('resolves a name against a custom base path', () => {
    setBasePath('/cdn/icons');
    const lib = getIconLibrary('lucide');
    expect(lib?.resolver('heart')).toBe('/cdn/icons/lucide.svg#heart');
  });

  it('round-trips through the registry as a complete library entry', () => {
    setBasePath('/base');
    const lib = getIconLibrary('lucide');
    expect(lib).toMatchObject({
      name: 'lucide',
      spriteSheet: true,
      paintMode: 'stroke',
    });
    expect(typeof lib?.resolver).toBe('function');
  });
});
