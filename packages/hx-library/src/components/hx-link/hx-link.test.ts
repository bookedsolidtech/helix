import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixLink } from './hx-link.js';
import './index.js';

afterEach(cleanup);

describe('hx-link', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <a> element by default', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery(el, 'a');
      expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    });

    it('exposes "base" CSS part on anchor', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('applies default variant=default class', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery(el, 'a')!;
      expect(anchor.classList.contains('link--default')).toBe(true);
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link variant="subtle" href="https://example.com">Link</hx-link>',
      );
      expect(el.getAttribute('variant')).toBe('subtle');
    });

    it('applies subtle class', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link variant="subtle" href="https://example.com">Link</hx-link>',
      );
      const anchor = shadowQuery(el, 'a')!;
      expect(anchor.classList.contains('link--subtle')).toBe(true);
    });

    it('applies danger class', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link variant="danger" href="https://example.com">Link</hx-link>',
      );
      const anchor = shadowQuery(el, 'a')!;
      expect(anchor.classList.contains('link--danger')).toBe(true);
    });
  });

  // ─── Property: href ───

  describe('Property: href', () => {
    it('sets href on the anchor element', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('href')).toBe('https://example.com');
    });
  });

  // ─── Property: target ───

  describe('Property: target', () => {
    it('sets target attribute on anchor', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">Link</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('target')).toBe('_blank');
    });

    it('adds rel="noopener noreferrer" when target="_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">Link</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('does not set rel when target is not "_blank"', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.hasAttribute('rel')).toBe(false);
    });

    it('uses custom rel when provided even with target="_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank" rel="noopener">Link</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('rel')).toBe('noopener');
    });

    it('renders visually-hidden new-tab text when target="_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">Link</hx-link>',
      );
      const hiddenText = shadowQuery(el, '.link__visually-hidden');
      expect(hiddenText).toBeTruthy();
      expect(hiddenText?.textContent?.trim()).toBe('(opens in new tab)');
    });

    it('does not render visually-hidden text when not target="_blank"', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const hiddenText = shadowQuery(el, '.link__visually-hidden');
      expect(hiddenText).toBeNull();
    });
  });

  // ─── Property: download ───

  describe('Property: download', () => {
    it('sets download attribute when download is a string', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="/file.pdf" download="file.pdf">Link</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('download')).toBe('file.pdf');
    });

    it('does not set download attribute when not provided', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.hasAttribute('download')).toBe(false);
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('renders as span when disabled', async () => {
      const el = await fixture<HelixLink>('<hx-link disabled>Link</hx-link>');
      const span = shadowQuery(el, 'span[role="link"]');
      expect(span).toBeTruthy();
    });

    it('does not render anchor when disabled', async () => {
      const el = await fixture<HelixLink>('<hx-link disabled>Link</hx-link>');
      const anchor = shadowQuery(el, 'a');
      expect(anchor).toBeNull();
    });

    it('sets aria-disabled="true" on span when disabled', async () => {
      const el = await fixture<HelixLink>('<hx-link disabled>Link</hx-link>');
      const span = shadowQuery(el, 'span[role="link"]');
      expect(span?.getAttribute('aria-disabled')).toBe('true');
    });

    it('exposes "base" CSS part on disabled span', async () => {
      const el = await fixture<HelixLink>('<hx-link disabled>Link</hx-link>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixLink>('<hx-link disabled>Link</hx-link>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-click on click', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      const eventPromise = oneEvent(el, 'hx-click');
      anchor.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-click bubbles and is composed', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      anchor.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-click detail contains originalEvent', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      anchor.click();
      const event = await eventPromise;
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('does NOT dispatch hx-click when disabled', async () => {
      const el = await fixture<HelixLink>('<hx-link disabled>Link</hx-link>');
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com">Hello World</hx-link>',
      );
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('prefix slot renders content', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com"><svg slot="prefix" aria-hidden="true"></svg>Label</hx-link>',
      );
      const slottedPrefix = el.querySelector('[slot="prefix"]');
      expect(slottedPrefix).toBeTruthy();
      expect(slottedPrefix?.tagName.toLowerCase()).toBe('svg');
    });

    it('suffix slot renders content', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com">Label<svg slot="suffix" aria-hidden="true"></svg></hx-link>',
      );
      const slottedSuffix = el.querySelector('[slot="suffix"]');
      expect(slottedSuffix).toBeTruthy();
      expect(slottedSuffix?.tagName.toLowerCase()).toBe('svg');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('exposes "label" part', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const labelPart = shadowQuery(el, '[part~="label"]');
      expect(labelPart).toBeTruthy();
    });

    it('exposes "prefix" part', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com"><span slot="prefix">*</span>Link</hx-link>',
      );
      const prefixPart = shadowQuery(el, '[part~="prefix"]');
      expect(prefixPart).toBeTruthy();
    });

    it('exposes "suffix" part', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com">Link<span slot="suffix">*</span></hx-link>',
      );
      const suffixPart = shadowQuery(el, '[part~="suffix"]');
      expect(suffixPart).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com">Visit site</hx-link>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixLink>('<hx-link disabled>Unavailable</hx-link>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for subtle variant', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" variant="subtle">Subtle Link</hx-link>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for danger variant', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" variant="danger">Danger Link</hx-link>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when target="_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">Open in new tab</hx-link>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
