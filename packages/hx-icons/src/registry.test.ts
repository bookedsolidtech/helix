/**
 * Unit tests for the @helixui/icons registry module.
 *
 * Targets 100% statement + branch coverage of registry.ts. The registry
 * is module-level singleton state, so each test isolates itself by
 * unregistering any libraries it touches in `beforeEach` and restoring
 * the default base path in `afterEach`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getBasePath,
  getIconLibrary,
  registerIconLibrary,
  setBasePath,
  unregisterIconLibrary,
} from './registry.js';
import type { IconLibraryOptions, IconMutator, IconResolver } from './types.js';

const DEFAULT_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist';

const TEST_LIBRARIES = ['lib-a', 'lib-b', 'helix-test', 'fa-free-test', 'overwrite-target'];

const cleanLibraries = () => {
  for (const name of TEST_LIBRARIES) {
    unregisterIconLibrary(name);
  }
};

describe('registry — registerIconLibrary', () => {
  beforeEach(cleanLibraries);

  it('registers a library with a resolver and default-false spriteSheet', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver });

    const lib = getIconLibrary('lib-a');
    expect(lib).toBeDefined();
    expect(lib?.name).toBe('lib-a');
    expect(lib?.resolver).toBe(resolver);
    expect(lib?.mutator).toBeUndefined();
    expect(lib?.spriteSheet).toBe(false);
    expect(lib?.paintMode).toBe('fill');
  });

  it('defaults paintMode to "fill" when omitted', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver });
    expect(getIconLibrary('lib-a')?.paintMode).toBe('fill');
  });

  it('defaults paintMode to "fill" when undefined', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver, paintMode: undefined });
    expect(getIconLibrary('lib-a')?.paintMode).toBe('fill');
  });

  it('honors paintMode="stroke"', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver, paintMode: 'stroke' });
    expect(getIconLibrary('lib-a')?.paintMode).toBe('stroke');
  });

  it('honors paintMode="mixed"', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver, paintMode: 'mixed' });
    expect(getIconLibrary('lib-a')?.paintMode).toBe('mixed');
  });

  it('honors paintMode="fill" explicitly', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver, paintMode: 'fill' });
    expect(getIconLibrary('lib-a')?.paintMode).toBe('fill');
  });

  it('stores the supplied mutator', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    const mutator: IconMutator = vi.fn();
    registerIconLibrary('lib-a', { resolver, mutator });

    const lib = getIconLibrary('lib-a');
    expect(lib?.mutator).toBe(mutator);
  });

  it('honors spriteSheet=true', () => {
    const resolver: IconResolver = (name) => `/sprite.svg#${name}`;
    registerIconLibrary('lib-a', { resolver, spriteSheet: true });

    expect(getIconLibrary('lib-a')?.spriteSheet).toBe(true);
  });

  it('honors spriteSheet=false explicitly', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver, spriteSheet: false });

    expect(getIconLibrary('lib-a')?.spriteSheet).toBe(false);
  });

  it('defaults spriteSheet to false when undefined', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver, spriteSheet: undefined });

    expect(getIconLibrary('lib-a')?.spriteSheet).toBe(false);
  });

  it('overwrites an existing registration silently', () => {
    const first: IconResolver = (name) => `/v1/${name}.svg`;
    const second: IconResolver = (name) => `/v2/${name}.svg`;

    registerIconLibrary('overwrite-target', { resolver: first });
    expect(() => {
      registerIconLibrary('overwrite-target', { resolver: second, spriteSheet: true });
    }).not.toThrow();

    const lib = getIconLibrary('overwrite-target');
    expect(lib?.resolver).toBe(second);
    expect(lib?.spriteSheet).toBe(true);
  });

  it('throws TypeError when name is an empty string', () => {
    const resolver: IconResolver = (name) => name;
    expect(() => registerIconLibrary('', { resolver })).toThrow(TypeError);
  });

  it('throws TypeError when name is whitespace-only', () => {
    const resolver: IconResolver = (name) => name;
    expect(() => registerIconLibrary('   ', { resolver })).toThrow(TypeError);
  });

  it('throws TypeError when name is not a string', () => {
    const resolver: IconResolver = (name) => name;
    expect(() =>
      registerIconLibrary(
        // @ts-expect-error — exercising runtime validation
        123,
        { resolver },
      ),
    ).toThrow(TypeError);
  });

  it('throws TypeError when options is missing', () => {
    expect(() =>
      registerIconLibrary(
        'lib-a',
        // @ts-expect-error — exercising runtime validation
        undefined,
      ),
    ).toThrow(TypeError);
  });

  it('throws TypeError when resolver is missing', () => {
    expect(() =>
      registerIconLibrary(
        'lib-a',
        // @ts-expect-error — exercising runtime validation
        {},
      ),
    ).toThrow(TypeError);
  });

  it('throws TypeError when resolver is not a function', () => {
    expect(() =>
      registerIconLibrary('lib-a', {
        // @ts-expect-error — exercising runtime validation
        resolver: 'not-a-function',
      } as IconLibraryOptions),
    ).toThrow(TypeError);
  });
});

describe('registry — unregisterIconLibrary', () => {
  beforeEach(cleanLibraries);

  it('removes a registered library', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    registerIconLibrary('lib-a', { resolver });
    expect(getIconLibrary('lib-a')).toBeDefined();

    unregisterIconLibrary('lib-a');
    expect(getIconLibrary('lib-a')).toBeUndefined();
  });

  it('is a no-op for an unknown name', () => {
    expect(() => unregisterIconLibrary('never-registered')).not.toThrow();
    expect(getIconLibrary('never-registered')).toBeUndefined();
  });
});

describe('registry — getIconLibrary', () => {
  beforeEach(cleanLibraries);

  it('returns the registered library shape', () => {
    const resolver: IconResolver = (name) => `/icons/${name}.svg`;
    const mutator: IconMutator = () => undefined;
    registerIconLibrary('lib-a', {
      resolver,
      mutator,
      spriteSheet: true,
      paintMode: 'stroke',
    });

    const lib = getIconLibrary('lib-a');
    expect(lib).toEqual({
      name: 'lib-a',
      resolver,
      mutator,
      spriteSheet: true,
      paintMode: 'stroke',
    });
  });

  it('returns undefined for an unknown name', () => {
    expect(getIconLibrary('never-registered')).toBeUndefined();
  });
});

describe('registry — basePath', () => {
  const originalBasePath = getBasePath();

  afterEach(() => {
    setBasePath(originalBasePath);
  });

  it('exposes the default base path', () => {
    expect(originalBasePath).toBe(DEFAULT_BASE_PATH);
  });

  it('round-trips a custom base path', () => {
    setBasePath('/icons');
    expect(getBasePath()).toBe('/icons');
  });

  it('strips a single trailing slash', () => {
    setBasePath('/icons/');
    expect(getBasePath()).toBe('/icons');
  });

  it('strips multiple trailing slashes', () => {
    setBasePath('/icons///');
    expect(getBasePath()).toBe('/icons');
  });

  it('allows an empty string', () => {
    setBasePath('');
    expect(getBasePath()).toBe('');
  });

  it('preserves a path with no trailing slash unchanged', () => {
    setBasePath('https://example.com/assets');
    expect(getBasePath()).toBe('https://example.com/assets');
  });
});
