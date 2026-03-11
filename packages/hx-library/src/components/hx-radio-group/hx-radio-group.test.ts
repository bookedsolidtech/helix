import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcRadioGroup } from './hx-radio-group.js';
import type { WcRadio } from './hx-radio.js';
import './index.js';

afterEach(cleanup);

describe('hx-radio-group', () => {
  // ─── Rendering: Group (5) ───

  describe('Rendering: Group', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a fieldset element', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset).toBeInstanceOf(HTMLFieldSetElement);
    });

    it('renders legend with label text', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Choose One">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const legend = shadowQuery(el, 'legend');
      expect(legend?.textContent?.trim()).toContain('Choose One');
    });

    it('does not render legend when label is empty', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const legend = shadowQuery(el, 'legend');
      expect(legend).toBeNull();
    });

    it('has role="radiogroup" on shadow fieldset', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset?.getAttribute('role')).toBe('radiogroup');
    });
  });

  // ─── Rendering: Radio (4) ───

  describe('Rendering: Radio', () => {
    it('hx-radio renders with shadow DOM', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="Option A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as WcRadio;
      expect(radio.shadowRoot).toBeTruthy();
    });

    it('hx-radio renders label text', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="Option A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as WcRadio;
      const label = shadowQuery(radio, '.radio__label');
      expect(label?.textContent?.trim()).toContain('Option A');
    });

    it('hx-radio exposes "radio" CSS part', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as WcRadio;
      const part = shadowQuery(radio, '[part="radio"]');
      expect(part).toBeTruthy();
    });

    it('hx-radio exposes "label" CSS part', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as WcRadio;
      const part = shadowQuery(radio, '[part="label"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── CSS Parts: Group (4) ───

  describe('CSS Parts: Group', () => {
    it('exposes "fieldset" CSS part', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(shadowQuery(el, '[part="fieldset"]')).toBeTruthy();
    });

    it('exposes "legend" CSS part', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(shadowQuery(el, '[part="legend"]')).toBeTruthy();
    });

    it('exposes "group" CSS part', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(shadowQuery(el, '[part="group"]')).toBeTruthy();
    });

    it('exposes "error" CSS part when error is set', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" error="Error message">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(shadowQuery(el, '[part="error"]')).toBeTruthy();
    });
  });

  // ─── Properties (5) ───

  describe('Properties', () => {
    it('value property selects the matching radio', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="b">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as WcRadio[];
      expect(radios[0].checked).toBe(false);
      expect(radios[1].checked).toBe(true);
      expect(radios[2].checked).toBe(false);
    });

    it('required shows asterisk marker in legend', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const marker = shadowQuery(el, '.fieldset__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });

    it('disabled reflects to host attribute', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" disabled>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('orientation defaults to vertical', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.orientation).toBe('vertical');
    });

    it('orientation can be set to horizontal', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" orientation="horizontal">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.orientation).toBe('horizontal');
      expect(el.getAttribute('orientation')).toBe('horizontal');
    });
  });

  // ─── Error & Help Text (4) ───

  describe('Error & Help Text', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" error="Please select an option">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Please select an option');
    });

    it('error div has role="alert"', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" error="Error">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const errorDiv = shadowQuery(el, '.fieldset__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
    });

    it('renders help text below group', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" help-text="Select one option">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const helpText = shadowQuery(el, '.fieldset__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toBe('Select one option');
    });

    it('error hides help text', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" error="Error" help-text="Help">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const helpText = shadowQuery(el, '.fieldset__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches hx-change when a radio is selected', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const radioB = el.querySelector('hx-radio[value="b"]') as WcRadio;
      const label = shadowQuery(radioB, '.radio') as HTMLDivElement;
      label.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.detail.value).toBe('b');
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      const label = shadowQuery(radioA, '.radio') as HTMLDivElement;
      label.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('does not dispatch hx-change when selecting the already-selected radio', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      let eventFired = false;
      el.addEventListener('hx-change', () => {
        eventFired = true;
      });
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      const label = shadowQuery(radioA, '.radio') as HTMLDivElement;
      label.click();
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });
  });

  // ─── Keyboard Navigation (5) ───

  describe('Keyboard Navigation', () => {
    it('ArrowDown selects next radio', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('b');
    });

    it('ArrowRight selects next radio', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('b');
    });

    it('ArrowUp selects previous radio', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="b">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioB = el.querySelector('hx-radio[value="b"]') as WcRadio;
      radioB.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioB.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('a');
    });

    it('ArrowDown wraps from last to first', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="c">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioC = el.querySelector('hx-radio[value="c"]') as WcRadio;
      radioC.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioC.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('a');
    });

    it('ArrowUp wraps from first to last', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('c');
    });

    it('Space selects the focused radio', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('a');
    });

    it('Home moves to and selects first radio', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="c">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioC = el.querySelector('hx-radio[value="c"]') as WcRadio;
      radioC.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioC.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('a');
    });

    it('End moves to and selects last radio', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('c');
    });
  });

  // ─── Roving Tabindex (3) ───

  describe('Roving Tabindex', () => {
    it('selected radio gets tabindex=0, others get tabindex=-1', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="b">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as WcRadio[];
      expect(radios[0].tabIndex).toBe(-1);
      expect(radios[1].tabIndex).toBe(0);
      expect(radios[2].tabIndex).toBe(-1);
    });

    it('first enabled radio gets tabindex=0 when none selected', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as WcRadio[];
      expect(radios[0].tabIndex).toBe(0);
      expect(radios[1].tabIndex).toBe(-1);
      expect(radios[2].tabIndex).toBe(-1);
    });

    it('tabindex updates when value changes programmatically', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as WcRadio[];
      expect(radios[0].tabIndex).toBe(0);
      expect(radios[1].tabIndex).toBe(-1);

      el.value = 'b';
      await el.updateComplete;
      expect(radios[0].tabIndex).toBe(-1);
      expect(radios[1].tabIndex).toBe(0);
    });
  });

  // ─── Form Association (5) ───

  describe('Form Association', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-radio-group') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-radio-group label="Test" name="test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `;
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-radio-group') as WcRadioGroup;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets value to empty', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('formStateRestoreCallback restores value', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      el.formStateRestoreCallback('b');
      await el.updateComplete;
      expect(el.value).toBe('b');
    });
  });

  // ─── Validation (3) ───

  describe('Validation', () => {
    it('checkValidity returns false when required and empty', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required and value is set', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" required value="a">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing is set when required and empty', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.validity.valueMissing).toBe(true);
    });
  });

  // ─── Accessibility (4) ───

  describe('Accessibility', () => {
    it('shadow fieldset has role="radiogroup"', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset?.getAttribute('role')).toBe('radiogroup');
    });

    it('legend renders label text for accessible grouping', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="My Group">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const legend = shadowQuery(el, 'legend');
      expect(legend?.textContent?.trim()).toContain('My Group');
    });

    it('hx-radio contains a hidden native radio input', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as WcRadio;
      const input = shadowQuery<HTMLInputElement>(radio, 'input[type="radio"]');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('aria-hidden')).toBe('true');
    });

    it('sets aria-required on radiogroup when required', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset?.getAttribute('aria-required')).toBe('true');
    });

    it('does not set aria-required when not required', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset?.hasAttribute('aria-required')).toBe(false);
    });

    it('sets aria-labelledby pointing to legend id', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="My Group">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      const legend = shadowQuery(el, 'legend');
      const labelledBy = fieldset?.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(legend?.id).toBe(labelledBy);
    });

    it('sets aria-describedby to error id when error is present', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" error="Required field">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      const describedBy = fieldset?.getAttribute('aria-describedby');
      const errorDiv = shadowQuery(el, '.fieldset__error');
      expect(describedBy).toBeTruthy();
      expect(errorDiv?.id).toBe(describedBy);
    });

    it('sets aria-describedby to help-text id when help text is present', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" help-text="Select one">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      const describedBy = fieldset?.getAttribute('aria-describedby');
      const helpText = shadowQuery(el, '.fieldset__help-text');
      expect(describedBy).toBeTruthy();
      expect(helpText?.id).toBe(describedBy);
    });

    it('checked radio has checked attribute reflected', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      const radioB = el.querySelector('hx-radio[value="b"]') as WcRadio;
      expect(radioA.hasAttribute('checked')).toBe(true);
      expect(radioB.hasAttribute('checked')).toBe(false);
    });
  });

  // ─── Disabled Behavior (3) ───

  describe('Disabled Behavior', () => {
    it('group disabled propagates to child radios', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test" disabled>
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as WcRadio[];
      expect(radios[0].disabled).toBe(true);
      expect(radios[1].disabled).toBe(true);
    });

    it('disabled radio is not selectable via click', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A" disabled></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      let eventFired = false;
      el.addEventListener('hx-change', () => {
        eventFired = true;
      });
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      const label = shadowQuery(radioA, '.radio') as HTMLDivElement;
      label.click();
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });

    it('group re-enable restores individual radio disabled states', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A" disabled></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      const radioB = el.querySelector('hx-radio[value="b"]') as WcRadio;

      // Group disable overrides all
      el.disabled = true;
      await el.updateComplete;
      expect(radioA.disabled).toBe(true);
      expect(radioB.disabled).toBe(true);

      // Group re-enable restores individual states
      el.disabled = false;
      await el.updateComplete;
      expect(radioA.disabled).toBe(true); // was individually disabled
      expect(radioB.disabled).toBe(false); // was individually enabled
    });

    it('individual radio can be disabled while group is enabled', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A" disabled></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as WcRadio;
      const radioB = el.querySelector('hx-radio[value="b"]') as WcRadio;
      expect(radioA.disabled).toBe(true);
      expect(radioB.disabled).toBe(false);
    });
  });

  // ─── Slot Content (1) ───

  describe('Slot Content', () => {
    it('hx-radio default slot overrides label property', async () => {
      const el = await fixture<WcRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="Fallback"><strong>Custom Label</strong></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as WcRadio;
      const customContent = radio.querySelector('strong');
      expect(customContent).toBeTruthy();
      expect(customContent?.textContent).toBe('Custom Label');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    // The hidden <input type="radio"> inside wc-radio exists solely for form
    // participation (aria-hidden, tabindex=-1). axe flags nested-interactive
    // because the host carries role="radio", but this is a known false positive.
    const axeOptions = { rules: { 'nested-interactive': { enabled: false } } };

    it('has no axe violations in default state', async () => {
      const el = await fixture<WcRadioGroup>(`<hx-radio-group label="Color" name="color">
        <hx-radio value="red" label="Red"></hx-radio>
        <hx-radio value="blue" label="Blue"></hx-radio>
      </hx-radio-group>`);
      const { violations } = await checkA11y(el, axeOptions);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with selection', async () => {
      const el =
        await fixture<WcRadioGroup>(`<hx-radio-group label="Color" name="color" value="red">
        <hx-radio value="red" label="Red"></hx-radio>
        <hx-radio value="blue" label="Blue"></hx-radio>
      </hx-radio-group>`);
      const { violations } = await checkA11y(el, axeOptions);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el =
        await fixture<WcRadioGroup>(`<hx-radio-group label="Color" name="color" error="Required">
        <hx-radio value="red" label="Red"></hx-radio>
        <hx-radio value="blue" label="Blue"></hx-radio>
      </hx-radio-group>`);
      const { violations } = await checkA11y(el, axeOptions);
      expect(violations).toEqual([]);
    });
  });
});
