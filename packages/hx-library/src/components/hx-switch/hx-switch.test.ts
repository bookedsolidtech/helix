import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcSwitch } from './hx-switch.js';
import './index.js';

afterEach(cleanup);

describe('hx-switch', () => {
  // --- Rendering (4) ---

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a button with role="switch"', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      expect(track).toBeTruthy();
      expect(track?.tagName.toLowerCase()).toBe('button');
    });

    it('renders thumb inside track', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const thumb = shadowQuery(el, '.switch__thumb');
      expect(thumb).toBeTruthy();
    });

    it('exposes "switch" CSS part on container', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const switchPart = shadowQuery(el, '[part="switch"]');
      expect(switchPart).toBeTruthy();
    });
  });

  // --- Property: checked (4) ---

  describe('Property: checked', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      expect(el.checked).toBe(false);
    });

    it('reflects checked attribute', async () => {
      const el = await fixture<WcSwitch>('<hx-switch checked></hx-switch>');
      expect(el.checked).toBe(true);
      expect(el.hasAttribute('checked')).toBe(true);
    });

    it('sets aria-checked="true" when checked', async () => {
      const el = await fixture<WcSwitch>('<hx-switch checked></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      expect(track?.getAttribute('aria-checked')).toBe('true');
    });

    it('sets aria-checked="false" when unchecked', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      expect(track?.getAttribute('aria-checked')).toBe('false');
    });
  });

  // --- Property: disabled (3) ---

  describe('Property: disabled', () => {
    it('sets disabled on the track button', async () => {
      const el = await fixture<WcSwitch>('<hx-switch disabled></hx-switch>');
      const track = shadowQuery<HTMLButtonElement>(el, '.switch__track');
      expect(track?.disabled).toBe(true);
    });

    it('reflects disabled attribute on host', async () => {
      const el = await fixture<WcSwitch>('<hx-switch disabled></hx-switch>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not toggle when disabled', async () => {
      const el = await fixture<WcSwitch>('<hx-switch disabled></hx-switch>');
      const track = shadowQuery<HTMLButtonElement>(el, '.switch__track');
      track?.click();
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });
  });

  // --- Property: required (2) ---

  describe('Property: required', () => {
    it('shows required marker asterisk', async () => {
      const el = await fixture<WcSwitch>('<hx-switch label="Accept" required></hx-switch>');
      const marker = shadowQuery(el, '.switch__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });

    it('sets aria-required="true" on track', async () => {
      const el = await fixture<WcSwitch>('<hx-switch required></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      expect(track?.getAttribute('aria-required')).toBe('true');
    });
  });

  // --- Property: size (3) ---

  describe('Property: size', () => {
    it('defaults to md', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      expect(el.size).toBe('md');
    });

    it('reflects hx-size attribute for sm', async () => {
      const el = await fixture<WcSwitch>('<hx-switch hx-size="sm"></hx-switch>');
      expect(el.size).toBe('sm');
      expect(el.getAttribute('hx-size')).toBe('sm');
    });

    it('applies size class to container', async () => {
      const el = await fixture<WcSwitch>('<hx-switch hx-size="lg"></hx-switch>');
      const container = shadowQuery(el, '.switch');
      expect(container?.classList.contains('switch--lg')).toBe(true);
    });
  });

  // --- Property: label (3) ---

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<WcSwitch>('<hx-switch label="Dark mode"></hx-switch>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label?.textContent?.trim()).toContain('Dark mode');
    });

    it('label is clickable and toggles switch', async () => {
      const el = await fixture<WcSwitch>('<hx-switch label="Toggle me"></hx-switch>');
      const label = shadowQuery<HTMLElement>(el, '[part="label"]');
      label?.click();
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('track has aria-labelledby pointing to label id', async () => {
      const el = await fixture<WcSwitch>('<hx-switch label="Notifications"></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      const label = shadowQuery(el, '[part="label"]');
      expect(track?.getAttribute('aria-labelledby')).toBe(label?.id);
    });
  });

  // --- Property: error (4) ---

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<WcSwitch>('<hx-switch error="Must accept terms"></hx-switch>');
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Must accept terms');
    });

    it('error div uses role="alert" (implicit assertive live region)', async () => {
      const el = await fixture<WcSwitch>('<hx-switch error="Error"></hx-switch>');
      const errorDiv = shadowQuery(el, '.switch__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
      expect(errorDiv?.hasAttribute('aria-live')).toBe(false);
    });

    it('sets aria-invalid="true" on track', async () => {
      const el = await fixture<WcSwitch>('<hx-switch error="Error"></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      expect(track?.getAttribute('aria-invalid')).toBe('true');
    });

    it('error hides help text', async () => {
      const el = await fixture<WcSwitch>('<hx-switch error="Error" help-text="Help"></hx-switch>');
      const helpText = shadowQuery(el, '.switch__help-text');
      expect(helpText).toBeNull();
    });
  });

  // --- Property: helpText (2) ---

  describe('Property: helpText', () => {
    it('renders help text below switch', async () => {
      const el = await fixture<WcSwitch>('<hx-switch help-text="Toggle to enable"></hx-switch>');
      const helpText = shadowQuery(el, '.switch__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Toggle to enable');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<WcSwitch>('<hx-switch help-text="Help" error="Error"></hx-switch>');
      const helpText = shadowQuery(el, '.switch__help-text');
      expect(helpText).toBeNull();
    });
  });

  // --- Events (3) ---

  describe('Events', () => {
    it('dispatches hx-change on toggle', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      track?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change detail.checked reflects new state', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      track?.click();
      const event = await eventPromise;
      expect(event.detail.checked).toBe(true);
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      track?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // --- Slots (2) ---

  describe('Slots', () => {
    it('default slot overrides label prop text', async () => {
      const el = await fixture<WcSwitch>(
        '<hx-switch label="Prop Label"><strong>Slot Label</strong></hx-switch>',
      );
      const slotContent = el.querySelector('strong');
      expect(slotContent).toBeTruthy();
      expect(slotContent?.textContent).toBe('Slot Label');
    });

    it('slotted label content sets aria-labelledby on track', async () => {
      const el = await fixture<WcSwitch>(
        '<hx-switch><strong>Slotted Label</strong></hx-switch>',
      );
      await el.updateComplete;
      const track = shadowQuery(el, '[role="switch"]');
      const label = shadowQuery(el, '[part="label"]');
      expect(track?.getAttribute('aria-labelledby')).toBe(label?.id);
    });

    it('help-text slot renders', async () => {
      const el = await fixture<WcSwitch>(
        '<hx-switch help-text="default"><em slot="help-text">Custom help</em></hx-switch>',
      );
      const helpSlot = el.querySelector('[slot="help-text"]');
      expect(helpSlot).toBeTruthy();
      expect(helpSlot?.textContent).toBe('Custom help');
    });
  });

  // --- CSS Parts (4) ---

  describe('CSS Parts', () => {
    it('track part exposed', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery(el, '[part="track"]');
      expect(track).toBeTruthy();
    });

    it('thumb part exposed', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const thumb = shadowQuery(el, '[part="thumb"]');
      expect(thumb).toBeTruthy();
    });

    it('label part exposed', async () => {
      const el = await fixture<WcSwitch>('<hx-switch label="Test"></hx-switch>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('error part exposed', async () => {
      const el = await fixture<WcSwitch>('<hx-switch error="Error"></hx-switch>');
      const error = shadowQuery(el, '[part="error"]');
      expect(error).toBeTruthy();
    });
  });

  // --- Form (5) ---

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-switch') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-switch name="toggle"></hx-switch>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-switch') as WcSwitch;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets checked to false', async () => {
      const el = await fixture<WcSwitch>('<hx-switch checked></hx-switch>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('formStateRestoreCallback restores checked state', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      el.formStateRestoreCallback('on', 'restore');
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });
  });

  // --- Validation (6) ---

  describe('Validation', () => {
    it('checkValidity returns false when required + unchecked', async () => {
      const el = await fixture<WcSwitch>('<hx-switch required></hx-switch>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required + checked', async () => {
      const el = await fixture<WcSwitch>('<hx-switch required checked></hx-switch>');
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required + unchecked', async () => {
      const el = await fixture<WcSwitch>('<hx-switch required></hx-switch>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('reportValidity returns false when required + unchecked', async () => {
      const el = await fixture<WcSwitch>('<hx-switch required></hx-switch>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required + checked', async () => {
      const el = await fixture<WcSwitch>('<hx-switch required checked></hx-switch>');
      expect(el.reportValidity()).toBe(true);
    });

    it('validationMessage is set when required + unchecked', async () => {
      const el = await fixture<WcSwitch>('<hx-switch required></hx-switch>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });
  });

  // --- Keyboard (3) ---

  describe('Keyboard', () => {
    it('Space toggles the switch', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('Enter does not double-toggle (native button click handles it)', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('other keys do not toggle', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('disabled switch does not toggle on keyboard', async () => {
      const el = await fixture<WcSwitch>('<hx-switch disabled></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });
  });

  // --- Accessibility (4) ---

  describe('Accessibility', () => {
    it('uses role="switch" not role="checkbox"', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      expect(track).toBeTruthy();
      const checkbox = shadowQuery(el, '[role="checkbox"]');
      expect(checkbox).toBeNull();
    });

    it('aria-checked toggles with checked state', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      expect(track?.getAttribute('aria-checked')).toBe('false');
      el.checked = true;
      await el.updateComplete;
      expect(track?.getAttribute('aria-checked')).toBe('true');
    });

    it('aria-describedby references error ID when error set', async () => {
      const el = await fixture<WcSwitch>('<hx-switch error="Bad"></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      const errorDiv = shadowQuery(el, '.switch__error');
      const describedBy = track?.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv?.id);
    });

    it('aria-describedby references help text ID when helpText set', async () => {
      const el = await fixture<WcSwitch>('<hx-switch help-text="Some help"></hx-switch>');
      const track = shadowQuery(el, '[role="switch"]');
      const helpDiv = shadowQuery(el, '.switch__help-text');
      const describedBy = track?.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv?.id);
    });
  });

  // --- Property: value (2) ---

  describe('Property: value', () => {
    it('defaults to "on"', async () => {
      const el = await fixture<WcSwitch>('<hx-switch></hx-switch>');
      expect(el.value).toBe('on');
    });

    it('accepts custom value attribute', async () => {
      const el = await fixture<WcSwitch>('<hx-switch value="yes"></hx-switch>');
      expect(el.value).toBe('yes');
    });
  });

  // --- Property: name (1) ---

  describe('Property: name', () => {
    it('sets name property', async () => {
      const el = await fixture<WcSwitch>('<hx-switch name="toggle"></hx-switch>');
      expect(el.name).toBe('toggle');
    });
  });

  // --- Methods (1) ---

  describe('Methods', () => {
    it('focus() moves focus to track button', async () => {
      const el = await fixture<WcSwitch>('<hx-switch label="Test"></hx-switch>');
      await el.updateComplete;
      el.focus();
      const track = shadowQuery<HTMLButtonElement>(el, '.switch__track')!;
      expect(el.shadowRoot?.activeElement).toBe(track);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcSwitch>('<hx-switch label="Enable notifications"></hx-switch>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when checked', async () => {
      const el = await fixture<WcSwitch>(
        '<hx-switch label="Enable notifications" checked></hx-switch>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<WcSwitch>(
        '<hx-switch label="Enable notifications" disabled></hx-switch>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
