import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── env module tests ─────────────────────────────────────────────────────────
// The env module reads process.env at import time, so we use vi.resetModules()
// before each test and re-import to pick up env changes.

describe('env — DOCS_URL', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_HELIX_DOCS_URL;
    delete process.env.NEXT_PUBLIC_HELIX_STORYBOOK_URL;
  });

  it('defaults to localhost:3150 when env var is unset', async () => {
    delete process.env.NEXT_PUBLIC_HELIX_DOCS_URL;
    const { DOCS_URL } = await import('./env');
    expect(DOCS_URL).toBe('http://localhost:3150');
  });

  it('uses NEXT_PUBLIC_HELIX_DOCS_URL when set', async () => {
    process.env.NEXT_PUBLIC_HELIX_DOCS_URL = 'https://docs.example.com';
    const { DOCS_URL } = await import('./env?t=docs');
    expect(DOCS_URL).toBe('https://docs.example.com');
  });
});

describe('env — STORYBOOK_URL', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_HELIX_STORYBOOK_URL;
  });

  it('defaults to localhost:3151 when env var is unset', async () => {
    delete process.env.NEXT_PUBLIC_HELIX_STORYBOOK_URL;
    const { STORYBOOK_URL } = await import('./env');
    expect(STORYBOOK_URL).toBe('http://localhost:3151');
  });

  it('uses NEXT_PUBLIC_HELIX_STORYBOOK_URL when set', async () => {
    process.env.NEXT_PUBLIC_HELIX_STORYBOOK_URL = 'https://storybook.example.com';
    const { STORYBOOK_URL } = await import('./env?t=storybook');
    expect(STORYBOOK_URL).toBe('https://storybook.example.com');
  });
});

describe('getStorybookUrl', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_HELIX_STORYBOOK_URL;
  });

  it('generates a storybook URL for a component with default variant', async () => {
    const { getStorybookUrl } = await import('./env');
    const url = getStorybookUrl('hx-button');
    expect(url).toBe('http://localhost:3151/?path=/story/components-hx-button--default');
  });

  it('generates a storybook URL for a component with custom variant', async () => {
    const { getStorybookUrl } = await import('./env');
    const url = getStorybookUrl('hx-card', 'primary');
    expect(url).toBe('http://localhost:3151/?path=/story/components-hx-card--primary');
  });

  it('uses the configured STORYBOOK_URL as base', async () => {
    process.env.NEXT_PUBLIC_HELIX_STORYBOOK_URL = 'https://storybook.example.com';
    const { getStorybookUrl } = await import('./env?t=sb-url');
    const url = getStorybookUrl('hx-text-input', 'disabled');
    expect(url).toBe(
      'https://storybook.example.com/?path=/story/components-hx-text-input--disabled',
    );
  });

  it('includes the path and story pattern', async () => {
    const { getStorybookUrl } = await import('./env');
    const url = getStorybookUrl('hx-select', 'multi');
    expect(url).toContain('/?path=/story/');
    expect(url).toContain('components-hx-select');
    expect(url).toContain('--multi');
  });
});

describe('getDocsUrl', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_HELIX_DOCS_URL;
  });

  it('generates a docs URL for a component tag', async () => {
    const { getDocsUrl } = await import('./env');
    const url = getDocsUrl('hx-button');
    expect(url).toBe('http://localhost:3150/component-library/hx-button/');
  });

  it('uses the configured DOCS_URL as base', async () => {
    process.env.NEXT_PUBLIC_HELIX_DOCS_URL = 'https://docs.example.com';
    const { getDocsUrl } = await import('./env?t=docs-url');
    const url = getDocsUrl('hx-card');
    expect(url).toBe('https://docs.example.com/component-library/hx-card/');
  });

  it('appends a trailing slash to the docs URL', async () => {
    const { getDocsUrl } = await import('./env');
    const url = getDocsUrl('hx-text-input');
    expect(url.endsWith('/')).toBe(true);
  });

  it('includes the component-library path segment', async () => {
    const { getDocsUrl } = await import('./env');
    const url = getDocsUrl('hx-select');
    expect(url).toContain('/component-library/');
  });
});
