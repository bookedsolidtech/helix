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
