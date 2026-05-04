import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxRadioGroup } from './hx-radio-group.js';
import type { HxRadio } from './hx-radio.js';
import './index.js';

afterEach(cleanup);

/**
 * Strongly-typed harness for the private internals the suite reaches into.
 * Codex round-7 finding `#4` replaced scattered `as any` casts with this
 * single seam — TypeScript strict mode keeps holding the line on the rest
 * of the suite.
 */
type RadioGroupTestHarness = HxRadioGroup & {
  _internals: ElementInternals;
};

describe('hx-radio-group', () => {
  // ─── Rendering: Group (5) ───

  describe('Rendering: Group', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a fieldset element', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset).toBeInstanceOf(HTMLFieldSetElement);
    });

    it('renders legend with label text', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Choose One">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const legend = shadowQuery(el, 'legend');
      expect(legend?.textContent?.trim()).toContain('Choose One');
    });

    it('does not render legend when label is empty', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const legend = shadowQuery(el, 'legend');
      expect(legend).toBeNull();
    });

    it('exposes role="radiogroup" on host via ElementInternals (codex aria-group-2)', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('radiogroup');
      // Inner fieldset is presentation-only; its role attribute is removed
      // so AT does not see two stacked radiogroup roles.
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset?.getAttribute('role')).toBe('presentation');
    });
  });

  // ─── Rendering: Radio (4) ───

  describe('Rendering: Radio', () => {
    it('hx-radio renders with shadow DOM', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="Option A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as HxRadio;
      expect(radio.shadowRoot).toBeTruthy();
    });

    it('hx-radio renders label text', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="Option A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as HxRadio;
      const label = shadowQuery(radio, '.radio__label');
      expect(label?.textContent?.trim()).toContain('Option A');
    });

    it('hx-radio exposes "radio" CSS part', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as HxRadio;
      const part = shadowQuery(radio, '[part="radio"]');
      expect(part).toBeTruthy();
    });

    it('hx-radio exposes "label" CSS part', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as HxRadio;
      const part = shadowQuery(radio, '[part="label"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── CSS Parts: Group (4) ───

  describe('CSS Parts: Group', () => {
    it('exposes "fieldset" CSS part', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(shadowQuery(el, '[part="fieldset"]')).toBeTruthy();
    });

    it('exposes "legend" CSS part', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(shadowQuery(el, '[part="legend"]')).toBeTruthy();
    });

    it('exposes "group" CSS part', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(shadowQuery(el, '[part="group"]')).toBeTruthy();
    });

    it('exposes "error" CSS part when error is set', async () => {
      const el = await fixture<HxRadioGroup>(`
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
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="b">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as HxRadio[];
      expect(radios[0].checked).toBe(false);
      expect(radios[1].checked).toBe(true);
      expect(radios[2].checked).toBe(false);
    });

    it('required shows asterisk marker in legend', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const marker = shadowQuery(el, '.fieldset__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });

    it('disabled reflects to host attribute', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" disabled>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('orientation defaults to vertical', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.orientation).toBe('vertical');
    });

    it('orientation can be set to horizontal', async () => {
      const el = await fixture<HxRadioGroup>(`
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
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" error="Please select an option">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Please select an option');
    });

    it('error div has role="alert"', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" error="Error">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const errorDiv = shadowQuery(el, '.fieldset__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
    });

    it('renders help text below group', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" help-text="Select one option">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const helpText = shadowQuery(el, '.fieldset__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toBe('Select one option');
    });

    it('error hides help text (visually hidden, kept in DOM for stable describedBy)', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" error="Error" help-text="Help">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const helpText = shadowQuery<HTMLElement>(el, '.fieldset__help-text');
      // Persistent in the DOM so the describedBy chain remains stable across
      // error transitions, but visually hidden via the `hidden` attribute.
      expect(helpText).toBeTruthy();
      expect(helpText?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches hx-change when a radio is selected', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const radioB = el.querySelector('hx-radio[value="b"]') as HxRadio;
      const label = shadowQuery(radioB, '.radio') as HTMLDivElement;
      label.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.detail.value).toBe('b');
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      const label = shadowQuery(radioA, '.radio') as HTMLDivElement;
      label.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('does not dispatch hx-change when selecting the already-selected radio', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      let eventFired = false;
      el.addEventListener('hx-change', () => {
        eventFired = true;
      });
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      const label = shadowQuery(radioA, '.radio') as HTMLDivElement;
      label.click();
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });
  });

  // ─── Keyboard Navigation (5) ───

  describe('Keyboard Navigation', () => {
    it('ArrowDown selects next radio', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('b');
    });

    it('ArrowRight selects next radio', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('b');
    });

    it('ArrowUp selects previous radio', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="b">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioB = el.querySelector('hx-radio[value="b"]') as HxRadio;
      radioB.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioB.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('a');
    });

    it('ArrowDown wraps from last to first', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="c">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioC = el.querySelector('hx-radio[value="c"]') as HxRadio;
      radioC.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioC.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('a');
    });

    it('ArrowUp wraps from first to last', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('c');
    });

    it('Space selects the focused radio', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('a');
    });

    it('Home moves to and selects first radio', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="c">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioC = el.querySelector('hx-radio[value="c"]') as HxRadio;
      radioC.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioC.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('a');
    });

    it('End moves to and selects last radio', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
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
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="b">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as HxRadio[];
      expect(radios[0].tabIndex).toBe(-1);
      expect(radios[1].tabIndex).toBe(0);
      expect(radios[2].tabIndex).toBe(-1);
    });

    it('first enabled radio gets tabindex=0 when none selected', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as HxRadio[];
      expect(radios[0].tabIndex).toBe(0);
      expect(radios[1].tabIndex).toBe(-1);
      expect(radios[2].tabIndex).toBe(-1);
    });

    it('tabindex updates when value changes programmatically', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as HxRadio[];
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
    it('submits selected radio value in FormData', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <hx-radio-group label="Color" name="color" value="blue">
          <hx-radio value="red" label="Red"></hx-radio>
          <hx-radio value="blue" label="Blue"></hx-radio>
        </hx-radio-group>
      `;
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-radio-group') as HxRadioGroup;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('color')).toBe('blue');
      form.remove();
    });

    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-radio-group') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<HxRadioGroup>(`
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
      const el = form.querySelector('hx-radio-group') as HxRadioGroup;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets value to empty', async () => {
      const el = await fixture<HxRadioGroup>(`
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
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      el.formStateRestoreCallback('b');
      await el.updateComplete;
      expect(el.value).toBe('b');
    });

    it('formDisabledCallback sets disabled when parent fieldset is disabled', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
    });
  });

  // ─── Validation (3) ───

  describe('Validation', () => {
    it('checkValidity returns false when required and empty', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required and value is set', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" required value="a">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing is set when required and empty', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.validity.valueMissing).toBe(true);
    });
  });

  // ─── Accessibility (4) ───

  describe('Accessibility', () => {
    it('host carries role="radiogroup" via ElementInternals; inner fieldset is presentation', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('radiogroup');
      const fieldset = shadowQuery(el, 'fieldset');
      expect(fieldset?.getAttribute('role')).toBe('presentation');
    });

    it('legend renders label text for accessible grouping', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="My Group">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const legend = shadowQuery(el, 'legend');
      expect(legend?.textContent?.trim()).toContain('My Group');
    });

    it('hx-radio contains a hidden native radio input', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as HxRadio;
      const input = shadowQuery<HTMLInputElement>(radio, 'input[type="radio"]');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('aria-hidden')).toBe('true');
    });

    it('sets host ariaRequired via internals when required', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaRequired).toBe('true');
    });

    it('does not set host ariaRequired="true" when not required', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaRequired).not.toBe('true');
    });

    it('host ariaLabelledByElements points to the visible legend (when no consumer aria-labelledby)', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="My Group">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const legend = shadowQuery(el, 'legend');
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaLabelledByElements;
      if (refs) {
        // IDL element references — modern browsers.
        expect(refs).toContain(legend);
      } else {
        // No-IDL-ref fallback: host ariaLabel mirrors the label property.
        expect(internals.ariaLabel).toContain('My Group');
      }
    });

    it('host ariaDescribedByElements references error wrapper when error is set', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" error="Required field">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const errorWrapper = shadowQuery<HTMLElement>(el, '.fieldset__error');
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs).toContain(errorWrapper);
      } else {
        const tokens = el.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
        expect(tokens).toContain(errorWrapper?.id);
      }
    });

    it('host ariaDescribedByElements references help-text wrapper when help text is set', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" help-text="Select one">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const helpText = shadowQuery<HTMLElement>(el, '.fieldset__help-text');
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs).toContain(helpText);
      } else {
        const tokens = el.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
        expect(tokens).toContain(helpText?.id);
      }
    });

    it('checked radio has checked attribute reflected', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      const radioB = el.querySelector('hx-radio[value="b"]') as HxRadio;
      expect(radioA.hasAttribute('checked')).toBe(true);
      expect(radioB.hasAttribute('checked')).toBe(false);
    });
  });

  // ─── Disabled Behavior (3) ───

  describe('Disabled Behavior', () => {
    it('group disabled propagates to child radios', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" disabled>
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radios = Array.from(el.querySelectorAll('hx-radio')) as HxRadio[];
      expect(radios[0].disabled).toBe(true);
      expect(radios[1].disabled).toBe(true);
    });

    it('disabled radio is not selectable via click', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A" disabled></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      let eventFired = false;
      el.addEventListener('hx-change', () => {
        eventFired = true;
      });
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      const label = shadowQuery(radioA, '.radio') as HTMLDivElement;
      label.click();
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });

    it('group re-enable restores individual radio disabled states', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A" disabled></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      const radioB = el.querySelector('hx-radio[value="b"]') as HxRadio;

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
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A" disabled></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      const radioB = el.querySelector('hx-radio[value="b"]') as HxRadio;
      expect(radioA.disabled).toBe(true);
      expect(radioB.disabled).toBe(false);
    });
  });

  // ─── Slot Content (1) ───

  describe('Slot Content', () => {
    it('hx-radio default slot overrides label property', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="Fallback"><strong>Custom Label</strong></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as HxRadio;
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
      const el = await fixture<HxRadioGroup>(`<hx-radio-group label="Color" name="color">
        <hx-radio value="red" label="Red"></hx-radio>
        <hx-radio value="blue" label="Blue"></hx-radio>
      </hx-radio-group>`);
      const { violations } = await checkA11y(el, axeOptions);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with selection', async () => {
      const el =
        await fixture<HxRadioGroup>(`<hx-radio-group label="Color" name="color" value="red">
        <hx-radio value="red" label="Red"></hx-radio>
        <hx-radio value="blue" label="Blue"></hx-radio>
      </hx-radio-group>`);
      const { violations } = await checkA11y(el, axeOptions);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el =
        await fixture<HxRadioGroup>(`<hx-radio-group label="Color" name="color" error="Required">
        <hx-radio value="red" label="Red"></hx-radio>
        <hx-radio value="blue" label="Blue"></hx-radio>
      </hx-radio-group>`);
      const { violations } = await checkA11y(el, axeOptions);
      expect(violations).toEqual([]);
    });
  });

  // ─── Keyboard: disabled radios are skipped by ArrowDown ───

  describe('Keyboard: disabled radio skipping', () => {
    it('ArrowDown skips disabled radios to find next enabled radio', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B" disabled></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const event = await eventPromise;
      // Should skip the disabled "b" and select "c"
      expect(event.detail.value).toBe('c');
    });
  });

  // ─── hx-radio value property (2) ───

  describe('hx-radio: value property', () => {
    it('hx-radio value is reflected as attribute', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="alpha" label="Alpha"></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as HxRadio;
      expect(radio.getAttribute('value')).toBe('alpha');
    });

    it('hx-radio disabled attribute reflects to host', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A" disabled></hx-radio>
        </hx-radio-group>
      `);
      const radio = el.querySelector('hx-radio') as HxRadio;
      expect(radio.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── hx-change: detail.value when changing selection (2) ───

  describe('hx-change: full detail shape', () => {
    it('hx-change detail.value matches the newly selected radio value', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioC = el.querySelector('hx-radio[value="c"]') as HxRadio;
      const label = shadowQuery(radioC, '.radio') as HTMLDivElement;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      label.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('c');
    });

    it('selecting a radio updates value property on the group', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioB = el.querySelector('hx-radio[value="b"]') as HxRadio;
      const label = shadowQuery(radioB, '.radio') as HTMLDivElement;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      label.click();
      await eventPromise;
      await el.updateComplete;
      expect(el.value).toBe('b');
    });
  });

  // ─── Keyboard handler early-return branches ───

  describe('Keyboard: handler early-return branches', () => {
    it('keydown returns early when there are no enabled radios', async () => {
      // All radios disabled — _getEnabledRadios returns [], handler returns at line 339.
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A" disabled></hx-radio>
          <hx-radio value="b" label="B" disabled></hx-radio>
        </hx-radio-group>
      `);
      let eventFired = false;
      el.addEventListener('hx-change', () => {
        eventFired = true;
      });
      // Dispatch on host so closest() does not find a radio either way.
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });

    it('keydown ignores keys outside the handled set without preventing default', async () => {
      // Hits the `if (!isHandledKey) return;` branch (line 352) — no preventDefault, no event.
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      let eventFired = false;
      el.addEventListener('hx-change', () => {
        eventFired = true;
      });
      const radioA = el.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      radioA.dispatchEvent(event);
      await el.updateComplete;
      expect(eventFired).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });

    it('ArrowDown dispatched on host (no radio target) falls back to checked-radio index', async () => {
      // Exercises the `enabledRadios.findIndex((radio) => radio.checked)` branch (line 375)
      // when closest('hx-radio') returns null. With value="b" checked, ArrowDown should
      // advance to "c".
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" value="b">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      // Dispatch directly on the host element — e.target is the host, not an hx-radio.
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('c');
    });
  });

  // ─── reportValidity (2) ───

  describe('reportValidity', () => {
    it('reportValidity returns false when required and no selection', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required and selection is made', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Test" required value="a">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      expect(el.reportValidity()).toBe(true);
    });
  });

  // ─── Slot projection ───

  describe('Slot projection', () => {
    it('projects radio elements into the default slot', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color" name="color">
          <hx-radio value="red" label="Red"></hx-radio>
          <hx-radio value="blue" label="Blue"></hx-radio>
        </hx-radio-group>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(2);
    });

    it('projects content into the error slot', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color" name="color"><span slot="error">Required</span></hx-radio-group>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="error"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Required');
    });

    it('projects content into the help-text slot', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color" name="color" help-text=" "><span slot="help-text">Choose one</span></hx-radio-group>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="help-text"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Choose one');
    });
  });

  // ─── ARIA delegation: host-elevated semantics (codex aria-group-2) ───

  describe('ARIA delegation: host semantics', () => {
    it('host carries role="radiogroup" via ElementInternals', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color"><hx-radio value="a" label="A"></hx-radio></hx-radio-group>`,
      );
      const internals = (el as RadioGroupTestHarness)._internals;
      expect(internals.role).toBe('radiogroup');
    });

    it('host ariaLabel mirrors the visible label so cross-shadow naming works', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Notification Channel"><hx-radio value="a" label="A"></hx-radio></hx-radio-group>`,
      );
      const internals = (el as RadioGroupTestHarness)._internals;
      expect(internals.ariaLabel).toBe('Notification Channel');
    });

    it('host aria-label attribute wins over the visible label', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Internal" aria-label="Public name"><hx-radio value="a" label="A"></hx-radio></hx-radio-group>`,
      );
      const internals = (el as RadioGroupTestHarness)._internals;
      expect(internals.ariaLabel).toBe('Public name');
    });

    it('host ariaOrientation reflects horizontal orientation', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color" orientation="horizontal"><hx-radio value="a" label="A"></hx-radio></hx-radio-group>`,
      );
      await el.updateComplete;
      const internals = (el as RadioGroupTestHarness)._internals;
      expect(internals.ariaOrientation).toBe('horizontal');
      // Inner fieldset also exposes the attribute so AT walking the shadow
      // tree sees a consistent orientation.
      const fieldset = shadowQuery<HTMLElement>(el, 'fieldset')!;
      expect(fieldset.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('host ariaInvalid is driven by validity, not visible error content', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color" required><hx-radio value="a" label="A"></hx-radio></hx-radio-group>`,
      );
      await el.updateComplete;
      const internals = (el as RadioGroupTestHarness)._internals;
      expect(internals.ariaInvalid).toBe('true');
    });

    it('persistent help-text container renders when only the slot has content', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color"><hx-radio value="a" label="A"></hx-radio><span slot="help-text">Pick wisely</span></hx-radio-group>`,
      );
      await el.updateComplete;
      const helpDiv = shadowQuery<HTMLElement>(el, '.fieldset__help-text')!;
      expect(helpDiv).toBeTruthy();
      expect(helpDiv.hasAttribute('hidden')).toBe(false);
      // Host carries the describedBy reference via internals; inner fieldset
      // does not duplicate it.
      const internals = (el as RadioGroupTestHarness)._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs).toContain(helpDiv);
      } else {
        const tokens = el.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
        expect(tokens).toContain(helpDiv.id);
      }
    });

    it('host ariaDescribedByElements orders help text before error', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color" help-text="Hint" error="Required"><hx-radio value="a" label="A"></hx-radio></hx-radio-group>`,
      );
      await el.updateComplete;
      const internals = (el as RadioGroupTestHarness)._internals;
      const helpDiv = shadowQuery<HTMLElement>(el, '.fieldset__help-text')!;
      const errorDiv = shadowQuery<HTMLElement>(el, '.fieldset__error')!;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs) {
        expect(refs.indexOf(helpDiv)).toBeLessThan(refs.indexOf(errorDiv));
      } else {
        const tokens = el.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
        expect(tokens.indexOf(helpDiv.id)).toBeLessThan(tokens.indexOf(errorDiv.id));
      }
    });

    it('error live region is persistent in the shadow tree', async () => {
      const el = await fixture<HxRadioGroup>(
        `<hx-radio-group label="Color"><hx-radio value="a" label="A"></hx-radio></hx-radio-group>`,
      );
      const errorDiv = shadowQuery<HTMLElement>(el, '.fieldset__error');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.getAttribute('role')).toBe('alert');
      expect(errorDiv?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Codex round-2 finding #3: slot reconciliation (3) ───

  describe('Slot mutations: value/formValue/validity reconciliation (round-2 F3)', () => {
    it('clears value, formValue, and re-validates when the selected radio is removed', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Color" name="color" required>
          <hx-radio value="red" label="Red"></hx-radio>
          <hx-radio value="blue" label="Blue"></hx-radio>
        </hx-radio-group>
      `);
      // Select 'red' through the API.
      el.value = 'red';
      await el.updateComplete;
      const internals = (el as RadioGroupTestHarness)._internals;
      expect(internals.validity.valid).toBe(true);

      // Remove the currently-selected radio.
      const red = el.querySelector('hx-radio[value="red"]') as HxRadio;
      red.remove();
      // Wait for slotchange + reactive cycle.
      await el.updateComplete;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await el.updateComplete;

      // value clears, validity re-runs (required + no value = invalid).
      expect(el.value).toBe('');
      expect(internals.validity.valid).toBe(false);
      expect(internals.validity.valueMissing).toBe(true);
    });

    it('adopts a newly-added pre-checked radio (value, formValue, validity)', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Color" name="color" required>
          <hx-radio value="red" label="Red"></hx-radio>
        </hx-radio-group>
      `);
      const internals = (el as RadioGroupTestHarness)._internals;
      // No selection → invalid.
      expect(el.value).toBe('');
      expect(internals.validity.valid).toBe(false);

      // Inject a new radio that is already checked.
      const blue = document.createElement('hx-radio') as HxRadio;
      blue.setAttribute('value', 'blue');
      blue.setAttribute('label', 'Blue');
      blue.checked = true;
      el.appendChild(blue);

      // Wait for slotchange + reactive cycle.
      await el.updateComplete;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await el.updateComplete;

      expect(el.value).toBe('blue');
      expect(internals.validity.valid).toBe(true);
    });

    it('treats the currently-selected radio as not-selected when it becomes disabled', async () => {
      const el = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Color" name="color" required>
          <hx-radio value="red" label="Red"></hx-radio>
          <hx-radio value="blue" label="Blue"></hx-radio>
        </hx-radio-group>
      `);
      el.value = 'red';
      await el.updateComplete;
      const internals = (el as RadioGroupTestHarness)._internals;
      expect(internals.validity.valid).toBe(true);

      // Disable the selected radio, then trigger slotchange by re-inserting
      // (the F3 reconciler runs on slot mutations — this simulates a parent
      // template re-render that swaps a now-disabled child back in).
      const red = el.querySelector('hx-radio[value="red"]') as HxRadio;
      red.disabled = true;
      red.remove();
      el.insertBefore(red, el.firstChild);

      await el.updateComplete;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await el.updateComplete;

      // The disabled radio is no longer treated as the selection — the
      // group's `value` collapses to '' and required-validity fails.
      expect(el.value).toBe('');
      expect(internals.validity.valid).toBe(false);
    });
  });
});
