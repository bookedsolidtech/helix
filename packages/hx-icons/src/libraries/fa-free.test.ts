/**
 * Auto-registration smoke tests for the bundled `fa-free` icon library.
 *
 * Mirrors `helix.test.ts`. The fa-free library resolves names against
 * the `fa-free-solid.svg` sprite shipped from the build output.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  getBasePath,
  getIconLibrary,
  setBasePath,
} from '../registry.js';

import './fa-free.js';

const DEFAULT_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist';

describe('libraries/fa-free — auto-registration', () => {
  let originalBasePath: string;

  beforeAll(() => {
    originalBasePath = getBasePath();
  });

  afterEach(() => {
    setBasePath(originalBasePath);
  });

  it('registers the fa-free library on import', () => {
    expect(getIconLibrary('fa-free')).toBeDefined();
  });

  it('declares paintMode "fill"', () => {
    expect(getIconLibrary('fa-free')?.paintMode).toBe('fill');
  });

  it('declares spriteSheet=true', () => {
    expect(getIconLibrary('fa-free')?.spriteSheet).toBe(true);
  });

  it('resolves a name against the default base path', () => {
    setBasePath(DEFAULT_BASE_PATH);
    const lib = getIconLibrary('fa-free');
    expect(lib?.resolver('stethoscope')).toBe(
      `${DEFAULT_BASE_PATH}/fa-free-solid.svg#stethoscope`,
    );
  });

  it('resolves a name against a custom base path', () => {
    setBasePath('/cdn/icons');
    const lib = getIconLibrary('fa-free');
    expect(lib?.resolver('heart-pulse')).toBe('/cdn/icons/fa-free-solid.svg#heart-pulse');
  });

  it('round-trips through the registry as a complete library entry', () => {
    setBasePath('/base');
    const lib = getIconLibrary('fa-free');
    expect(lib).toMatchObject({
      name: 'fa-free',
      spriteSheet: true,
      paintMode: 'fill',
    });
    expect(typeof lib?.resolver).toBe('function');
  });
});
