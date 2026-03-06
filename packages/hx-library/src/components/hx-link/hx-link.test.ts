import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixLink } from './hx-link.js';
import './index.js';

afterEach(cleanup);

describe('hx-link', () => {
  // --- Rendering ---

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a native <a> element', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      const anchor = shadowQuery(el, 'a');
      expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    });

    it('exposes "link" CSS part', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      const part = shadowQuery(el, '[part~="link"]');
      expect(part).toBeTruthy();
    });

    it('sets href attribute on anchor', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('href')).toBe('https://example.com');
    });

    it('renders slot content', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Visit Page</hx-link>');
      expect(el.textContent?.trim()).toBe('Visit Page');
    });
  });

  // --- Property: variant ---

  describe('Property: variant', () => {
    it('defaults to "default" variant', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      expect(el.variant).toBe('default');
    });

    it('applies subtle variant class', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" variant="subtle">Link</hx-link>');
      const anchor = shadowQuery(el, 'a')!;
      expect(anchor.classList.contains('link--subtle')).toBe(true);
    });

    it('applies danger variant class', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" variant="danger">Link</hx-link>');
      const anchor = shadowQuery(el, 'a')!;
      expect(anchor.classList.contains('link--danger')).toBe(true);
    });

    it('reflects variant attribute to host', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" variant="subtle">Link</hx-link>');
      expect(el.getAttribute('variant')).toBe('subtle');
    });
  });

  // --- Property: target ---

  describe('Property: target', () => {
    it('sets target attribute on anchor', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">Link</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('target')).toBe('_blank');
    });

    it('sets rel="noopener noreferrer" when target="_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">Link</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('does not set rel when target is not "_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_self">Link</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.hasAttribute('rel')).toBe(false);
    });

    it('renders external link icon when target="_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">Link</hx-link>',
      );
      const icon = shadowQuery(el, '[part~="external-icon"]');
      expect(icon).toBeTruthy();
    });

    it('renders sr-only text when target="_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">Link</hx-link>',
      );
      const srOnly = shadowQuery(el, '.sr-only');
      expect(srOnly).toBeTruthy();
      expect(srOnly?.textContent).toBe('(opens in new tab)');
    });

    it('does NOT render external icon when target is not "_blank"', async () => {
      const el = await fixture<HelixLink>('<hx-link href="https://example.com">Link</hx-link>');
      const icon = shadowQuery(el, '[part~="external-icon"]');
      expect(icon).toBeFalsy();
    });
  });

  // --- Property: disabled (P0-1 fix: tabindex="0") ---

  describe('Property: disabled', () => {
    it('renders a <span> instead of <a> when disabled', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" disabled>Link</hx-link>');
      const anchor = shadowQuery(el, 'a');
      const span = shadowQuery(el, 'span[role="link"]');
      expect(anchor).toBeFalsy();
      expect(span).toBeTruthy();
    });

    it('sets role="link" and aria-disabled on disabled span', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" disabled>Link</hx-link>');
      const span = shadowQuery(el, 'span')!;
      expect(span.getAttribute('role')).toBe('link');
      expect(span.getAttribute('aria-disabled')).toBe('true');
    });

    it('disabled span is keyboard focusable (tabindex="0") — P0-1 fix', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" disabled>Link</hx-link>');
      const span = shadowQuery(el, 'span')!;
      expect(span.getAttribute('tabindex')).toBe('0');
    });

    it('applies link--disabled class', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" disabled>Link</hx-link>');
      const span = shadowQuery(el, 'span')!;
      expect(span.classList.contains('link--disabled')).toBe(true);
    });

    it('does NOT dispatch hx-click when disabled — P0-2 fix (actually clicks)', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" disabled>Link</hx-link>');
      const span = shadowQuery<HTMLElement>(el, 'span')!;
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      span.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });

    it('reflects disabled attribute on host', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" disabled>Link</hx-link>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // --- Property: download ---

  describe('Property: download', () => {
    it('sets download attribute with filename', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="/file.pdf" download="report.pdf">Download</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('download')).toBe('report.pdf');
    });

    it('sets empty download attribute when attribute is present without value', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="/file.pdf" download="">Download</hx-link>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.hasAttribute('download')).toBe(true);
    });
  });

  // --- Events ---

  describe('Events', () => {
    it('dispatches hx-click on click', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      const eventPromise = oneEvent(el, 'hx-click');
      anchor.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-click bubbles and is composed', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      anchor.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-click detail contains originalEvent', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      anchor.click();
      const event = await eventPromise;
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });
  });

  // --- Keyboard (P2-2 fix) ---

  describe('Keyboard', () => {
    it('anchor is focusable via Tab', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      anchor.focus();
      expect(el.shadowRoot?.activeElement).toBe(anchor);
    });

    it('Enter activates link click', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Link</hx-link>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      anchor.focus();
      await userEvent.keyboard('{Enter}');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('disabled span is focusable via Tab', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" disabled>Link</hx-link>');
      const span = shadowQuery<HTMLElement>(el, 'span')!;
      span.focus();
      expect(el.shadowRoot?.activeElement).toBe(span);
    });
  });

  // --- Accessibility (axe-core) ---

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page">Visit page</hx-link>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixLink>('<hx-link href="/page" disabled>Visit page</hx-link>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with target="_blank"', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="https://example.com" target="_blank">External</hx-link>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for subtle variant', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="/page" variant="subtle">Subtle link</hx-link>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for danger variant', async () => {
      const el = await fixture<HelixLink>(
        '<hx-link href="/page" variant="danger">Danger link</hx-link>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
