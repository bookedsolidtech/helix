import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixFieldLabel } from './hx-field-label.js';
import './index.js';

afterEach(cleanup);

describe('hx-field-label', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a span when for attribute is not set', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.tagName.toLowerCase()).toBe('span');
    });

    it('renders a label element when for attribute is set', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label for="my-input">Label</hx-field-label>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.tagName.toLowerCase()).toBe('label');
    });

    it('sets for attribute on the label element', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label for="patient-name">Label</hx-field-label>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('for')).toBe('patient-name');
    });
  });

  // ─── Property: for (3) ───

  describe('Property: for', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      expect(el.for).toBe('');
    });

    it('switching from empty to a value re-renders as label', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      el.for = 'some-id';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.tagName.toLowerCase()).toBe('label');
      expect(base?.getAttribute('for')).toBe('some-id');
    });

    it('clearing for re-renders as span', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label for="some-id">Label</hx-field-label>',
      );
      el.for = '';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.tagName.toLowerCase()).toBe('span');
    });
  });

  // ─── Property: required (5) ───

  describe('Property: required', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      expect(el.required).toBe(false);
    });

    it('reflects required attribute to host', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');
      expect(el.hasAttribute('required')).toBe(true);
    });

    it('shows required indicator when required is true', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      expect(indicator).toBeTruthy();
    });

    it('required indicator has aria-hidden="true"', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      expect(indicator?.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not show required indicator when required is false', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      expect(indicator).toBeNull();
    });
  });

  // ─── Property: optional (4) ───

  describe('Property: optional', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      expect(el.optional).toBe(false);
    });

    it('reflects optional attribute to host', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label optional>Label</hx-field-label>');
      expect(el.hasAttribute('optional')).toBe(true);
    });

    it('shows optional indicator when optional is true', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label optional>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="optional-indicator"]');
      expect(indicator).toBeTruthy();
      expect(indicator?.textContent?.trim()).toBe('(optional)');
    });

    it('does not show optional indicator when optional is false', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="optional-indicator"]');
      expect(indicator).toBeNull();
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders label text content', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label>Patient Name</hx-field-label>',
      );
      expect(el.textContent?.trim()).toBe('Patient Name');
    });

    it('required-indicator slot overrides default asterisk', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label required><span slot="required-indicator">(req)</span></hx-field-label>',
      );
      const slotted = el.querySelector('[slot="required-indicator"]');
      expect(slotted?.textContent).toBe('(req)');
    });

    it('required-indicator slot is not rendered when required is false', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label><span slot="required-indicator">(req)</span></hx-field-label>',
      );
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      expect(indicator).toBeNull();
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('base part is present on the root element', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('required-indicator part is present when required is true', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      expect(indicator).toBeTruthy();
    });

    it('optional-indicator part is present when optional is true', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label optional>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="optional-indicator"]');
      expect(indicator).toBeTruthy();
    });

    it('required-indicator part is absent when required is false', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      expect(indicator).toBeNull();
    });
  });

  // ─── Property reactivity (3) ───

  describe('Property reactivity', () => {
    it('toggles required indicator when required changes programmatically', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      expect(shadowQuery(el, '[part="required-indicator"]')).toBeNull();
      el.required = true;
      await el.updateComplete;
      expect(shadowQuery(el, '[part="required-indicator"]')).toBeTruthy();
    });

    it('toggles optional indicator when optional changes programmatically', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      expect(shadowQuery(el, '[part="optional-indicator"]')).toBeNull();
      el.optional = true;
      await el.updateComplete;
      expect(shadowQuery(el, '[part="optional-indicator"]')).toBeTruthy();
    });

    it('updates label for attribute when for property changes', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label for="old-id">Label</hx-field-label>',
      );
      el.for = 'new-id';
      await el.updateComplete;
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('for')).toBe('new-id');
    });
  });

  // ─── Accessibility (axe-core) (4) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when required', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label required>Patient Name</hx-field-label>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when optional', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label optional>Notes</hx-field-label>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when rendered with for attribute', async () => {
      // Note: the for attribute creates a native <label for="..."> in shadow DOM.
      // Shadow DOM ID scope prevents cross-boundary label association; this test
      // verifies the component's own shadow tree is axe-clean.
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label for="some-input">Patient Email</hx-field-label>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
