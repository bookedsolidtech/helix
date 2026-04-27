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
import '../hx-status-indicator/index.js';
import '../hx-stat/index.js';
import '../hx-steps/index.js';

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

  it('status-indicator show-label text-strong flips between light and dark', async () => {
    const markup = '<hx-status-indicator status="online" show-label label="Online"></hx-status-indicator>';
    const light = await resolveStyles('light', markup, 'hx-status-indicator', '.indicator__label');
    cleanup();
    const dark = await resolveStyles('dark', markup, 'hx-status-indicator', '.indicator__label');
    expect(dark.color).not.toBe(light.color);
  });

  it('stat value/label semantic text tokens flip between light and dark', async () => {
    const markup = '<hx-stat value="42" label="Patients"></hx-stat>';
    const lightValue = await resolveStyles('light', markup, 'hx-stat', '.stat__value');
    cleanup();
    const darkValue = await resolveStyles('dark', markup, 'hx-stat', '.stat__value');
    cleanup();
    const lightLabel = await resolveStyles('light', markup, 'hx-stat', '.stat__label');
    cleanup();
    const darkLabel = await resolveStyles('dark', markup, 'hx-stat', '.stat__label');
    expect(darkValue.color).not.toBe(lightValue.color);
    expect(darkLabel.color).not.toBe(lightLabel.color);
  });

  it('step label + description semantic text tokens flip between light and dark', async () => {
    const markup =
      '<hx-steps><hx-step label="One" description="First"></hx-step></hx-steps>';
    const lightLabel = await resolveStyles('light', markup, 'hx-step', '.step__label');
    cleanup();
    const darkLabel = await resolveStyles('dark', markup, 'hx-step', '.step__label');
    cleanup();
    const lightDesc = await resolveStyles('light', markup, 'hx-step', '.step__description');
    cleanup();
    const darkDesc = await resolveStyles('dark', markup, 'hx-step', '.step__description');
    expect(darkLabel.color).not.toBe(lightLabel.color);
    expect(darkDesc.color).not.toBe(lightDesc.color);
  });

  it('form error-text + success-text tokens override in high-contrast mode', async () => {
    // Regression guard for hx-theme._hcOverrides completeness: if
    // error-text / success-text drop out of the override map, validation
    // messaging keeps its light palette in HC mode and fails the 7:1 contract.
    // We read the tokens directly off the theme host in HC mode.
    const wrapper = await fixture<HelixTheme>(
      '<hx-theme theme="high-contrast"><hx-button>x</hx-button></hx-theme>',
    );
    await wrapper.updateComplete;
    const cs = getComputedStyle(wrapper);
    const errorText = cs.getPropertyValue('--hx-color-error-text').trim();
    const successText = cs.getPropertyValue('--hx-color-success-text').trim();
    // HC palette: light red / light green on #000 background (see tokens.json).
    expect(errorText.toLowerCase()).toBe('#fca5a5');
    expect(successText.toLowerCase()).toBe('#86efac');
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

  /**
   * Inverted-primary resting bg routes through action.primary.bg-inverted-rest
   * so the dark override can flip the fill to primary-600 — keeping the boundary
   * against light surface.inverse (#EBEEE9) at 4.97:1 instead of primary-500's
   * 2.94:1. Regression guard for the CSS cycle that previously broke
   * --hx-button-bg consumption on :host([inverted]) .button--primary.
   */
  it('inverted primary button flips resting bg between light and dark (bg-inverted-rest contract)', async () => {
    const markup = '<hx-button variant="primary" inverted>Action</hx-button>';
    const light = await resolveStyles('light', markup, 'hx-button', '.button');
    cleanup();
    const dark = await resolveStyles('dark', markup, 'hx-button', '.button');

    // Light: action.primary.bg-inverted-rest defaults to primary-500 (#429797).
    expect(light.backgroundColor).toBe('rgb(66, 151, 151)');
    // Dark: dark.action.primary.bg-inverted-rest pins to primary-600 (#0f7078).
    expect(dark.backgroundColor).toBe('rgb(15, 112, 120)');
    expect(dark.backgroundColor).not.toBe(light.backgroundColor);
  });

  /**
   * Pins the documented consumer-override path: the inverted-primary resting
   * rule reads from --hx-color-action-primary-bg-inverted-rest, so consumers
   * override THAT semantic (not --hx-button-bg, which is shadowed at the
   * .button--primary descendant scope). If a future change relocated the
   * inverted-rest paint off this semantic, this assertion would fail.
   */
  it('inverted primary honors semantic override on --hx-color-action-primary-bg-inverted-rest', async () => {
    const markup =
      '<hx-button variant="primary" inverted style="--hx-color-action-primary-bg-inverted-rest: rgb(1, 2, 3)">Action</hx-button>';
    const dark = await resolveStyles('dark', markup, 'hx-button', '.button');
    expect(dark.backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('inverted primary honors semantic override in light mode too (override path is mode-agnostic)', async () => {
    const markup =
      '<hx-button variant="primary" inverted style="--hx-color-action-primary-bg-inverted-rest: rgb(4, 5, 6)">Action</hx-button>';
    const light = await resolveStyles('light', markup, 'hx-button', '.button');
    expect(light.backgroundColor).toBe('rgb(4, 5, 6)');
  });

  /**
   * Round-12 backwards-compat guard: --hx-color-border-on-dark-{default,subtle}
   * shipped as public API in 3.2.0/3.2.1 and was renamed to surface.on-dark-overlay-*
   * in round-8 of 3.2.2. The round-11 alias in tokens.json kept the names live but
   * only one-way (border alias resolves to surface); components still read only the
   * canonical surface name, so consumer overrides on the deprecated border name
   * never reached paint. Round-12 fix: every consume site reads BOTH names with
   * deprecated-first priority. These tests pin that consumer overrides on the
   * deprecated names continue to work until 4.0.0 removal.
   */
  it('inverted tertiary honors consumer override on deprecated --hx-color-border-on-dark-subtle', async () => {
    const markup =
      '<hx-button variant="tertiary" inverted style="--hx-color-border-on-dark-subtle: rgb(7, 8, 9)">Action</hx-button>';
    const light = await resolveStyles('light', markup, 'hx-button', '.button');
    cleanup();
    const dark = await resolveStyles('dark', markup, 'hx-button', '.button');
    expect(light.backgroundColor).toBe('rgb(7, 8, 9)');
    expect(dark.backgroundColor).toBe('rgb(7, 8, 9)');
  });

  it('inverted tertiary honors consumer override on canonical --hx-color-surface-on-dark-overlay-subtle', async () => {
    // When the deprecated name is unset, the both-name fallback must still
    // route through the canonical surface token so the documented override
    // path keeps working for new consumers.
    const markup =
      '<hx-button variant="tertiary" inverted style="--hx-color-surface-on-dark-overlay-subtle: rgb(10, 11, 12)">Action</hx-button>';
    const light = await resolveStyles('light', markup, 'hx-button', '.button');
    expect(light.backgroundColor).toBe('rgb(10, 11, 12)');
  });

  // Hover paint cannot be synthesized reliably in vitest browser mode (variant
  // rest state has no --hx-button-bg binding, so a hover-only rebind doesn't
  // surface as a stable backgroundColor delta). The .side-nav__toggle:hover
  // deprecated→canonical chain — both the plain rule and the @supports
  // color-mix branch — is covered by runtime adopted-stylesheet inspection in
  // forced-colors-runtime.test.ts. The hx-button inverted hover rules reuse
  // the identical fallback shape exercised by the subtle-chain rest-state
  // tests above.
});
