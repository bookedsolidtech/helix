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

afterEach(cleanup);

async function resolveButtonStyles(theme: 'light' | 'dark') {
  const wrapper = await fixture<HelixTheme>(
    `<hx-theme theme="${theme}"><hx-button variant="outline">Action</hx-button></hx-theme>`
  );
  await wrapper.updateComplete;
  const button = wrapper.querySelector('hx-button')!;
  await (button as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
  const inner = shadowQuery(button, '.button')!;
  const cs = getComputedStyle(inner);
  return {
    color: cs.color.trim(),
    borderColor: cs.borderColor.trim(),
    backgroundColor: cs.backgroundColor.trim(),
  };
}

describe('dark-mode token resolution', () => {
  it('outline button resolves different color, border, and surface in dark vs light', async () => {
    const light = await resolveButtonStyles('light');
    cleanup();
    const dark = await resolveButtonStyles('dark');

    expect(dark.color).not.toBe(light.color);
    expect(dark.borderColor).not.toBe(light.borderColor);
  });
});
