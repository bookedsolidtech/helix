import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('env helpers', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('DOCS_URL defaults to localhost:3150', async () => {
    const { DOCS_URL } = await import('@/lib/env');
    expect(DOCS_URL).toBe('http://localhost:3150');
  });

  it('STORYBOOK_URL defaults to localhost:3151', async () => {
    const { STORYBOOK_URL } = await import('@/lib/env');
    expect(STORYBOOK_URL).toBe('http://localhost:3151');
  });

  it('DOCS_URL uses env var when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_HELIX_DOCS_URL', 'https://docs.example.com');
    const { DOCS_URL } = await import('@/lib/env');
    expect(DOCS_URL).toBe('https://docs.example.com');
  });

  it('STORYBOOK_URL uses env var when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_HELIX_STORYBOOK_URL', 'https://storybook.example.com');
    const { STORYBOOK_URL } = await import('@/lib/env');
    expect(STORYBOOK_URL).toBe('https://storybook.example.com');
  });

  it('getStorybookUrl formats the URL correctly', async () => {
    const { getStorybookUrl } = await import('@/lib/env');
    expect(getStorybookUrl('hx-button', 'primary')).toBe(
      'http://localhost:3151/?path=/story/components-hx-button--primary',
    );
  });

  it('getStorybookUrl defaults variant to "default"', async () => {
    const { getStorybookUrl } = await import('@/lib/env');
    expect(getStorybookUrl('hx-card')).toBe(
      'http://localhost:3151/?path=/story/components-hx-card--default',
    );
  });

  it('getDocsUrl formats the URL with trailing slash', async () => {
    const { getDocsUrl } = await import('@/lib/env');
    expect(getDocsUrl('hx-card')).toBe('http://localhost:3150/component-library/hx-card/');
  });

  it('getStorybookUrl uses custom STORYBOOK_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_HELIX_STORYBOOK_URL', 'https://sb.example.com');
    const { getStorybookUrl } = await import('@/lib/env');
    expect(getStorybookUrl('hx-button')).toContain('https://sb.example.com');
  });

  it('getDocsUrl uses custom DOCS_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_HELIX_DOCS_URL', 'https://docs.example.com');
    const { getDocsUrl } = await import('@/lib/env');
    expect(getDocsUrl('hx-select')).toContain('https://docs.example.com');
  });
});
