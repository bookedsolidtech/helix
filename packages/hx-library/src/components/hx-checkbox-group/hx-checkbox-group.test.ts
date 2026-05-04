import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixCheckboxGroup } from './hx-checkbox-group.js';
import type { HelixCheckbox } from '../hx-checkbox/hx-checkbox.js';
import '../hx-checkbox/index.js';
import './index.js';

type CheckboxGroupHarness = HelixCheckboxGroup & { _internals: ElementInternals };
type GroupedSuppressHarness = HelixCheckbox & { _groupedSuppress: boolean };

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

    it('error div has part="error"', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" error="Required">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const errorDiv = shadowQuery(el, '[part="error"]');
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
          <span slot="help-text">Select all that apply</span>
        </hx-checkbox-group>
      `);
      const helpSlotted = el.querySelector('[slot="help-text"]');
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

    it('exposes "error" CSS part when error is set', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" error="Something went wrong">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(shadowQuery(el, '[part="error"]')).toBeTruthy();
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

    it('submits checked values in FormData directly (not via restore callback)', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-checkbox-group label="Options" name="options">
          <hx-checkbox value="a" label="Option A" checked></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
          <hx-checkbox value="c" label="Option C" checked></hx-checkbox>
        </hx-checkbox-group>
      `;
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      container.appendChild(form);
      const el = form.querySelector('hx-checkbox-group') as HelixCheckboxGroup;
      await el.updateComplete;
      const data = new FormData(form);
      const submitted = data.getAll('options').map((v) => String(v));
      expect(submitted).toContain('a');
      expect(submitted).toContain('c');
      expect(submitted).not.toContain('b');
      form.remove();
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

    it('formDisabledCallback sets disabled when parent fieldset is disabled', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
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

    // Codex round-36 (medium): hasEffectiveLabelledBy contract — broken
    // aria-labelledby tokens must NOT erase the legend on either modern or
    // legacy paths. The host attribute mirror must clear the broken
    // consumer-supplied attribute so internals.ariaLabel takes over.
    it('keeps the legend accessible name when aria-labelledby points to a missing id', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" aria-labelledby="cbg-missing-target">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaLabelledByElements;
      if (refs && refs.length > 0) {
        const legend = shadowQuery(el, 'legend');
        expect(refs).toContain(legend);
      } else {
        expect(internals.ariaLabel).toBe('Topics');
        expect(el.getAttribute('aria-labelledby')).toBeNull();
      }
    });
  });

  // ─── Dynamic Children (P2-03) ───

  describe('Dynamic children', () => {
    it('picks up a checkbox added after initial render', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      // Add a second checkbox dynamically
      const newCb = document.createElement('hx-checkbox') as HelixCheckbox;
      newCb.value = 'b';
      newCb.setAttribute('label', 'Option B');
      el.appendChild(newCb);
      // Allow slot change and update cycle to settle
      await el.updateComplete;
      await newCb.updateComplete;

      const checkboxes = Array.from(el.querySelectorAll('hx-checkbox')) as HelixCheckbox[];
      expect(checkboxes.length).toBe(2);
    });

    it('removing a checked checkbox updates form validity', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" name="options" required>
          <hx-checkbox value="a" label="Option A" checked></hx-checkbox>
          <hx-checkbox value="b" label="Option B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      // Initially valid because checkbox A is checked
      expect(el.checkValidity()).toBe(true);

      // Remove the only checked checkbox — slotchange fires asynchronously after DOM removal.
      // Wait for both the slotchange microtask and the resulting Lit update cycle.
      const checkedCb = el.querySelector('hx-checkbox[value="a"]') as HelixCheckbox;
      checkedCb.remove();
      await el.updateComplete;

      // Now required group has no checked children — should be invalid
      expect(el.checkValidity()).toBe(false);
    });

    it('disabled state propagates to dynamically added checkboxes', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Test Group" disabled>
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const newCb = document.createElement('hx-checkbox') as HelixCheckbox;
      newCb.value = 'b';
      newCb.setAttribute('label', 'Option B');
      el.appendChild(newCb);
      await el.updateComplete;
      await newCb.updateComplete;

      // The new checkbox should inherit the group's disabled state via _handleSlotChange
      expect(newCb.disabled).toBe(true);
    });
  });

  // ─── name property (2) ───

  describe('Property: name', () => {
    it('name attribute is reflected to host', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Options" name="allergies">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.getAttribute('name')).toBe('allergies');
    });

    it('name property can be set programmatically', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      el.setAttribute('name', 'medications');
      await el.updateComplete;
      expect(el.getAttribute('name')).toBe('medications');
    });
  });

  // ─── reportValidity (1) ───

  describe('reportValidity', () => {
    it('reportValidity returns true when valid (not required)', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Options" name="opts">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      expect(el.reportValidity()).toBe(true);
    });
  });

  // ─── help-text property (2) ───

  describe('Property: help-text', () => {
    it('renders help text when help-text attribute is set', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Options" help-text="Select all that apply">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const helpText = shadowQuery(el, '.fieldset__help-text');
      expect(helpText?.textContent?.trim()).toBe('Select all that apply');
    });

    it('does not render help text container when neither help-text nor error is set', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Options">
          <hx-checkbox value="a" label="Option A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const helpText = shadowQuery(el, '.fieldset__help-text');
      // Either null or present but hidden — the key is no visible content
      if (helpText) {
        expect(helpText.textContent?.trim()).toBe('');
      } else {
        expect(helpText).toBeNull();
      }
    });
  });

  // ─── hx-change detail: multiple values (2) ───

  describe('hx-change detail: multiple checked values', () => {
    it('hx-change detail.values contains all currently checked values', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Options" name="opts">
          <hx-checkbox value="a" label="A" checked></hx-checkbox>
          <hx-checkbox value="b" label="B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const eventPromise = oneEvent<CustomEvent<{ values: string[] }>>(el, 'hx-change');
      const checkboxB = el.querySelector('hx-checkbox[value="b"]') as HelixCheckbox;
      const control = shadowQuery<HTMLElement>(checkboxB, '.checkbox__control');
      if (!control) throw new Error('.checkbox__control not found');
      control.click();
      const event = await eventPromise;
      expect(event.detail.values).toContain('a');
      expect(event.detail.values).toContain('b');
    });

    it('hx-change detail.values is empty after unchecking the only checked box', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Options" name="opts">
          <hx-checkbox value="a" label="A" checked></hx-checkbox>
        </hx-checkbox-group>
      `);
      const eventPromise = oneEvent<CustomEvent<{ values: string[] }>>(el, 'hx-change');
      const checkboxA = el.querySelector('hx-checkbox[value="a"]') as HelixCheckbox;
      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');
      if (!control) throw new Error('.checkbox__control not found');
      control.click();
      const event = await eventPromise;
      expect(event.detail.values).not.toContain('a');
      expect(event.detail.values).toHaveLength(0);
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

  // ─── ARIA delegation: host-elevated semantics (codex aria-group-2) ───

  describe('ARIA delegation: host semantics', () => {
    it('host carries role="group" via ElementInternals', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const internals = (el as CheckboxGroupHarness)._internals;
      expect(internals.role).toBe('group');
    });

    it('host ariaLabel mirrors the visible label so cross-shadow naming works', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Notification Topics">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const internals = (el as CheckboxGroupHarness)._internals;
      expect(internals.ariaLabel).toBe('Notification Topics');
    });

    it('host aria-label attribute wins over the visible label', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Internal" aria-label="Public name">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const internals = (el as CheckboxGroupHarness)._internals;
      expect(internals.ariaLabel).toBe('Public name');
    });

    it('host ariaRequired reflects required property', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" required>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const internals = (el as CheckboxGroupHarness)._internals;
      expect(internals.ariaRequired).toBe('true');
    });

    it('host ariaInvalid is driven by validity, not visible error content', async () => {
      // required + nothing checked = valueMissing without yet having an error
      // attribute set on the host.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" required>
          <hx-checkbox value="a" label="A"></hx-checkbox>
          <hx-checkbox value="b" label="B"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      const internals = (el as CheckboxGroupHarness)._internals;
      expect(internals.validity.valid).toBe(false);
      expect(internals.ariaInvalid).toBe('true');
    });

    it('error live region is persistent in the shadow tree', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const errorDiv = shadowQuery<HTMLElement>(el, '.fieldset__error');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.getAttribute('role')).toBe('alert');
      expect(errorDiv?.hasAttribute('hidden')).toBe(true);
    });

    it('error live region updates content rather than being recreated', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      const before = shadowQuery<HTMLElement>(el, '.fieldset__error');
      el.error = 'Required';
      await el.updateComplete;
      const after = shadowQuery<HTMLElement>(el, '.fieldset__error');
      // Same identity: container is persistent; only its content/visibility
      // mutates in response to validation changes.
      expect(after).toBe(before);
      expect(after?.hasAttribute('hidden')).toBe(false);
    });

    it('host ariaDescribedByElements references help text in the help-only state', async () => {
      // Codex round-15 P2: when both help-text and error are present, help is
      // hidden and dropped from the describedby chain. This test exercises
      // the help-only state to confirm help remains referenced when no error
      // is active.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" help-text="Hint">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const helpDiv = shadowQuery<HTMLElement>(el, '.fieldset__help-text')!;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        // Modern browsers (Chromium 134+, Safari 17.4+) — IDL element references.
        expect(refs.indexOf(helpDiv)).toBeGreaterThanOrEqual(0);
      } else {
        // No-IDL-ref fallback (round-19 contract): help/error TEXT mirrors
        // through `internals.ariaDescription`; the host `aria-describedby`
        // attribute carries ONLY consumer-supplied tokens, so the shadow
        // wrapper id MUST NOT appear there.
        const ariaDescription =
          (internals as ElementInternals & { ariaDescription: string | null })
            .ariaDescription ?? '';
        expect(ariaDescription).toContain('Hint');
        const tokens = el.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
        expect(tokens).not.toContain(helpDiv.id);
      }
    });

    it('drops help-text from describedBy chain when an error is active (round-15 P2)', async () => {
      // Codex round-15 P2: hidden help must not appear in the describedby
      // chain. The render path hides the help wrapper when an error is
      // active; appending it to host semantics would have AT announce stale
      // guidance ahead of the validation error.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" help-text="Hint" error="Required">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const helpDiv = shadowQuery<HTMLElement>(el, '.fieldset__help-text')!;
      const errorDiv = shadowQuery<HTMLElement>(el, '.fieldset__error')!;
      expect(helpDiv.hasAttribute('hidden')).toBe(true);
      expect(errorDiv.hasAttribute('hidden')).toBe(false);
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs.indexOf(errorDiv)).toBeGreaterThanOrEqual(0);
        expect(refs.indexOf(helpDiv)).toBe(-1);
      } else {
        // No-IDL-ref fallback (round-19 contract): help/error TEXT mirrors
        // through `internals.ariaDescription`; the host `aria-describedby`
        // attribute carries ONLY consumer-supplied tokens, so the shadow
        // wrapper ids MUST NOT appear there. Help is hidden when error is
        // active, so its text must be absent from `ariaDescription` too.
        const ariaDescription =
          (internals as ElementInternals & { ariaDescription: string | null })
            .ariaDescription ?? '';
        expect(ariaDescription).toContain('Required');
        expect(ariaDescription).not.toContain('Hint');
        const tokens = el.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
        expect(tokens).not.toContain(errorDiv.id);
        expect(tokens).not.toContain(helpDiv.id);
      }
    });
  });

  // ─── Codex round-2 finding #1: centralised form participation (3) ───

  describe('Form submission: no double-submit (round-2 F1)', () => {
    it('grouped children preserve their own name but FormData omits child keys', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-checkbox-group label="Topics" name="topics">
          <hx-checkbox value="a" label="A" name="custom-a" checked></hx-checkbox>
          <hx-checkbox value="b" label="B" name="custom-b" checked></hx-checkbox>
        </hx-checkbox-group>
      `;
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      container.appendChild(form);
      const el = form.querySelector('hx-checkbox-group') as HelixCheckboxGroup;
      await el.updateComplete;
      const checkboxes = Array.from(el.querySelectorAll('hx-checkbox')) as HelixCheckbox[];
      for (const cb of checkboxes) await cb.updateComplete;

      // Round-3 hardening: the group does NOT mutate the child name (round-2
      // cleared it, which broke when consumers re-set it post-attach). The
      // public contract is FormData-shaped: the group's `topics` key carries
      // the checked value, child names are preserved verbatim, and no child
      // key appears even though both children carry their own names. The
      // suppression mechanism is asserted at the white-box level by the
      // dedicated round-3 F1 test below.
      expect(checkboxes[0].name).toBe('custom-a');
      expect(checkboxes[1].name).toBe('custom-b');

      const data = new FormData(form);
      expect(data.getAll('topics').map((v) => String(v))).toEqual(['a', 'b']);
      expect(data.has('custom-a')).toBe(false);
      expect(data.has('custom-b')).toBe(false);
      form.remove();
    });

    it('FormData contains each checked value exactly once (no duplicates)', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-checkbox-group label="Options" name="opts">
          <hx-checkbox value="a" label="A" checked></hx-checkbox>
          <hx-checkbox value="b" label="B"></hx-checkbox>
          <hx-checkbox value="c" label="C" checked></hx-checkbox>
        </hx-checkbox-group>
      `;
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      container.appendChild(form);
      const el = form.querySelector('hx-checkbox-group') as HelixCheckboxGroup;
      await el.updateComplete;
      // Allow any updated() side effects (form value writes) to settle.
      const checkboxes = Array.from(el.querySelectorAll('hx-checkbox')) as HelixCheckbox[];
      for (const cb of checkboxes) await cb.updateComplete;

      const data = new FormData(form);
      const submitted = data.getAll('opts').map((v) => String(v));
      // Round-2 finding #1: checked values must appear exactly once.
      // Pre-fix the group + each child would each append, producing duplicates.
      const aCount = submitted.filter((v) => v === 'a').length;
      const cCount = submitted.filter((v) => v === 'c').length;
      expect(aCount).toBe(1);
      expect(cCount).toBe(1);
      expect(submitted).not.toContain('b');
      form.remove();
    });

    it('group-suppresses each child via _groupedSuppress, surviving late child name mutation', async () => {
      // Round-2 used `cb.name = ''` as the suppression signal — a consumer or
      // framework binding that re-set `cb.name` post-attach regained form
      // participation through the `name` setter. Round-3 introduces the
      // name-independent `_groupedSuppress` flag as a durable kill switch:
      // `_updateFormValue()` returns null whenever the flag is set,
      // regardless of `name` (see hx-checkbox.ts:529). This test exercises
      // both the property-level flag and the FormData-level proof — the
      // exact regression vector from round-2 is the late `cb.name = ...`
      // mutation, so we drive that explicitly.
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-checkbox-group label="Topics" name="topics">
          <hx-checkbox value="a" label="A" name="kept-by-consumer" checked></hx-checkbox>
        </hx-checkbox-group>
      `;
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      container.appendChild(form);
      const el = form.querySelector('hx-checkbox-group') as HelixCheckboxGroup;
      await el.updateComplete;
      const cb = el.querySelector('hx-checkbox') as HelixCheckbox;
      await cb.updateComplete;

      expect((cb as GroupedSuppressHarness)._groupedSuppress).toBe(true);
      expect(cb.name).toBe('kept-by-consumer');

      // Pre-rename snapshot: suppression already holds at attach. This is
      // load-bearing because a broken impl would serialize under the
      // `kept-by-consumer` key here, before the rename ever runs.
      const before = new FormData(form);
      expect(before.getAll('topics').map((v) => String(v))).toEqual(['a']);
      expect(before.has('kept-by-consumer')).toBe(false);

      // Late child-name mutation — the round-2 regression vector. The flag
      // must still be set and FormData must omit the new name.
      cb.name = 'late-name';
      await cb.updateComplete;
      expect((cb as GroupedSuppressHarness)._groupedSuppress).toBe(true);

      const after = new FormData(form);
      expect(after.getAll('topics').map((v) => String(v))).toEqual(['a']);
      expect(after.has('late-name')).toBe(false);
      form.remove();
    });
  });

  // ─── Codex round-19 P1: single accessible-container invariant (4) ───

  describe('Single accessible-container invariant (round-19 P1)', () => {
    /**
     * Forces the no-IDL-ref fallback branch so the assertions below exercise
     * the same code path a legacy engine (e.g. Firefox today) would take.
     * Mirrors the `hx-checkbox` test harness pattern.
     */
    type GroupTestHarness = HelixCheckboxGroup & {
      _supportsIdrefRefs: boolean;
      _syncHostAriaSemantics(): void;
    };
    async function forceFallbackPath(el: HelixCheckboxGroup): Promise<void> {
      const harness = el as GroupTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;
    }

    it('modern path: host owns role="group", inner fieldset is presentation', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const fieldset = shadowQuery<HTMLFieldSetElement>(el, 'fieldset')!;
      expect(internals.role).toBe('group');
      expect(fieldset.getAttribute('role')).toBe('presentation');
    });

    it('fallback path: host still owns role="group", inner fieldset stays presentation', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const fieldset = shadowQuery<HTMLFieldSetElement>(el, 'fieldset')!;
      // Single accessible container — the host. AT must NOT see a nested
      // host group → inner group → controls hierarchy.
      expect(internals.role).toBe('group');
      expect(fieldset.getAttribute('role')).toBe('presentation');
    });

    it('fallback path: inner fieldset has no aria-labelledby / aria-describedby / aria-required / aria-invalid', async () => {
      // With help text + error + required, prior rounds spliced shadow
      // help/error ids onto the inner fieldset; round-19 drops that splice
      // entirely (shadow IDREFs cannot resolve to consumer light DOM, so
      // merging them was always broken on the fallback path).
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" help-text="Hint" error="Required" required>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const fieldset = shadowQuery<HTMLFieldSetElement>(el, 'fieldset')!;
      expect(fieldset.hasAttribute('aria-labelledby')).toBe(false);
      expect(fieldset.hasAttribute('aria-describedby')).toBe(false);
      expect(fieldset.hasAttribute('aria-required')).toBe(false);
      expect(fieldset.hasAttribute('aria-invalid')).toBe(false);
    });

    it('fallback path: consumer aria-labelledby / aria-describedby still mirror onto host', async () => {
      const container = document.getElementById('test-fixture-container');
      if (!container) throw new Error('test-fixture-container not found');
      const labelHost = document.createElement('span');
      labelHost.id = 'cbxg-ext-label';
      labelHost.textContent = 'External Label';
      const helpHost = document.createElement('span');
      helpHost.id = 'cbxg-ext-help';
      helpHost.textContent = 'External Help';
      container.appendChild(labelHost);
      container.appendChild(helpHost);

      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group aria-labelledby="cbxg-ext-label" aria-describedby="cbxg-ext-help">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      // Consumer-supplied tokens stay on the host (they resolve in the host's
      // containing root). Inner fieldset is untouched.
      expect(el.getAttribute('aria-labelledby')).toBe('cbxg-ext-label');
      expect(el.getAttribute('aria-describedby')).toBe('cbxg-ext-help');
      const fieldset = shadowQuery<HTMLFieldSetElement>(el, 'fieldset')!;
      expect(fieldset.hasAttribute('aria-labelledby')).toBe(false);
      expect(fieldset.hasAttribute('aria-describedby')).toBe(false);
    });

    // ─── Codex round-20 P2: required marker must not pollute fallback ariaLabel ───
    it('fallback path: required visible marker is excluded from host fallback ariaLabel', async () => {
      // Codex round-20 P2 regression: the legend renders a visible
      // `<span class="fieldset__required-marker" aria-hidden="true">*</span>`
      // as a sibling of `<slot name="label">` in shadow DOM. An earlier
      // implementation read the rendered legend's `textContent`, which
      // flattened the marker into the fallback `internals.ariaLabel` —
      // engines without `ariaLabelledByElements` (Firefox today) then
      // announced "Topics *". The fallback name resolution must consult
      // `this.label` (and slot-assigned nodes via `slot.assignedNodes()`)
      // so the marker — which lives outside the slot — is excluded.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" required>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      // Sanity: the visible marker is rendered inside the legend.
      const marker = shadowQuery(el, '.fieldset__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Topics');
      expect(internals.ariaLabel).not.toContain('*');
    });

    it('fallback path: slotted label content contributes to ariaLabel without the marker', async () => {
      // When the consumer supplies the legend via `<slot name="label">`
      // (no `label` property), the fallback must still produce a clean
      // accessible name. Reading slot-assigned nodes excludes the marker
      // because the marker is rendered as a sibling of the slot in shadow
      // DOM, not inside the slotted content.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group required>
          <span slot="label">Topics</span>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Topics');
      expect(internals.ariaLabel).not.toContain('*');
    });

    // ─── Codex round-21 P3: in-place slotted label textContent edits ───
    it('fallback path: in-place slotted label textContent edits resync host ariaLabel', async () => {
      // Codex round-21 P3 regression: an in-place rewrite such as
      // `labelNode.textContent = 'New label'` does NOT fire `slotchange`,
      // so the no-IDL-ref fallback `internals.ariaLabel` would otherwise
      // keep announcing the stale name (Firefox today). A MutationObserver
      // over the slot's assigned nodes (`characterData`/`childList`/
      // `subtree`) catches the edit and replays `_syncHostAriaSemantics()`
      // so the fallback name updates within a microtask.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group>
          <span slot="label">Old Label</span>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Old Label');

      // In-place textContent rewrite — same node, no slotchange.
      const slottedLabel = el.querySelector('[slot="label"]') as HTMLSpanElement;
      slottedLabel.textContent = 'New Label';

      // The observer schedules a microtask; await one to flush.
      await Promise.resolve();
      // _syncHostAriaSemantics ran via the observer; verify the fallback name
      // mirrors the new content.
      expect(internals.ariaLabel).toBe('New Label');
    });

    it('fallback path: nested DOM edits inside slotted label resync host ariaLabel', async () => {
      // The observer subtree is enabled, so descendant text mutations within
      // a slotted wrapper element also trigger the resync. This guards
      // frameworks that render the legend through a wrapper element and
      // mutate a child text node in place.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group>
          <span slot="label"><strong>Old Strong</strong></span>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Old Strong');

      const strong = el.querySelector('[slot="label"] strong') as HTMLElement;
      strong.textContent = 'New Strong';
      await Promise.resolve();

      expect(internals.ariaLabel).toBe('New Strong');
    });

    // ─── Codex round-22 P1 #2: shadow help/error strings reach the host ───
    it('fallback path: error textContent mirrors into internals.ariaDescription', async () => {
      // Codex round-22 P1 #2 regression: on the no-IDL-ref fallback path
      // earlier rounds only mirrored consumer-supplied describedby tokens
      // onto the host, leaving the internal shadow `error` wrapper
      // unassociated with the radiogroup on Firefox-class engines. The fix
      // string-mirrors the wrapper's textContent into `internals.ariaDescription`,
      // which survives the shadow boundary independently of element references.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" error="This field is required">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaDescription).toBeTruthy();
      expect(internals.ariaDescription).toContain('This field is required');
    });

    it('fallback path: help-text textContent mirrors into internals.ariaDescription', async () => {
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics" help-text="Pick one or more topics">
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaDescription).toBeTruthy();
      expect(internals.ariaDescription).toContain('Pick one or more topics');
    });

    // ─── Codex round-22 P2: slot label overrides the label property ───
    it('fallback path: slotted label content overrides label property in internals.ariaLabel', async () => {
      // Documented contract: `@slot label - Rich HTML group label (overrides
      // the label property when used)`. With both supplied, the slot wins.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Internal">
          <span slot="label">Public</span>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Public');
    });

    // ─── Codex round-23 P2 (Finding A): empty slot still wins over label property ───
    it('fallback path: empty slot label suppresses label property fallback in internals.ariaLabel', async () => {
      // Codex round-23 P2 regression: a whitespace-only or empty
      // `<span slot="label">` previously trimmed to '' and let the resolution
      // fall through to `this.label`, so the host announced the property name
      // ("Internal") while the rendered legend stayed empty (the slot
      // suppresses fallback content whenever it has assigned nodes). The fix
      // gates precedence on assigned-node *presence*, not on the trimmed text.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Internal">
          <span slot="label"></span>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      // The slot has assigned nodes (an empty span), so it wins. The trimmed
      // text is '', so the fallback ariaLabel is null — same outcome AT sees
      // for the visible legend (which renders the empty span and nothing
      // else; the property fallback is suppressed by the slot's presence).
      expect(internals.ariaLabel).toBeNull();
    });

    // ─── Codex round-23 P2 (Finding B): in-place error/help slot edits resync ariaDescription ───
    it('fallback path: in-place slotted error textContent edits resync internals.ariaDescription', async () => {
      // Codex round-23 P2 regression: `internals.ariaDescription` is a
      // one-shot snapshot. An in-place `textContent` rewrite on an already
      // assigned `<slot name="error">` node does NOT fire `slotchange`, so a
      // separate `MutationObserver` over the slot's assigned nodes is
      // required to replay `_syncHostAriaSemantics()` and refresh the
      // fallback `internals.ariaDescription` string.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics">
          <span slot="error">Original error</span>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaDescription).toContain('Original error');

      const slottedError = el.querySelector('[slot="error"]') as HTMLSpanElement;
      slottedError.textContent = 'Updated error';
      // The observer schedules a microtask; await one to flush.
      await Promise.resolve();

      expect(internals.ariaDescription).toContain('Updated error');
      expect(internals.ariaDescription).not.toContain('Original error');
    });

    it('fallback path: in-place slotted help-text textContent edits resync internals.ariaDescription', async () => {
      // Codex round-24 P3 test gap: parity with the error-slot test above.
      // The help-text slot has the same `MutationObserver` wired in
      // commit 1c07237e2 — verify in-place `textContent` edits on an already
      // assigned `<slot name="help-text">` node replay
      // `_syncHostAriaSemantics()` and refresh `internals.ariaDescription`.
      const el = await fixture<HelixCheckboxGroup>(`
        <hx-checkbox-group label="Topics">
          <span slot="help-text">Initial help</span>
          <hx-checkbox value="a" label="A"></hx-checkbox>
        </hx-checkbox-group>
      `);
      await el.updateComplete;
      await forceFallbackPath(el);

      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaDescription).toContain('Initial help');

      const slottedHelp = el.querySelector('[slot="help-text"]') as HTMLSpanElement;
      slottedHelp.textContent = 'Updated help';
      // The observer schedules a microtask; await one to flush.
      await Promise.resolve();

      expect(internals.ariaDescription).toContain('Updated help');
      expect(internals.ariaDescription).not.toContain('Initial help');
    });
  });
});
