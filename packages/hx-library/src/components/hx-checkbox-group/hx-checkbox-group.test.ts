import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixCheckboxGroup } from './hx-checkbox-group.js';
import type { HelixCheckbox } from '../hx-checkbox/hx-checkbox.js';
import '../hx-checkbox/index.js';
import './index.js';

afterEach(cleanup);

describe('hx-checkbox-group', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a fieldset element', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset).toBeInstanceOf(HTMLFieldSetElement);
    });

    it('renders legend with label text', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Choose Options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const legend = shadowQuery(el, 'legend');
      expect(legend?.textContent?.trim()).toContain('Choose Options');
    });

    it('default orientation is vertical', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.orientation).toBe('vertical');
    });
  });

  // ─── Property: label (2) ───

  describe('Property: label', () => {
    it('shows label text in legend', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Notification Preferences">
          <hx-checkbox value="email" label="Email"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const legend = shadowQuery(el, 'legend');
      expect(legend?.textContent?.trim()).toContain('Notification Preferences');
    });

    it('renders legend with empty text when no label is provided', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const legend = shadowQuery(el, 'legend');
      // Legend is always rendered; with no label it has no meaningful text
      expect(legend).toBeTruthy();
      const textContent = legend?.textContent?.trim() ?? '';
      expect(textContent).toBe('');
    });
  });

  // ─── Property: required (2) ───

  describe('Property: required', () => {
    it('shows required marker asterisk in legend', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" required>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const marker = shadowQuery(el, '.fieldset__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });

    it('reflects required attribute to host', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" required>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.hasAttribute('required')).toBe(true);
    });
  });

  // ─── Property: error (3) ───

  describe('Property: error', () => {
    it('shows error message div with role="alert"', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" error="Please select at least one option">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Please select at least one option');
    });

    it('error div has part="error-message"', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" error="Required">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const errorDiv = shadowQuery(el, '[part="error-message"]');
      expect(errorDiv).toBeTruthy();
    });

    it('error div uses role="alert" without aria-live override', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" error="Error">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const errorDiv = shadowQuery(el, '.fieldset__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
      expect(errorDiv?.hasAttribute('aria-live')).toBe(false);
    });
  });

  // ─── Property: orientation (2) ───

  describe('Property: orientation', () => {
    it('orientation defaults to vertical', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.orientation).toBe('vertical');
      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('horizontal orientation reflects to host attribute', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" orientation="horizontal">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.orientation).toBe('horizontal');
      expect(el.getAttribute('orientation')).toBe('horizontal');
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" disabled>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('propagates disabled to child hx-checkbox elements', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" disabled>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const checkboxes = Array.from(el.querySelectorAll('hx-checkbox')) as HelixCheckbox[];
      expect(checkboxes[0].disabled).toBe(true);
      expect(checkboxes[1].disabled).toBe(true);
    });
  });

  // ─── Slots (4) ───

  describe('Slots', () => {
    it('default slot renders hx-checkbox children', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const checkboxes = el.querySelectorAll('hx-checkbox');
      expect(checkboxes.length).toBe(2);
    });

    it('label slot overrides label property', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Fallback Label">
          <strong slot="label">Custom <em>Rich</em> Label</strong>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const slotted = el.querySelector('[slot="label"]');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent?.trim()).toContain('Custom');
    });

    it('help slot renders help text content', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <span slot="help">Select all that apply</span>
        </hx-checkbox-group>
      `);
      const helpSlotted = el.querySelector('[slot="help"]');
      expect(helpSlotted).toBeTruthy();
      expect(helpSlotted?.textContent).toBe('Select all that apply');
    });

    it('error slot overrides error property', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" error="Prop error">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <span slot="error">Slotted error message</span>
        </hx-checkbox-group>
      `);
      const errorSlotted = el.querySelector('[slot="error"]');
      expect(errorSlotted).toBeTruthy();
      expect(errorSlotted?.textContent).toBe('Slotted error message');
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('exposes "group" CSS part on fieldset', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(shadowQuery(el, '[part="group"]')).toBeTruthy();
    });

    it('exposes "label" CSS part on legend', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(shadowQuery(el, '[part="label"]')).toBeTruthy();
    });

    it('exposes "help-text" CSS part', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(shadowQuery(el, '[part="help-text"]')).toBeTruthy();
    });

    it('exposes "error-message" CSS part when error is set', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" error="Something went wrong">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(shadowQuery(el, '[part="error-message"]')).toBeTruthy();
    });
  });

  // ─── Events (5) ───

  describe('Events', () => {
    it('dispatches hx-change when a child checkbox changes', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const eventPromise = oneEvent<CustomEvent<{ values: string[] }>>(el, 'hx-change');
      const checkboxA = el.querySelector('hx-checkbox[value="a"]') as HelixCheckbox;
      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');
      if (!control) throw new Error('.checkbox__control not found');
      control.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change event detail has values array with checked checkbox values', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const eventPromise = oneEvent<CustomEvent<{ values: string[] }>>(el, 'hx-change');
      const checkboxA = el.querySelector('hx-checkbox[value="a"]') as HelixCheckbox;
      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');
      if (!control) throw new Error('.checkbox__control not found');
      control.click();
      const event = await eventPromise;
      expect(Array.isArray(event.detail.values)).toBe(true);
      expect(event.detail.values).toContain('a');
    });

    it('hx-change is composed and bubbles', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const eventPromise = oneEvent<CustomEvent<{ values: string[] }>>(el, 'hx-change');
      const checkboxA = el.querySelector('hx-checkbox[value="a"]') as HelixCheckbox;
      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');
      if (!control) throw new Error('.checkbox__control not found');
      control.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('stops propagation of hx-change from child checkbox (re-dispatches from group)', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      // The group should intercept child events and re-dispatch — only one event should arrive at the group
      const receivedEvents: CustomEvent<{ values: string[] }>[] = [];
      el.addEventListener('hx-change', (e) => {
        receivedEvents.push(e as CustomEvent<{ values: string[] }>);
      });
      const checkboxA = el.querySelector('hx-checkbox[value="a"]') as HelixCheckbox;
      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');
      if (!control) throw new Error('.checkbox__control not found');
      control.click();
      // Wait for event processing
      await el.updateComplete;
      // Exactly one hx-change should arrive, dispatched by the group (target === el)
      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].target).toBe(el);
    });

    it('does not re-dispatch hx-change when target is the group itself', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      let eventCount = 0;
      el.addEventListener('hx-change', () => {
        eventCount++;
      });
      // Dispatch an hx-change directly from the group element (simulates the guard condition)
      el.dispatchEvent(
        new CustomEvent('hx-change', {
          bubbles: true,
          composed: true,
          detail: { values: ['a'] },
        }),
      );
      await el.updateComplete;
      // Only the directly dispatched event should count, not a re-dispatch loop
      expect(eventCount).toBe(1);
    });
  });

  // ─── Form Integration (6) ───

  describe('Form Integration', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-checkbox-group') as unknown as {
        formAssociated: boolean;
      };
      expect(ctor.formAssociated).toBe(true);
    });

    it('form getter returns null when not inside a form', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form element', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `;
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      container.appendChild(form);
      const el = form.querySelector('hx-checkbox-group') as HelixCheckboxGroup;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('required group is invalid when no checkboxes are checked', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
    });

    it('required group is valid when at least one checkbox is checked', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A" checked></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.checkValidity()).toBe(true);
    });

    it('formResetCallback resets all child checkboxes to unchecked', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A" checked></hx-checkbox>
          <hx-checkbox value="b" label="Option B" checked></hx-checkbox>
        </hx-checkbox-group>
      `);
      const checkboxes = Array.from(el.querySelectorAll('hx-checkbox')) as HelixCheckbox[];
      expect(checkboxes[0].checked).toBe(true);
      expect(checkboxes[1].checked).toBe(true);

      el.formResetCallback();
      await el.updateComplete;

      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(false);
    });
  });

  // ─── Form State Restore & Getters (5) ───

  describe('formStateRestoreCallback and getters', () => {
    it('formStateRestoreCallback restores checked state from FormData', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const fd = new FormData();
      fd.append('options', 'b');
      el.formStateRestoreCallback(fd);
      await el.updateComplete;
      const checkboxes = Array.from(el.querySelectorAll('hx-checkbox')) as HelixCheckbox[];
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
    });

    it('formStateRestoreCallback ignores non-FormData state', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A" checked></hx-checkbox>
        </hx-checkbox-group>
      `);
      // Should silently no-op for string state
      expect(() => el.formStateRestoreCallback('some-string')).not.toThrow();
      await el.updateComplete;
      const cb = el.querySelector('hx-checkbox') as HelixCheckbox;
      expect(cb.checked).toBe(true);
    });

    it('validationMessage getter returns empty string when valid', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.validationMessage).toBe('');
    });

    it('validationMessage getter returns message when invalid', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.validationMessage).toBeTruthy();
    });

    it('validity getter returns ValidityState with valueMissing when required and empty', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.validity).toBeInstanceOf(ValidityState);
      expect(el.validity.valueMissing).toBe(true);
    });

    it('sets form value on first render when checkboxes have checked attribute', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A" checked></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      // Group should be valid since a checkbox is pre-checked
      expect(el.checkValidity()).toBe(true);
    });
  });

  // ─── Validation (3) ───

  describe('Validation', () => {
    it('checkValidity returns false when required and no checkboxes are checked', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required and at least one checkbox is checked', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A" checked></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.checkValidity()).toBe(true);
    });

    it('reportValidity returns false when required and empty', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.reportValidity()).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Notification Settings" name="notifications">
          <hx-checkbox value="email" label="Email"></hx-checkbox>
          <hx-checkbox value="sms" label="SMS"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when required', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Notification Settings" name="notifications" required>
          <hx-checkbox value="email" label="Email"></hx-checkbox>
          <hx-checkbox value="sms" label="SMS"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Notification Settings" name="notifications" error="Please select at least one option">
          <hx-checkbox value="email" label="Email"></hx-checkbox>
          <hx-checkbox value="sms" label="SMS"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
