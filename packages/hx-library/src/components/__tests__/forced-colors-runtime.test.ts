/**
 * Forced-colors runtime adoption + hx-side-nav toggle:hover branch coverage.
 *
 * Two regression nets that codex r1 of staging→main flagged as missing:
 *
 * 1. Representative components from each `forced-colors-*` mixin family
 *    actually carry the `@media (forced-colors: active)` block in their
 *    adopted stylesheets at runtime, with the right system-color keywords
 *    (ButtonFace/Canvas/Field/LinkText). Vitest browser mode does not
 *    expose `page.emulateMedia({ forcedColors: 'active' })`, so the
 *    adopted-stylesheet inspection pattern (already used by hx-stat,
 *    hx-spinner) is the supported approach.
 *
 * 2. `.side-nav__toggle:hover` carries the deprecated→canonical token
 *    fallback chain in BOTH the plain rule and the `@supports (color:
 *    color-mix(...))` branch, asserted via runtime adopted-stylesheet
 *    inspection rather than the previous file-level grep coverage note.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { fixture, cleanup } from '../../test-utils.js';
import '../hx-button/index.js';
import '../hx-checkbox/index.js';
import '../hx-card/index.js';
import '../hx-link/index.js';
import '../hx-side-nav/index.js';

afterEach(cleanup);

function collectCss(el: Element): string {
  const sheets = (el.shadowRoot?.adoptedStyleSheets ?? []) as CSSStyleSheet[];
  return sheets
    .map((s) => Array.from(s.cssRules, (r) => r.cssText).join('\n'))
    .join('\n');
}

function collectMediaRuleCss(el: Element, query: string): string {
  const sheets = (el.shadowRoot?.adoptedStyleSheets ?? []) as CSSStyleSheet[];
  const matches: string[] = [];
  for (const sheet of sheets) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule instanceof CSSMediaRule && rule.conditionText.includes(query)) {
        matches.push(rule.cssText);
      }
    }
  }
  return matches.join('\n').toLowerCase();
}

function findSupportsRule(el: Element, condition: string): CSSSupportsRule | null {
  const sheets = (el.shadowRoot?.adoptedStyleSheets ?? []) as CSSStyleSheet[];
  for (const sheet of sheets) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule instanceof CSSSupportsRule && rule.conditionText.includes(condition)) {
        return rule;
      }
    }
  }
  return null;
}

describe('forced-colors mixin adoption (runtime)', () => {
  it('hx-button (interactive) — emits forced-colors block with ButtonFace/ButtonText/Highlight', async () => {
    const el = await fixture<HTMLElement>('<hx-button>Action</hx-button>');
    const css = collectMediaRuleCss(el, 'forced-colors: active');
    expect(css, 'hx-button must adopt forcedColorsInteractive mixin').not.toBe('');
    expect(css).toContain('buttonface');
    expect(css).toContain('buttontext');
    expect(css).toContain('highlight');
    expect(css).toContain('graytext');
  });

  it('hx-checkbox (field) — emits forced-colors block with Field/FieldText/Highlight', async () => {
    const el = await fixture<HTMLElement>('<hx-checkbox></hx-checkbox>');
    const css = collectMediaRuleCss(el, 'forced-colors: active');
    expect(css, 'hx-checkbox must adopt forcedColorsField mixin').not.toBe('');
    expect(css).toContain('field');
    expect(css).toContain('fieldtext');
    expect(css).toContain('highlight');
  });

  it('hx-card (surface) — emits forced-colors block with Canvas/CanvasText', async () => {
    const el = await fixture<HTMLElement>('<hx-card>Body</hx-card>');
    const css = collectMediaRuleCss(el, 'forced-colors: active');
    expect(css, 'hx-card must adopt forcedColorsSurface mixin').not.toBe('');
    expect(css).toContain('canvas');
    expect(css).toContain('canvastext');
  });

  it('hx-link (link) — emits forced-colors block with LinkText/VisitedText', async () => {
    const el = await fixture<HTMLElement>('<hx-link href="https://example.com">Link</hx-link>');
    const css = collectMediaRuleCss(el, 'forced-colors: active');
    expect(css, 'hx-link must adopt forcedColorsLink mixin').not.toBe('');
    expect(css).toContain('linktext');
    expect(css).toContain('visitedtext');
  });
});

describe('hx-nav-item forced-colors disabled opacity scoping (runtime)', () => {
  /*
   * Regression for #46: the forced-colors `opacity: 1` reset previously
   * targeted `:host([disabled])`, but the source declaration at line 109
   * applies opacity to `.nav-item__link`. The mis-scoped reset had no
   * effect — disabled links rendered at 0.5 opacity in Windows High
   * Contrast mode, dimming GrayText below the WCAG 2.1 AA non-text
   * contrast minimum. The reset must live on the same selector that sets
   * the opacity in the first place.
   */
  it('disabled .nav-item__link receives opacity:1 inside @media (forced-colors: active)', async () => {
    await fixture<HTMLElement>(
      '<hx-side-nav><hx-nav-item href="/a" disabled>Disabled</hx-nav-item></hx-side-nav>',
    );
    const navItem = document.querySelector('hx-nav-item') as HTMLElement;
    expect(navItem, 'fixture must render hx-nav-item').toBeTruthy();

    const forcedColorsCss = collectMediaRuleCss(navItem, 'forced-colors: active');
    expect(forcedColorsCss, 'hx-nav-item must emit a forced-colors media block').not.toBe('');

    // The reset MUST be scoped to .nav-item__link (matching the source
    // declaration at line 109). A reset on bare :host([disabled]) does
    // not override .nav-item__link's opacity and is the bug we are
    // fixing.
    const disabledLinkRule = forcedColorsCss.match(
      /:host\(\[disabled\]\)\s+\.nav-item__link\s*\{[^}]*\}/,
    );
    expect(
      disabledLinkRule,
      'expected `:host([disabled]) .nav-item__link { ... }` rule inside forced-colors block',
    ).not.toBeNull();
    expect(disabledLinkRule![0]).toMatch(/opacity:\s*1\b/);
    expect(disabledLinkRule![0]).toContain('graytext');
  });

  it('forced-colors block does NOT reset opacity on bare :host([disabled]) (wrong selector)', async () => {
    await fixture<HTMLElement>(
      '<hx-side-nav><hx-nav-item href="/a" disabled>Disabled</hx-nav-item></hx-side-nav>',
    );
    const navItem = document.querySelector('hx-nav-item') as HTMLElement;
    const forcedColorsCss = collectMediaRuleCss(navItem, 'forced-colors: active');

    // Match :host([disabled]) NOT followed by a descendant selector.
    // If a bare host-only opacity reset exists, the bug has regressed.
    const bareHostDisabled = forcedColorsCss.match(
      /:host\(\[disabled\]\)\s*\{([^}]*)\}/,
    );
    if (bareHostDisabled) {
      expect(
        bareHostDisabled[1],
        'bare :host([disabled]) inside forced-colors must not carry opacity (it cannot reach .nav-item__link)',
      ).not.toMatch(/opacity:/);
    }
  });

  /*
   * Cascade-order regression net: both rules use selector
   * `:host([disabled]) .nav-item__link` with identical specificity, so the
   * forced-colors override only wins because it appears later in source
   * order. If a future refactor moves the @media block above line 109 of
   * hx-nav-item.styles.ts, the override silently loses and disabled links
   * regress to 0.5 opacity in Windows High Contrast mode — while the rule-
   * shape assertions above still pass green. Pin the source-order invariant
   * directly by walking the adopted stylesheets in order.
   */
  it('forced-colors disabled override appears AFTER the regular-mode opacity rule', async () => {
    await fixture<HTMLElement>(
      '<hx-side-nav><hx-nav-item href="/a" disabled>Disabled</hx-nav-item></hx-side-nav>',
    );
    const navItem = document.querySelector('hx-nav-item') as HTMLElement;
    const sheets = (navItem.shadowRoot?.adoptedStyleSheets ?? []) as CSSStyleSheet[];

    let regularIndex = -1;
    let forcedColorsIndex = -1;
    let cursor = 0;

    for (const sheet of sheets) {
      for (const rule of Array.from(sheet.cssRules)) {
        if (
          rule instanceof CSSStyleRule &&
          rule.selectorText === ':host([disabled]) .nav-item__link' &&
          /opacity:\s*var\(--hx-opacity-disabled/.test(rule.cssText) &&
          regularIndex === -1
        ) {
          regularIndex = cursor;
        }
        if (
          rule instanceof CSSMediaRule &&
          rule.conditionText.includes('forced-colors: active')
        ) {
          for (const inner of Array.from(rule.cssRules)) {
            if (
              inner instanceof CSSStyleRule &&
              inner.selectorText === ':host([disabled]) .nav-item__link' &&
              /opacity:\s*1\b/.test(inner.cssText)
            ) {
              forcedColorsIndex = cursor;
              break;
            }
          }
        }
        cursor += 1;
      }
    }

    expect(regularIndex, 'regular-mode :host([disabled]) .nav-item__link opacity rule must exist').toBeGreaterThan(-1);
    expect(forcedColorsIndex, 'forced-colors override on :host([disabled]) .nav-item__link must exist').toBeGreaterThan(-1);
    expect(
      forcedColorsIndex,
      'forced-colors override must appear after the regular-mode rule (equal-specificity cascade depends on source order)',
    ).toBeGreaterThan(regularIndex);
  });
});

describe('hx-side-nav toggle:hover token chain (runtime)', () => {
  it('plain .side-nav__toggle:hover reads deprecated→canonical→hex fallback', async () => {
    const el = await fixture<HTMLElement>('<hx-side-nav></hx-side-nav>');
    const css = collectCss(el);
    const hoverMatches = css.match(/\.side-nav__toggle:hover\s*\{[^}]*\}/g) ?? [];
    expect(hoverMatches.length, 'expected at least one .side-nav__toggle:hover rule').toBeGreaterThan(0);
    const plainHover = hoverMatches[0];
    expect(plainHover).toContain('--hx-color-border-on-dark-subtle');
    expect(plainHover).toContain('--hx-color-surface-on-dark-overlay-subtle');
    expect(plainHover).toMatch(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1\s*\)/);
  });

  it('@supports color-mix branch overrides hover with same deprecated→canonical chain', async () => {
    const el = await fixture<HTMLElement>('<hx-side-nav></hx-side-nav>');
    const supportsRule = findSupportsRule(el, 'color-mix');
    expect(supportsRule, 'expected @supports (color: color-mix(...)) branch').not.toBeNull();
    const inner = supportsRule!.cssText;
    expect(inner).toContain('.side-nav__toggle:hover');
    expect(inner).toContain('--hx-color-border-on-dark-subtle');
    expect(inner).toContain('--hx-color-surface-on-dark-overlay-subtle');
    expect(inner).toContain('color-mix');
  });
});
