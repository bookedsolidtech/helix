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

    it('required indicator visual asterisk is aria-hidden', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      expect(indicator).toBeTruthy();
      // The visual asterisk wrapper is aria-hidden; a visually-hidden "required" text is available to AT
      const visualAsterisk = indicator?.querySelector('[aria-hidden="true"]');
      expect(visualAsterisk).toBeTruthy();
    });

    it('required indicator includes visually-hidden text for AT', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      const visuallyHidden = indicator?.querySelector('.visually-hidden');
      expect(visuallyHidden).toBeTruthy();
      expect(visuallyHidden?.textContent?.trim()).toBe('required');
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
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Patient Name</hx-field-label>');
      expect(el.textContent?.trim()).toBe('Patient Name');
    });

    it('required-indicator slot overrides default asterisk', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label required><span slot="required-indicator">(req)</span></hx-field-label>',
      );
      // verify shadow DOM slot exists and has assigned nodes
      const slot = el.shadowRoot!.querySelector(
        'slot[name="required-indicator"]',
      ) as HTMLSlotElement;
      expect(slot).toBeTruthy();
      const assignedNodes = slot.assignedNodes();
      expect(assignedNodes.length).toBeGreaterThan(0);
      // verify the assigned content matches the slotted element
      const slottedElement = assignedNodes[0] as HTMLElement;
      expect(slottedElement.textContent).toBe('(req)');
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

  // ─── Combined required + optional (edge case) ───

  describe('Combined required + optional (edge case)', () => {
    it('renders both required and optional indicators when both are true', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label required optional>Label</hx-field-label>',
      );
      await el.updateComplete;
      const required = shadowQuery(el, '[part="required-indicator"]');
      const optional = shadowQuery(el, '[part="optional-indicator"]');
      expect(required).toBeTruthy();
      expect(optional).toBeTruthy();
    });

    it('both indicators are absent when both properties are false', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      expect(shadowQuery(el, '[part="required-indicator"]')).toBeNull();
      expect(shadowQuery(el, '[part="optional-indicator"]')).toBeNull();
    });
  });

  // ─── Slot: default slot content ───

  describe('Slot: default slot rich content', () => {
    it('renders HTML content in the default slot', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label><strong>Patient</strong> Name</hx-field-label>',
      );
      const strong = el.querySelector('strong');
      expect(strong).toBeTruthy();
      expect(strong?.textContent).toBe('Patient');
    });
  });

  // ─── for attribute: label element ───

  describe('for attribute: label element helpers', () => {
    it('label element has class "label"', async () => {
      const el = await fixture<HelixFieldLabel>(
        '<hx-field-label for="some-input">Label</hx-field-label>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.classList.contains('label')).toBe(true);
    });

    it('span base has class "label" when for is not set', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label>Label</hx-field-label>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.classList.contains('label')).toBe(true);
    });
  });

  // ─── required-indicator default slot fallback ───

  describe('required-indicator default slot fallback', () => {
    it('shows * as default fallback when no required-indicator slot content is given', async () => {
      const el = await fixture<HelixFieldLabel>('<hx-field-label required>Label</hx-field-label>');
      const indicator = shadowQuery(el, '[part="required-indicator"]');
      const ariaHiddenSpan = indicator?.querySelector('[aria-hidden="true"]');
      expect(ariaHiddenSpan).toBeTruthy();
      // the slot fallback renders * inside the aria-hidden span via a named slot
      const slot = ariaHiddenSpan?.querySelector('slot[name="required-indicator"]') as HTMLSlotElement | null;
      expect(slot).toBeTruthy();
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
      const el = await fixture<HelixFieldLabel>('<hx-field-label optional>Notes</hx-field-label>');
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
