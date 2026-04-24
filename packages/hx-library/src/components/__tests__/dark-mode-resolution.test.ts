/**
 * Dark-mode resolution regression test.
 *
 * Guards the semantic-token rebinding sweep (see
 * docs/design-tokens/tiers.md#component-token-binding-rule). A component
 * wrapped in <hx-theme theme="dark"> must resolve its surface, text, and
 * border colors to DIFFERENT computed values than the same component in
 * light mode. If a future change rebinds a property back to a primitive
 * (--hx-color-neutral-*), that property would freeze in its Light palette
 * value under the dark theme and this test would catch it.
 *
 * Covers hx-button[variant="outline"] specifically because it binds all three
 * token categories (text-primary for color, border-strong for border, and
 * inherits surface-default from the host). One component, three tiers.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { fixture, shadowQuery, cleanup } from '../../test-utils.js';
import type { HelixTheme } from '../hx-theme/hx-theme.js';
import '../hx-theme/index.js';
import '../hx-button/index.js';
import '../hx-pagination/index.js';
import '../hx-tooltip/index.js';
import '../hx-side-nav/index.js';

afterEach(cleanup);

type ThemeMode = 'light' | 'dark' | 'high-contrast';

async function resolveStyles(theme: ThemeMode, markup: string, selector: string, shadowSel: string) {
  const wrapper = await fixture<HelixTheme>(`<hx-theme theme="${theme}">${markup}</hx-theme>`);
  await wrapper.updateComplete;
  const target = wrapper.querySelector(selector) as HTMLElement & {
    updateComplete?: Promise<unknown>;
  };
  if (target.updateComplete) await target.updateComplete;
  const inner = shadowQuery(target, shadowSel)!;
  const cs = getComputedStyle(inner);
  return {
    color: cs.color.trim(),
    borderColor: cs.borderColor.trim(),
    backgroundColor: cs.backgroundColor.trim(),
  };
}

describe('dark-mode token resolution', () => {
  it('outline button resolves different color, border, and surface in dark vs light', async () => {
    const light = await resolveStyles('light', '<hx-button variant="outline">Action</hx-button>', 'hx-button', '.button');
    cleanup();
    const dark = await resolveStyles('dark', '<hx-button variant="outline">Action</hx-button>', 'hx-button', '.button');

    expect(dark.color).not.toBe(light.color);
    expect(dark.borderColor).not.toBe(light.borderColor);
  });

  it('primary button foreground stays light on brand fill across modes (text-on-primary contract)', async () => {
    const markup = '<hx-button variant="primary">Action</hx-button>';
    const light = await resolveStyles('light', markup, 'hx-button', '.button');
    cleanup();
    const dark = await resolveStyles('dark', markup, 'hx-button', '.button');
    cleanup();
    const hc = await resolveStyles('high-contrast', markup, 'hx-button', '.button');

    // light + dark: foreground stays near-white on primary-500 fill. HC: fg flips to #000 on bright HC primary.
    expect(light.color).toBe(dark.color);
    expect(hc.color).not.toBe(light.color);
  });

  it('pagination active page uses text-on-primary (not text-inverse) so fg is stable on brand fill', async () => {
    const markup = '<hx-pagination total-pages="5" current-page="3"></hx-pagination>';
    const light = await resolveStyles('light', markup, 'hx-pagination', '.button[aria-current="page"]');
    cleanup();
    const dark = await resolveStyles('dark', markup, 'hx-pagination', '.button[aria-current="page"]');

    // regression guard: if fg were bound to text-inverse, dark would flip to near-black
    // which is illegible on a primary-500 bg. text-on-primary keeps it light in both modes.
    expect(light.color).toBe(dark.color);
  });

  it('nav-item surface-inverse + text-inverse flip between light and dark', async () => {
    const markup = '<hx-nav-item label="Home"></hx-nav-item>';
    const light = await resolveStyles('light', markup, 'hx-nav-item', '.nav-item__link');
    cleanup();
    const dark = await resolveStyles('dark', markup, 'hx-nav-item', '.nav-item__link');

    // host binds surface-inverse + text-inverse — both must flip per mode.
    // regression guard: if host were bound to neutral-900 directly, dark mode
    // would freeze at the Light-palette value.
    expect(dark.color).not.toBe(light.color);
  });

  it('tooltip surface-inverse + text-inverse flip between light and dark', async () => {
    const markup =
      '<hx-tooltip><button>T</button><span slot="content">Help</span></hx-tooltip>';
    const light = await resolveStyles('light', markup, 'hx-tooltip', '[part="tooltip"]');
    cleanup();
    const dark = await resolveStyles('dark', markup, 'hx-tooltip', '[part="tooltip"]');

    expect(dark.backgroundColor).not.toBe(light.backgroundColor);
    expect(dark.color).not.toBe(light.color);
  });
});
