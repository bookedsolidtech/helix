import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { WcHelpText } from './hx-help-text.js';
import './index.js';

afterEach(cleanup);

describe('hx-help-text', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Enter your name</hx-help-text>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('renders a <span> as root element', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeInstanceOf(HTMLSpanElement);
    });

    it('renders slotted content', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Enter your email</hx-help-text>');
      expect(el.textContent?.trim()).toBe('Enter your email');
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('defaults to variant="default"', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      expect(el.variant).toBe('default');
    });

    it('reflects variant attr to host', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text variant="error">Error</hx-help-text>');
      expect(el.getAttribute('variant')).toBe('error');
    });

    it('applies default variant class', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('help-text--default')).toBe(true);
    });

    it('applies error variant class', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text variant="error">Error</hx-help-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('help-text--error')).toBe(true);
    });

    it('applies warning variant class', async () => {
      const el = await fixture<WcHelpText>(
        '<hx-help-text variant="warning">Warning</hx-help-text>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('help-text--warning')).toBe(true);
    });

    it('applies success variant class', async () => {
      const el = await fixture<WcHelpText>(
        '<hx-help-text variant="success">Success</hx-help-text>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('help-text--success')).toBe(true);
    });

    it('updates variant class when property changes', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      el.variant = 'error';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.classList.contains('help-text--error')).toBe(true);
      expect(base.classList.contains('help-text--default')).toBe(false);
    });
  });

  // ─── ID association ───

  describe('ID association', () => {
    it('accepts an id attribute for aria-describedby linking', async () => {
      const el = await fixture<WcHelpText>(
        '<hx-help-text id="email-help">Enter a valid email</hx-help-text>',
      );
      expect(el.id).toBe('email-help');
    });

    it('can be referenced by aria-describedby on a form control', async () => {
      const container = await fixture<HTMLElement>(
        '<div><input aria-describedby="field-help" /><hx-help-text id="field-help">Hint</hx-help-text></div>',
      );
      const input = container.querySelector('input')!;
      const helpText = container.querySelector('hx-help-text')!;
      expect(input.getAttribute('aria-describedby')).toBe('field-help');
      expect(helpText.id).toBe('field-help');
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('base part is accessible for external styling', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('part')).toBe('base');
    });
  });

  // ─── Icons ───

  describe('Icons', () => {
    it('default variant does NOT render an icon', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeNull();
    });

    it('error variant renders an icon with SVG inside [part="icon"]', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text variant="error">Error</hx-help-text>');
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeTruthy();
      const svg = icon?.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('warning variant renders an icon with SVG inside [part="icon"]', async () => {
      const el = await fixture<WcHelpText>(
        '<hx-help-text variant="warning">Warning</hx-help-text>',
      );
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeTruthy();
      const svg = icon?.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('success variant renders an icon with SVG inside [part="icon"]', async () => {
      const el = await fixture<WcHelpText>(
        '<hx-help-text variant="success">Success</hx-help-text>',
      );
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeTruthy();
      const svg = icon?.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('icon SVGs have aria-hidden="true"', async () => {
      for (const variant of ['error', 'warning', 'success']) {
        const el = await fixture<WcHelpText>(
          `<hx-help-text variant="${variant}">Text</hx-help-text>`,
        );
        const icon = shadowQuery(el, '[part="icon"]');
        const svg = icon?.querySelector('svg');
        expect(
          svg?.getAttribute('aria-hidden'),
          `${variant} icon SVG should have aria-hidden="true"`,
        ).toBe('true');
        el.remove();
      }
    });
  });

  // ─── CSS Parts (extended) ───

  describe('CSS Parts (extended)', () => {
    it('text part exists on default variant', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const text = shadowQuery(el, '[part="text"]');
      expect(text).toBeTruthy();
    });

    it('icon part exists on error variant', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text variant="error">Error</hx-help-text>');
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeTruthy();
    });

    it('icon part does NOT exist on default variant', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeNull();
    });
  });

  // ─── Accessibility (ARIA) ───

  describe('Accessibility (ARIA)', () => {
    it('error variant base element has role="alert"', async () => {
      const el = await fixture<WcHelpText>(
        '<hx-help-text variant="error">Error message</hx-help-text>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('role')).toBe('alert');
    });

    it('warning variant base element has aria-live="polite"', async () => {
      const el = await fixture<WcHelpText>(
        '<hx-help-text variant="warning">Warning message</hx-help-text>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-live')).toBe('polite');
    });

    it('success variant base element has aria-live="polite"', async () => {
      const el = await fixture<WcHelpText>(
        '<hx-help-text variant="success">Success message</hx-help-text>',
      );
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.getAttribute('aria-live')).toBe('polite');
    });

    it('default variant base element has NO role attribute', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.hasAttribute('role')).toBe(false);
    });

    it('default variant base element has NO aria-live attribute', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');
      const base = shadowQuery(el, '[part="base"]')!;
      expect(base.hasAttribute('aria-live')).toBe(false);
    });
  });

  // ─── Dynamic variant change ───

  describe('Dynamic variant change', () => {
    it('changing from default to error adds icon and role="alert"', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Help</hx-help-text>');

      // Verify default state: no icon, no role
      expect(shadowQuery(el, '[part="icon"]')).toBeNull();
      expect(shadowQuery(el, '[part="base"]')!.hasAttribute('role')).toBe(false);

      // Change to error
      el.variant = 'error';
      await el.updateComplete;

      // Verify error state: icon present, role="alert"
      const icon = shadowQuery(el, '[part="icon"]');
      expect(icon).toBeTruthy();
      expect(icon?.querySelector('svg')).toBeTruthy();
      expect(shadowQuery(el, '[part="base"]')!.getAttribute('role')).toBe('alert');
    });

    it('changing from error back to default removes icon and role', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text variant="error">Error</hx-help-text>');

      // Verify error state
      expect(shadowQuery(el, '[part="icon"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="base"]')!.getAttribute('role')).toBe('alert');

      // Change back to default
      el.variant = 'default';
      await el.updateComplete;

      // Verify default state: no icon, no role
      expect(shadowQuery(el, '[part="icon"]')).toBeNull();
      expect(shadowQuery(el, '[part="base"]')!.hasAttribute('role')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcHelpText>('<hx-help-text>Enter your full name</hx-help-text>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'error', 'warning', 'success']) {
        const el = await fixture<WcHelpText>(
          `<hx-help-text variant="${variant}">Help text</hx-help-text>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
