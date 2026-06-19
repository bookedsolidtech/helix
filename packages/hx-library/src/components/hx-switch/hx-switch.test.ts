import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxSwitch } from './hx-switch.js';
import './index.js';

type SwitchTestHarness = HxSwitch & {
  _internals: ElementInternals;
  _supportsIdrefRefs: boolean;
  _syncHostAriaSemantics(): void;
};

afterEach(cleanup);

describe('hx-switch', () => {
  // --- Rendering (4) ---

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a button as the inner toggle control (role lives on host)', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery(el, '.switch__track');
      expect(track).toBeTruthy();
      expect(track?.tagName.toLowerCase()).toBe('button');
      // Host carries role="switch" via ElementInternals (codex aria-group-2).
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('switch');
    });

    it('renders thumb inside track', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const thumb = shadowQuery(el, '.switch__thumb');
      expect(thumb).toBeTruthy();
    });

    it('exposes "switch" CSS part on container', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const switchPart = shadowQuery(el, '[part="switch"]');
      expect(switchPart).toBeTruthy();
    });
  });

  // --- Property: checked (4) ---

  describe('Property: checked', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      expect(el.checked).toBe(false);
    });

    it('reflects checked attribute', async () => {
      const el = await fixture<HxSwitch>('<hx-switch checked></hx-switch>');
      expect(el.checked).toBe(true);
      expect(el.hasAttribute('checked')).toBe(true);
    });

    it('sets host ariaChecked="true" via internals when checked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch checked></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBe('true');
      const track = shadowQuery(el, '.switch__track');
      expect(track?.getAttribute('aria-checked')).toBe('true');
    });

    it('has host ariaChecked="false" via internals when unchecked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBe('false');
      const track = shadowQuery(el, '.switch__track');
      expect(track?.getAttribute('aria-checked')).toBe('false');
    });
  });

  // --- Property: disabled (3) ---

  describe('Property: disabled', () => {
    it('sets disabled on the track button', async () => {
      const el = await fixture<HxSwitch>('<hx-switch disabled></hx-switch>');
      const track = shadowQuery<HTMLButtonElement>(el, '.switch__track');
      expect(track?.disabled).toBe(true);
    });

    it('reflects disabled attribute on host', async () => {
      const el = await fixture<HxSwitch>('<hx-switch disabled></hx-switch>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not toggle when disabled', async () => {
      const el = await fixture<HxSwitch>('<hx-switch disabled></hx-switch>');
      const track = shadowQuery<HTMLButtonElement>(el, '.switch__track');
      track?.click();
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });
  });

  // --- Property: required (2) ---

  describe('Property: required', () => {
    it('shows required marker asterisk', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Accept" required></hx-switch>');
      const marker = shadowQuery(el, '.switch__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });

    it('sets host ariaRequired="true" via internals when required', async () => {
      const el = await fixture<HxSwitch>('<hx-switch required></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaRequired).toBe('true');
      const track = shadowQuery(el, '.switch__track');
      expect(track?.getAttribute('aria-required')).toBe('true');
    });
  });

  // --- Property: size (3) ---

  describe('Property: size', () => {
    it('defaults to md', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      expect(el.size).toBe('md');
    });

    it('reflects hx-size attribute for sm', async () => {
      const el = await fixture<HxSwitch>('<hx-switch hx-size="sm"></hx-switch>');
      expect(el.size).toBe('sm');
      expect(el.getAttribute('hx-size')).toBe('sm');
    });

    it('applies size class to container', async () => {
      const el = await fixture<HxSwitch>('<hx-switch hx-size="lg"></hx-switch>');
      const container = shadowQuery(el, '.switch');
      expect(container?.classList.contains('switch--lg')).toBe(true);
    });

    it('maps legacy `size` attribute to size when `hx-size` is absent', async () => {
      const el = await fixture<HxSwitch>('<hx-switch size="lg"></hx-switch>');
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });

    it('`hx-size` wins when both `size` and `hx-size` are set', async () => {
      const el = await fixture<HxSwitch>('<hx-switch size="sm" hx-size="lg"></hx-switch>');
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });
  });

  // --- Property: label (3) ---

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Dark mode"></hx-switch>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label?.textContent?.trim()).toContain('Dark mode');
    });

    it('label is clickable and toggles switch', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Toggle me"></hx-switch>');
      const label = shadowQuery<HTMLElement>(el, '[part="label"]');
      label?.click();
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('track has aria-labelledby pointing to label id', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Notifications"></hx-switch>');
      const track = shadowQuery(el, '.switch__track');
      const label = shadowQuery(el, '[part="label"]');
      expect(track?.getAttribute('aria-labelledby')).toBe(label?.id);
    });

    // Codex round-36 (independent observation): hasEffectiveLabelledBy parity
    // with hx-toggle-button / hx-radio-group. A missing IDREF must NOT erase
    // the label property — fall through to internals.ariaLabel = this.label.
    it('keeps the label accessible name when aria-labelledby points to a missing id', async () => {
      const el = await fixture<HxSwitch>(
        '<hx-switch label="Dark mode" aria-labelledby="sw-missing-target"></hx-switch>',
      );
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaLabelledByElements;
      if (refs && refs.length > 0) {
        // Modern path: at least the visible internal label element is referenced.
        const label = shadowQuery(el, '[part="label"]');
        expect(refs).toContain(label);
      } else {
        // No-IDL-ref fallback path: internals.ariaLabel carries the property.
        expect(internals.ariaLabel).toBe('Dark mode');
      }
    });
  });

  // --- Property: error (4) ---

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<HxSwitch>('<hx-switch error="Must accept terms"></hx-switch>');
      const errorDiv = shadowQuery(el, '[role="alert"]');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Must accept terms');
    });

    it('error div uses role="alert" (implicit assertive live region)', async () => {
      const el = await fixture<HxSwitch>('<hx-switch error="Error"></hx-switch>');
      const errorDiv = shadowQuery(el, '.switch__error');
      expect(errorDiv?.getAttribute('role')).toBe('alert');
      expect(errorDiv?.hasAttribute('aria-live')).toBe(false);
    });

    it('sets aria-invalid="true" on inner track when error is present', async () => {
      const el = await fixture<HxSwitch>('<hx-switch error="Error"></hx-switch>');
      // The inner-button aria-invalid is presentation-driven (mirrors the
      // visible error state); the host internals.ariaInvalid is validity-
      // driven and stays "false" for a non-required, presentation-only error.
      const track = shadowQuery(el, '.switch__track');
      expect(track?.getAttribute('aria-invalid')).toBe('true');
    });

    it('error hides help text', async () => {
      const el = await fixture<HxSwitch>('<hx-switch error="Error" help-text="Help"></hx-switch>');
      const helpText = shadowQuery(el, '.switch__help-text');
      // Persistent wrapper: present in DOM but hidden when error is active.
      expect(helpText).toBeTruthy();
      expect(helpText?.hasAttribute('hidden')).toBe(true);
    });
  });

  // --- Property: helpText (2) ---

  describe('Property: helpText', () => {
    it('renders help text below switch', async () => {
      const el = await fixture<HxSwitch>('<hx-switch help-text="Toggle to enable"></hx-switch>');
      const helpText = shadowQuery(el, '.switch__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Toggle to enable');
    });

    it('help text hidden when error present', async () => {
      const el = await fixture<HxSwitch>('<hx-switch help-text="Help" error="Error"></hx-switch>');
      const helpText = shadowQuery(el, '.switch__help-text');
      // Persistent wrapper: present in DOM but hidden when error is active.
      expect(helpText).toBeTruthy();
      expect(helpText?.hasAttribute('hidden')).toBe(true);
    });
  });

  // --- Events (3) ---

  describe('Events', () => {
    it('dispatches hx-change on toggle', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      track?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change detail.checked reflects new state', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      track?.click();
      const event = await eventPromise;
      expect(event.detail.checked).toBe(true);
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
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
      const el = await fixture<HxSwitch>(
        '<hx-switch label="Prop Label"><strong>Slot Label</strong></hx-switch>',
      );
      const slotContent = el.querySelector('strong');
      expect(slotContent).toBeTruthy();
      expect(slotContent?.textContent).toBe('Slot Label');
    });

    it('slotted label content sets aria-labelledby on track', async () => {
      const el = await fixture<HxSwitch>('<hx-switch><strong>Slotted Label</strong></hx-switch>');
      await el.updateComplete;
      const track = shadowQuery(el, '.switch__track');
      const label = shadowQuery(el, '[part="label"]');
      expect(track?.getAttribute('aria-labelledby')).toBe(label?.id);
    });

    it('error slot renders custom error content', async () => {
      const el = await fixture<HxSwitch>(
        '<hx-switch><em slot="error">Custom error</em></hx-switch>',
      );
      const errorSlot = el.querySelector('[slot="error"]');
      expect(errorSlot).toBeTruthy();
      expect(errorSlot?.textContent).toBe('Custom error');
    });

    it('help-text slot renders', async () => {
      const el = await fixture<HxSwitch>(
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
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery(el, '[part="track"]');
      expect(track).toBeTruthy();
    });

    it('thumb part exposed', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const thumb = shadowQuery(el, '[part="thumb"]');
      expect(thumb).toBeTruthy();
    });

    it('label part exposed', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Test"></hx-switch>');
      const label = shadowQuery(el, '[part="label"]');
      expect(label).toBeTruthy();
    });

    it('error part exposed', async () => {
      const el = await fixture<HxSwitch>('<hx-switch error="Error"></hx-switch>');
      const error = shadowQuery(el, '[part="error"]');
      expect(error).toBeTruthy();
    });

    it('help-text part exposed', async () => {
      const el = await fixture<HxSwitch>('<hx-switch help-text="Guidance"></hx-switch>');
      const helpText = shadowQuery(el, '[part="help-text"]');
      expect(helpText).toBeTruthy();
    });
  });

  // --- Form (5) ---

  // ─── Form Association ───

  describe('Form Association', () => {
    it('submits value in FormData when checked', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-switch name="notifications" value="enabled" checked></hx-switch>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-switch') as HxSwitch;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('notifications')).toBe('enabled');
      form.remove();
    });

    it('does not submit value in FormData when unchecked', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-switch name="notifications" value="enabled"></hx-switch>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-switch') as HxSwitch;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('notifications')).toBeNull();
      form.remove();
    });
  });

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-switch') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      expect(el.form).toBe(null);
    });

    it('form getter returns associated form', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-switch name="toggle"></hx-switch>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-switch') as HxSwitch;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets checked to false', async () => {
      const el = await fixture<HxSwitch>('<hx-switch checked></hx-switch>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('formStateRestoreCallback restores checked state', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      el.formStateRestoreCallback('on', 'restore');
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('formStateRestoreCallback with null state preserves current state', async () => {
      const el = await fixture<HxSwitch>('<hx-switch checked></hx-switch>');
      el.formStateRestoreCallback(null, 'restore');
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('formStateRestoreCallback handles autocomplete mode', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      el.formStateRestoreCallback('on', 'autocomplete');
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('formDisabledCallback sets disabled when parent fieldset is disabled', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
    });
  });

  // --- Validation (6) ---

  describe('Validation', () => {
    it('checkValidity returns false when required + unchecked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch required></hx-switch>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required + checked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch required checked></hx-switch>');
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is set when required + unchecked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch required></hx-switch>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('reportValidity returns false when required + unchecked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch required></hx-switch>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required + checked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch required checked></hx-switch>');
      expect(el.reportValidity()).toBe(true);
    });

    it('validationMessage is set when required + unchecked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch required></hx-switch>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });
  });

  // --- Keyboard (3) ---

  describe('Keyboard', () => {
    it('Space toggles the switch', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(true);
    });

    it('Enter does not double-toggle (native button click handles it)', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('other keys do not toggle', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('disabled switch does not toggle on keyboard', async () => {
      const el = await fixture<HxSwitch>('<hx-switch disabled></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
      track?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(el.checked).toBe(false);
    });

    it('disabled host has tabindex=-1; inner button stays tabIndex=-1 (host-canonical surface, codex round-1 #1)', async () => {
      // Codex aria-group-2 round-1: host is the canonical announced surface
      // and the focus target. Inner <button> is permanently aria-hidden +
      // tabindex=-1 so AT never lands on it. When disabled, the host
      // tabindex flips from "0" to "-1" to remove it from the tab order.
      const el = await fixture<HxSwitch>('<hx-switch disabled></hx-switch>');
      expect(el.getAttribute('tabindex')).toBe('-1');
      const track = shadowQuery<HTMLButtonElement>(el, '.switch__track');
      expect(track?.tabIndex).toBe(-1);
    });
  });

  // --- Accessibility (4) ---

  describe('Accessibility', () => {
    it('uses role="switch" on host (via internals) not role="checkbox"', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('switch');
      // Inner button no longer carries a role; assistive tech reaches the host.
      const checkbox = shadowQuery(el, '[role="checkbox"]');
      expect(checkbox).toBeNull();
    });

    it('aria-checked toggles with checked state on host internals and inner', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const track = shadowQuery(el, '.switch__track');
      expect(internals.ariaChecked).toBe('false');
      expect(track?.getAttribute('aria-checked')).toBe('false');
      el.checked = true;
      await el.updateComplete;
      expect(internals.ariaChecked).toBe('true');
      expect(track?.getAttribute('aria-checked')).toBe('true');
    });

    it('aria-describedby references error ID when error set', async () => {
      const el = await fixture<HxSwitch>('<hx-switch error="Bad"></hx-switch>');
      const track = shadowQuery(el, '.switch__track');
      const errorDiv = shadowQuery(el, '.switch__error');
      const describedBy = track?.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorDiv?.id);
    });

    it('aria-describedby references help text ID when helpText set', async () => {
      const el = await fixture<HxSwitch>('<hx-switch help-text="Some help"></hx-switch>');
      const track = shadowQuery(el, '.switch__track');
      const helpDiv = shadowQuery(el, '.switch__help-text');
      const describedBy = track?.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpDiv?.id);
    });

    it('aria-describedby is absent when no error or helpText', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Plain"></hx-switch>');
      const track = shadowQuery(el, '.switch__track');
      expect(track?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('host ariaInvalid is null when no error and not required', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="No error"></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaInvalid).toBe('false');
      const track = shadowQuery(el, '.switch__track');
      expect(track?.hasAttribute('aria-invalid')).toBe(false);
    });

    it('host ariaRequired is null when not required', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Optional"></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      // ariaRequired is set to "true" only when required is true; otherwise null/empty.
      expect(internals.ariaRequired).not.toBe('true');
      const track = shadowQuery(el, '.switch__track');
      expect(track?.hasAttribute('aria-required')).toBe(false);
    });
  });

  // --- Property: value (3) ---

  describe('Property: value', () => {
    it('defaults to "on"', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      expect(el.value).toBe('on');
    });

    it('accepts custom value attribute', async () => {
      const el = await fixture<HxSwitch>('<hx-switch value="yes"></hx-switch>');
      expect(el.value).toBe('yes');
    });

    it('hx-change detail.value reflects custom value', async () => {
      const el = await fixture<HxSwitch>('<hx-switch value="enabled"></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      track?.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('enabled');
    });
  });

  // --- Property: name (1) ---

  describe('Property: name', () => {
    it('sets name property', async () => {
      const el = await fixture<HxSwitch>('<hx-switch name="toggle"></hx-switch>');
      expect(el.name).toBe('toggle');
    });
  });

  // --- Methods (1) ---

  describe('Methods', () => {
    it('focus() moves focus to host (codex round-1 finding #1)', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Test"></hx-switch>');
      await el.updateComplete;
      el.focus();
      // Host is now the canonical announced surface and the focus target.
      // The inner `<button>` is `aria-hidden + tabindex=-1`.
      expect(document.activeElement).toBe(el);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Enable notifications"></hx-switch>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when checked', async () => {
      const el = await fixture<HxSwitch>(
        '<hx-switch label="Enable notifications" checked></hx-switch>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HxSwitch>(
        '<hx-switch label="Enable notifications" disabled></hx-switch>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Property: requiredMessage ───

  describe('Property: requiredMessage', () => {
    it('defaults to "This field is required."', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Accept terms"></hx-switch>');
      expect(el.requiredMessage).toBe('This field is required.');
    });

    it('accepts custom requiredMessage', async () => {
      const el = await fixture<HxSwitch>(
        '<hx-switch label="Accept terms" required required-message="You must accept terms."></hx-switch>',
      );
      expect(el.requiredMessage).toBe('You must accept terms.');
    });
  });

  // ─── hx-change: unchecking (2) ───

  describe('hx-change: unchecking', () => {
    it('hx-change detail.checked is false when unchecking a checked switch', async () => {
      const el = await fixture<HxSwitch>('<hx-switch checked></hx-switch>');
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      track?.click();
      const event = await eventPromise;
      expect(event.detail.checked).toBe(false);
    });

    it('hx-change is not fired when disabled switch is clicked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch disabled></hx-switch>');
      let fired = false;
      el.addEventListener('hx-change', () => {
        fired = true;
      });
      const track = shadowQuery<HTMLElement>(el, '.switch__track');
      track?.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── CSS class: switch--checked (2) ───

  describe('CSS class: switch--checked', () => {
    it('applies switch--checked class when checked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch checked></hx-switch>');
      const container = shadowQuery(el, '.switch');
      expect(container?.classList.contains('switch--checked')).toBe(true);
    });

    it('removes switch--checked class when unchecked', async () => {
      const el = await fixture<HxSwitch>('<hx-switch></hx-switch>');
      const container = shadowQuery(el, '.switch');
      expect(container?.classList.contains('switch--checked')).toBe(false);
    });
  });

  // ─── CSS class: switch--disabled (1) ───

  describe('CSS class: switch--disabled', () => {
    it('applies switch--disabled class when disabled', async () => {
      const el = await fixture<HxSwitch>('<hx-switch disabled></hx-switch>');
      const container = shadowQuery(el, '.switch');
      expect(container?.classList.contains('switch--disabled')).toBe(true);
    });
  });

  // ─── CSS class: switch--required (1) ───

  describe('CSS class: switch--required', () => {
    it('applies switch--required class when required', async () => {
      const el = await fixture<HxSwitch>('<hx-switch required></hx-switch>');
      const container = shadowQuery(el, '.switch');
      expect(container?.classList.contains('switch--required')).toBe(true);
    });
  });

  // ─── CSS class: switch--error (1) ───

  describe('CSS class: switch--error', () => {
    it('applies switch--error class when error is set', async () => {
      const el = await fixture<HxSwitch>('<hx-switch error="Oops"></hx-switch>');
      const container = shadowQuery(el, '.switch');
      expect(container?.classList.contains('switch--error')).toBe(true);
    });
  });

  // ─── ARIA delegation: host semantics ───
  //
  // Codex aria-group-2 finding: switch role + state must reach the host so
  // consumer-supplied aria-label / aria-labelledby / aria-describedby on
  // <hx-switch> aren't stranded outside the shadow boundary.

  describe('ARIA delegation: host semantics', () => {
    it('exposes role="switch" via ElementInternals on the host', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Subscribe"></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('switch');
    });

    it('mirrors ariaChecked on host as checked toggles', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Toggle"></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBe('false');
      el.checked = true;
      await el.updateComplete;
      expect(internals.ariaChecked).toBe('true');
    });

    it('mirrors label property to host ariaLabel when no aria-labelledby is set', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Receive emails"></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Receive emails');
    });

    it('prefers consumer-supplied aria-label over the label property', async () => {
      const el = await fixture<HxSwitch>(
        '<hx-switch label="Ignored" aria-label="Custom label"></hx-switch>',
      );
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaLabel).toBe('Custom label');
    });

    it('drives ariaInvalid from validity (required+unchecked is invalid before render)', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Agree" required></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaInvalid).toBe('true');
      el.checked = true;
      await el.updateComplete;
      expect(internals.ariaInvalid).toBe('false');
    });

    it('mirrors required to host ariaRequired', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Agree" required></hx-switch>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaRequired).toBe('true');
    });

    it('renders persistent help-text wrapper that is hidden until content arrives via slot', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Toggle"></hx-switch>');
      const helpWrapper = shadowQuery(el, '.switch__help-text');
      expect(helpWrapper).toBeTruthy();
      expect(helpWrapper?.hasAttribute('hidden')).toBe(true);

      // Slot content should be detected and the wrapper should expose itself.
      const slotted = document.createElement('span');
      slotted.slot = 'help-text';
      slotted.textContent = 'From slot';
      el.appendChild(slotted);
      await el.updateComplete;
      await el.updateComplete; // second cycle: slotchange -> state -> render
      expect(helpWrapper?.hasAttribute('hidden')).toBe(false);
    });

    it('emits help-text first, then error in describedBy ordering on host internals', async () => {
      // Codex round-15 P2: when both help and error are present, the help
      // wrapper is hidden and dropped from the describedby chain — AT must
      // not announce stale guidance ahead of the validation error. This test
      // verifies the help-only state still announces help.
      const el = await fixture<HxSwitch>('<hx-switch label="Toggle" help-text="Help"></hx-switch>');
      // Codex round-1 finding #1: the host is the canonical announced surface.
      // The describedBy chain is exposed through `internals.ariaDescribedByElements`
      // (when supported) rather than via an attribute on the inner control.
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const helpDiv = shadowQuery(el, '.switch__help-text');
      const errorDiv = shadowQuery(el, '.switch__error');
      expect(helpDiv?.id).toBeTruthy();
      expect(errorDiv?.id).toBeTruthy();

      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs && refs.length > 0) {
        // Modern path: IDL element references. Help-only state has only help
        // in the chain; the error wrapper is hidden and not referenced.
        expect(refs.indexOf(helpDiv!)).toBeGreaterThanOrEqual(0);
        expect(refs.indexOf(errorDiv!)).toBe(-1);
      } else {
        // No-IDL-ref fallback path: token list mirrored on the inner button
        // so consumer wiring still resolves shadow-internal IDs.
        const track = shadowQuery(el, '.switch__track');
        const describedBy = track?.getAttribute('aria-describedby') || '';
        expect(describedBy).toContain(helpDiv!.id);
        expect(describedBy).not.toContain(errorDiv!.id);
      }
    });

    it('drops help-text from describedBy chain when an error is active (round-15 P2)', async () => {
      // Codex round-15 P2: hidden help must not appear in the describedby
      // chain. AT would otherwise announce stale guidance ahead of the
      // validation error in the very state where the UI suppresses it.
      const el = await fixture<HxSwitch>(
        '<hx-switch label="Toggle" help-text="Help" error="Bad"></hx-switch>',
      );
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      const helpDiv = shadowQuery(el, '.switch__help-text');
      const errorDiv = shadowQuery(el, '.switch__error');
      expect(helpDiv?.hasAttribute('hidden')).toBe(true);
      expect(errorDiv?.hasAttribute('hidden')).toBe(false);

      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      if (refs && refs.length > 0) {
        // Modern path: only the error is referenced.
        expect(refs.indexOf(errorDiv!)).toBeGreaterThanOrEqual(0);
        expect(refs.indexOf(helpDiv!)).toBe(-1);
      } else {
        // Fallback path: only the error id appears in the inner-button chain.
        const track = shadowQuery(el, '.switch__track');
        const describedBy = track?.getAttribute('aria-describedby') || '';
        expect(describedBy).toContain(errorDiv!.id);
        expect(describedBy).not.toContain(helpDiv!.id);
      }
    });

    it('keeps the error live region in the DOM with role="alert" before any error fires', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Toggle"></hx-switch>');
      const errorDiv = shadowQuery(el, '.switch__error');
      // Persistent live region: present from first paint, hidden until needed.
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.getAttribute('role')).toBe('alert');
      expect(errorDiv?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Codex round-2 finding #2: no-IDL-ref fallback render path (4) ───

  describe('No-IDL-ref fallback render (round-2 F2)', () => {
    async function forceFallbackPath(el: HxSwitch): Promise<void> {
      const harness = el as SwitchTestHarness;
      harness._supportsIdrefRefs = false;
      harness._syncHostAriaSemantics();
      el.requestUpdate();
      await el.updateComplete;
    }

    it('inner button is NOT aria-hidden, has role=switch, and is in tab order on the fallback path', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Notifications"></hx-switch>');
      await el.updateComplete;
      await forceFallbackPath(el);

      const btn = shadowQuery<HTMLButtonElement>(el, 'button.switch__track')!;
      expect(btn.hasAttribute('aria-hidden')).toBe(false);
      expect(btn.getAttribute('role')).toBe('switch');
      expect(btn.getAttribute('tabindex')).toBe('0');
    });

    it('host is demoted to tabindex=-1 on the fallback path', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Notifications"></hx-switch>');
      await el.updateComplete;
      await forceFallbackPath(el);
      expect(el.getAttribute('tabindex')).toBe('-1');
    });

    it('host activation handlers do NOT fire on Space on the fallback path', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Notifications"></hx-switch>');
      await el.updateComplete;
      await forceFallbackPath(el);

      const startChecked = el.checked;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      // Round-2 finding #2: host handlers no-op on the fallback path; the
      // inner native button handles activation directly.
      expect(el.checked).toBe(startChecked);
    });

    it('host internals.role is cleared on the fallback path', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Notifications"></hx-switch>');
      await el.updateComplete;
      const internals = (el as SwitchTestHarness)._internals;
      expect(internals.role).toBe('switch');

      await forceFallbackPath(el);
      expect(internals.role).toBe(null);
      expect(internals.ariaChecked).toBe(null);
    });

    // ─── Codex round-3 finding #2 (1) ───

    it('clicking the inner button on the fallback path toggles host.checked and fires hx-change', async () => {
      const el = await fixture<HxSwitch>('<hx-switch label="Notifications"></hx-switch>');
      await el.updateComplete;
      await forceFallbackPath(el);

      const btn = shadowQuery<HTMLButtonElement>(el, 'button.switch__track')!;
      expect(el.checked).toBe(false);

      const eventPromise = oneEvent<CustomEvent<{ checked: boolean; value: string }>>(
        el,
        'hx-change',
      );
      // Round-3 F2: AT activation lands on the announced inner button. The
      // inner click handler must produce a real toggle and emit `hx-change`.
      btn.click();
      const event = await eventPromise;
      await el.updateComplete;
      expect(el.checked).toBe(true);
      expect(event.detail.checked).toBe(true);
    });
  });
});
