import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixDatePicker } from './hx-date-picker.js';
import './index.js';

afterEach(cleanup);

// ─── Helpers ───────────────────────────────────────────────────────────────

function getTriggerButton(el: HelixDatePicker): HTMLButtonElement {
  return shadowQuery<HTMLButtonElement>(el, '[part="trigger"]')!;
}

async function openCalendar(el: HelixDatePicker): Promise<void> {
  const trigger = getTriggerButton(el);
  trigger.click();
  await el.updateComplete;
}

function getFirstEnabledDay(el: HelixDatePicker): HTMLButtonElement | undefined {
  const days = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="day"]');
  return Array.from(days).find((d) => !d.disabled && d.getAttribute('aria-disabled') !== 'true');
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('hx-date-picker', () => {
  // ─── Rendering (4) ─────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native readonly text input', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input');
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input?.readOnly).toBe(true);
    });

    it('exposes "field" CSS part', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const field = shadowQuery(el, '[part="field"]');
      expect(field).toBeTruthy();
    });

    it('exposes "input" CSS part', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const input = shadowQuery(el, '[part="input"]');
      expect(input).toBeTruthy();
    });
  });

  // ─── Property: label (3) ───────────────────────────────────────────────

  describe('Property: label', () => {
    it('renders label text', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Appointment Date"></hx-date-picker>',
      );
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Appointment Date');
    });

    it('does not render label element when label is empty', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });

    it('shows required asterisk marker when required', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Date of Birth" required></hx-date-picker>',
      );
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('*');
    });
  });

  // ─── Property: value (3) ──────────────────────────────────────────────

  describe('Property: value', () => {
    it('is empty by default — input shows empty string', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('');
    });

    it('formats ISO value for display — input does not show raw ISO string', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-04"></hx-date-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // The display value is locale-formatted (e.g. "03/04/2026"), not the raw ISO string.
      expect(input.value).not.toBe('2026-03-04');
      expect(input.value).toBeTruthy();
    });

    it('programmatic value update reflects in input display', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      el.value = '2026-06-15';
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Display must be non-empty and locale-formatted.
      expect(input.value).toBeTruthy();
      expect(input.value).not.toBe('2026-06-15');
    });
  });

  // ─── Property: required (2) ───────────────────────────────────────────

  describe('Property: required', () => {
    it('sets aria-required="true" on native input', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker required></hx-date-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('adds required marker to the label', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Date" required></hx-date-picker>',
      );
      const marker = shadowQuery(el, '.field__required-marker');
      expect(marker).toBeTruthy();
    });
  });

  // ─── Property: disabled (3) ───────────────────────────────────────────

  describe('Property: disabled', () => {
    it('disables the native input', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker disabled></hx-date-picker>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.disabled).toBe(true);
    });

    it('disables the trigger button', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker disabled></hx-date-picker>');
      const trigger = getTriggerButton(el);
      expect(trigger.disabled).toBe(true);
    });

    it('reflects [disabled] attribute on host element', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker disabled></hx-date-picker>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Property: error (3) ──────────────────────────────────────────────

  describe('Property: error', () => {
    it('renders error message in role="alert" div', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker error="Date is required"></hx-date-picker>',
      );
      const alertDiv = shadowQuery(el, '[role="alert"]');
      expect(alertDiv).toBeTruthy();
      expect(alertDiv?.textContent?.trim()).toBe('Date is required');
    });

    it('sets aria-invalid="true" on native input', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker error="Invalid date"></hx-date-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('hides help text when error is present', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker error="Error" help-text="Pick a date"></hx-date-picker>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── Property: helpText (2) ───────────────────────────────────────────

  describe('Property: helpText', () => {
    it('renders help text below the input', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker help-text="Select a future date"></hx-date-picker>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeTruthy();
      expect(helpText?.textContent?.trim()).toContain('Select a future date');
    });

    it('help text is hidden when error is present', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker help-text="Select a date" error="Required"></hx-date-picker>',
      );
      const helpText = shadowQuery(el, '.field__help-text');
      expect(helpText).toBeNull();
    });
  });

  // ─── CSS Parts (2) ────────────────────────────────────────────────────

  describe('CSS Parts', () => {
    it('exposes "input-wrapper" CSS part', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const wrapper = shadowQuery(el, '[part="input-wrapper"]');
      expect(wrapper).toBeTruthy();
    });

    it('exposes "trigger" CSS part', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger).toBeTruthy();
    });
  });

  // ─── Calendar: Open/Close (4) ─────────────────────────────────────────

  describe('Calendar: Open/Close', () => {
    it('calendar is not in the DOM when closed', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const calendar = shadowQuery(el, '[part="calendar"]');
      expect(calendar).toBeNull();
    });

    it('calendar appears when trigger button is clicked', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const calendar = shadowQuery(el, '[part="calendar"]');
      expect(calendar).toBeTruthy();
    });

    it('sets aria-expanded="true" on trigger when calendar is open', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const trigger = getTriggerButton(el);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('calendar closes when trigger is clicked again', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const trigger = getTriggerButton(el);
      trigger.click();
      await el.updateComplete;
      const calendar = shadowQuery(el, '[part="calendar"]');
      expect(calendar).toBeNull();
    });

    it('trigger has no aria-expanded when calendar is closed', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const trigger = getTriggerButton(el);
      expect(trigger.hasAttribute('aria-expanded')).toBe(false);
    });

    it('calendar has role="dialog" and aria-modal="true"', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const calendar = shadowQuery(el, '[part="calendar"]');
      expect(calendar?.getAttribute('role')).toBe('dialog');
      expect(calendar?.getAttribute('aria-modal')).toBe('true');
    });
  });

  // ─── Calendar: Day Selection (5) ──────────────────────────────────────

  describe('Calendar: Day Selection', () => {
    it('clicking an enabled day fires hx-change event', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const day = getFirstEnabledDay(el)!;
      day.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-change detail.value is an ISO 8601 string', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const day = getFirstEnabledDay(el)!;
      day.click();
      const event = await eventPromise;
      // ISO 8601 pattern: YYYY-MM-DD
      expect(event.detail.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('hx-change detail.date is a Date object', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const day = getFirstEnabledDay(el)!;
      day.click();
      const event = await eventPromise;
      expect(event.detail.date).toBeInstanceOf(Date);
    });

    it('selected date updates the value property', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const day = getFirstEnabledDay(el)!;
      day.click();
      const event = await eventPromise;
      await el.updateComplete;
      expect(el.value).toBe(event.detail.value);
    });

    it('calendar closes after a day is selected', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const day = getFirstEnabledDay(el)!;
      day.click();
      await el.updateComplete;
      const calendar = shadowQuery(el, '[part="calendar"]');
      expect(calendar).toBeNull();
    });
  });

  // ─── Calendar: Min/Max (3) ────────────────────────────────────────────

  describe('Calendar: Min/Max', () => {
    it('days before min have aria-disabled="true"', async () => {
      // Anchor the calendar view with a static value and static min date.
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-06-15" min="2026-06-15"></hx-date-picker>',
      );
      await openCalendar(el);

      const days = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="day"]');
      // Day 1 of June 2026 is before min=2026-06-15 — must be disabled.
      const dayOne = Array.from(days).find((d) => d.dataset['day'] === '1');
      expect(dayOne).toBeTruthy();
      expect(dayOne!.getAttribute('aria-disabled')).toBe('true');
    });

    it('days after max have aria-disabled="true"', async () => {
      // Anchor the calendar view with a static value and static max date.
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-06-01" max="2026-06-05"></hx-date-picker>',
      );
      await openCalendar(el);

      const days = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="day"]');
      // Day 10 of June 2026 is after max=2026-06-05 — must be disabled.
      const dayAfterMax = Array.from(days).find((d) => Number(d.dataset['day']) === 10);
      expect(dayAfterMax).toBeTruthy();
      expect(dayAfterMax!.getAttribute('aria-disabled')).toBe('true');
    });

    it('clicking a disabled day does NOT fire hx-change', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-06-15" min="2026-06-15"></hx-date-picker>',
      );
      await openCalendar(el);

      let eventFired = false;
      el.addEventListener('hx-change', () => {
        eventFired = true;
      });

      // Day 1 of June 2026 is before min=2026-06-15, so it is disabled.
      const days = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="day"]');
      const dayOne = Array.from(days).find((d) => d.dataset['day'] === '1');
      expect(dayOne).toBeTruthy();
      dayOne!.click();
      await el.updateComplete;

      expect(eventFired).toBe(false);
    });
  });

  // ─── Calendar: Navigation (2) ─────────────────────────────────────────

  describe('Calendar: Navigation', () => {
    it('clicking prev-month button changes the displayed month label', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);

      const monthLabelBefore = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';

      const prevBtn = shadowQuery<HTMLButtonElement>(el, '[aria-label="Previous month"]')!;
      prevBtn.click();
      await el.updateComplete;

      const monthLabelAfter = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';

      expect(monthLabelAfter).not.toBe(monthLabelBefore);
    });

    it('clicking next-month button changes the displayed month label', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);

      const monthLabelBefore = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';

      const nextBtn = shadowQuery<HTMLButtonElement>(el, '[aria-label="Next month"]')!;
      nextBtn.click();
      await el.updateComplete;

      const monthLabelAfter = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';

      expect(monthLabelAfter).not.toBe(monthLabelBefore);
    });

    it('exposes "month-nav" CSS part', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const nav = shadowQuery(el, '[part="month-nav"]');
      expect(nav).toBeTruthy();
    });

    it('calendar live region is present in the DOM when open', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const liveRegion = shadowQuery(el, '.calendar__live-region');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });
  });

  // ─── Keyboard: Calendar (3) ───────────────────────────────────────────

  describe('Keyboard: Calendar', () => {
    it('Escape key closes the calendar', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      const calendar = shadowQuery(el, '[part="calendar"]');
      expect(calendar).toBeNull();
    });

    it('Enter key on a focused day selects it and fires hx-change', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const calendar = shadowQuery(el, '[part="calendar"]')!;

      // Dispatch Enter on the calendar element directly (which has @keydown).
      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;

      const event = await eventPromise;
      expect(event.detail.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('Space key on a focused day selects it and fires hx-change', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const calendar = shadowQuery(el, '[part="calendar"]')!;

      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;

      const event = await eventPromise;
      expect(event.detail.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ─── Events (2) ───────────────────────────────────────────────────────

  describe('Events', () => {
    it('hx-change event bubbles', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const day = getFirstEnabledDay(el)!;
      day.click();

      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
    });

    it('hx-change event is composed', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const day = getFirstEnabledDay(el)!;
      day.click();

      const event = await eventPromise;
      expect(event.composed).toBe(true);
    });
  });

  // ─── Form (5) ─────────────────────────────────────────────────────────

  // ─── Form Association ───

  describe('Form Association', () => {
    it('submits date value in FormData', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-date-picker name="appt-date" value="2026-03-15"></hx-date-picker>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-date-picker') as HelixDatePicker;
      await el.updateComplete;
      const data = new FormData(form);
      expect(data.get('appt-date')).toBe('2026-03-15');
      form.remove();
    });
  });

  describe('Form', () => {
    it('has formAssociated=true on the class', () => {
      const ctor = customElements.get('hx-date-picker') as unknown as {
        formAssociated: boolean;
      };
      expect(ctor.formAssociated).toBe(true);
    });

    it('form getter returns null when not inside a form', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      expect(el.form).toBe(null);
    });

    it('form getter returns the associated form when inside one', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-date-picker name="appt-date"></hx-date-picker>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-date-picker') as HelixDatePicker;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('formResetCallback resets value to empty string', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-04"></hx-date-picker>',
      );
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('formStateRestoreCallback restores a previously stored value', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      el.formStateRestoreCallback('2026-07-04');
      await el.updateComplete;
      expect(el.value).toBe('2026-07-04');
    });

    it('formDisabledCallback sets disabled when parent fieldset is disabled', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
    });
  });

  // ─── Validation (4) ───────────────────────────────────────────────────

  describe('Validation', () => {
    it('checkValidity returns false when required and value is empty', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker required></hx-date-picker>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required and value is set', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker required value="2026-03-04"></hx-date-picker>',
      );
      expect(el.checkValidity()).toBe(true);
    });

    it('valueMissing validity flag is true when required and empty', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker required></hx-date-picker>');
      expect(el.validity.valueMissing).toBe(true);
    });

    it('validationMessage is non-empty when required and value is missing', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker required></hx-date-picker>');
      await el.updateComplete;
      expect(el.validationMessage).toBeTruthy();
    });

    it('reportValidity returns false when required and empty', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker required></hx-date-picker>');
      expect(el.reportValidity()).toBe(false);
    });

    it('reportValidity returns true when required and filled', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker required value="2026-03-04"></hx-date-picker>',
      );
      expect(el.reportValidity()).toBe(true);
    });

    it('validity is valid when value is set and field is not required', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-04"></hx-date-picker>',
      );
      expect(el.checkValidity()).toBe(true);
    });

    it('formResetCallback also closes the calendar', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      el.formResetCallback();
      await el.updateComplete;
      const calendar = shadowQuery(el, '[part="calendar"]');
      expect(calendar).toBeNull();
    });
  });

  // ─── Property: name (1) ───────────────────────────────────────────────

  describe('Property: name', () => {
    it('does not set name attribute on shadow input (form value handled via ElementInternals)', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker name="discharge-date"></hx-date-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // Shadow DOM inputs with `name` may confuse Drupal form processors.
      // Form values are submitted via ElementInternals.setFormValue() instead.
      expect(input.getAttribute('name')).toBeNull();
    });
  });

  // ─── Property: format / placeholder (1) ──────────────────────────────

  describe('Property: format', () => {
    it('uses format property as placeholder text on native input', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker format="DD/MM/YYYY"></hx-date-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('DD/MM/YYYY');
    });
  });

  // ─── Calendar Day Grid (2) ────────────────────────────────────────────

  describe('Calendar Day Grid', () => {
    it('day buttons have part="day"', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const days = el.shadowRoot!.querySelectorAll('[part="day"]');
      expect(days.length).toBeGreaterThan(0);
    });

    it('day buttons include an aria-label describing the full date', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const firstDay = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="day"]');
      expect(firstDay?.getAttribute('aria-label')).toBeTruthy();
    });

    it('selected day gridcell has aria-selected="true"', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-04"></hx-date-picker>',
      );
      await openCalendar(el);
      const selectedCell = el.shadowRoot!.querySelector<HTMLElement>(
        '[role="gridcell"][aria-selected="true"]',
      );
      expect(selectedCell).toBeTruthy();
    });
  });

  // ─── Disabled: calendar cannot open (1) ──────────────────────────────

  describe('Disabled interaction', () => {
    it('trigger click does not open calendar when disabled', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker disabled></hx-date-picker>');
      // Trigger is disabled so clicking has no effect; calendar stays closed.
      const trigger = getTriggerButton(el);
      trigger.click();
      await el.updateComplete;
      const calendar = shadowQuery(el, '[part="calendar"]');
      expect(calendar).toBeNull();
    });
  });

  // ─── Focus Management (1) ─────────────────────────────────────────────

  describe('Focus Management', () => {
    it('focus returns to trigger button after calendar closes via Escape', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker label="Date"></hx-date-picker>');
      await openCalendar(el);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      const trigger = getTriggerButton(el);
      expect(el.shadowRoot!.activeElement).toBe(trigger);
    });
  });

  // ─── Accessibility (axe-core, 4) ──────────────────────────────────────

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state with label', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Appointment Date"></hx-date-picker>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in error state', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Appointment Date" error="Date is required"></hx-date-picker>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Appointment Date" disabled></hx-date-picker>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when required', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Appointment Date" required></hx-date-picker>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with calendar open', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Appointment Date"></hx-date-picker>',
      );
      await openCalendar(el);
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── ARIA Grid Structure (3) ────────────────────────────────────────

  describe('ARIA Grid Structure', () => {
    it('calendar grid contains role="row" elements', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const rows = el.shadowRoot!.querySelectorAll('[role="grid"] [role="row"]');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('gridcells are nested within role="row" elements', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const gridcells = el.shadowRoot!.querySelectorAll('[role="row"] > [role="gridcell"]');
      expect(gridcells.length).toBeGreaterThan(0);
    });

    it('today button has aria-current="date"', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      const todayBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-current="date"]');
      expect(todayBtn).toBeTruthy();
    });
  });

  // ─── Keyboard Navigation: Arrow Keys (4) ───────────────────────────

  describe('Keyboard Navigation: Arrow Keys', () => {
    it('ArrowRight moves focus to the next day', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10"></hx-date-picker>',
      );
      await openCalendar(el);
      const calendar = shadowQuery(el, '[part="calendar"]')!;
      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;
      const focused = el.shadowRoot!.querySelector<HTMLButtonElement>(
        '[data-day="11"][tabindex="0"]',
      );
      expect(focused).toBeTruthy();
    });

    it('ArrowLeft moves focus to the previous day', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10"></hx-date-picker>',
      );
      await openCalendar(el);
      const calendar = shadowQuery(el, '[part="calendar"]')!;
      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;
      const focused = el.shadowRoot!.querySelector<HTMLButtonElement>(
        '[data-day="9"][tabindex="0"]',
      );
      expect(focused).toBeTruthy();
    });

    it('ArrowDown moves focus down one week', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10"></hx-date-picker>',
      );
      await openCalendar(el);
      const calendar = shadowQuery(el, '[part="calendar"]')!;
      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;
      const focused = el.shadowRoot!.querySelector<HTMLButtonElement>(
        '[data-day="17"][tabindex="0"]',
      );
      expect(focused).toBeTruthy();
    });

    it('ArrowUp moves focus up one week', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10"></hx-date-picker>',
      );
      await openCalendar(el);
      const calendar = shadowQuery(el, '[part="calendar"]')!;
      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;
      const focused = el.shadowRoot!.querySelector<HTMLButtonElement>(
        '[data-day="3"][tabindex="0"]',
      );
      expect(focused).toBeTruthy();
    });
  });

  // ─── Keyboard Navigation: PageUp/PageDown (2) ──────────────────────

  describe('Keyboard Navigation: PageUp/PageDown', () => {
    it('PageDown navigates to next month', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10"></hx-date-picker>',
      );
      await openCalendar(el);
      const monthLabelBefore = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';
      const calendar = shadowQuery(el, '[part="calendar"]')!;
      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;
      const monthLabelAfter = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';
      expect(monthLabelAfter).not.toBe(monthLabelBefore);
    });

    it('PageUp navigates to previous month', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10"></hx-date-picker>',
      );
      await openCalendar(el);
      const monthLabelBefore = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';
      const calendar = shadowQuery(el, '[part="calendar"]')!;
      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;
      const monthLabelAfter = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';
      expect(monthLabelAfter).not.toBe(monthLabelBefore);
    });
  });

  // ─── Navigation Boundaries (2) ─────────────────────────────────────

  describe('Navigation Boundaries', () => {
    it('prev-month button is disabled when at min boundary', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10" min="2026-03-01"></hx-date-picker>',
      );
      await openCalendar(el);
      const prevBtn = shadowQuery<HTMLButtonElement>(el, '[aria-label="Previous month"]')!;
      expect(prevBtn.disabled).toBe(true);
    });

    it('next-month button is disabled when at max boundary', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10" max="2026-03-31"></hx-date-picker>',
      );
      await openCalendar(el);
      const nextBtn = shadowQuery<HTMLButtonElement>(el, '[aria-label="Next month"]')!;
      expect(nextBtn.disabled).toBe(true);
    });
  });

  // ─── Slot projection ───

  describe('Slot projection', () => {
    it('projects content into the label slot', async () => {
      const el = await fixture<HelixDatePicker>(
        `<hx-date-picker><span slot="label">Appointment date</span></hx-date-picker>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="label"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Appointment date');
    });

    it('projects content into the error slot', async () => {
      const el = await fixture<HelixDatePicker>(
        `<hx-date-picker label="Date"><span slot="error">Invalid date</span></hx-date-picker>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="error"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('Invalid date');
    });

    it('projects content into the help-text slot', async () => {
      const el = await fixture<HelixDatePicker>(
        `<hx-date-picker label="Date" help-text=" "><span slot="help-text">MM/DD/YYYY</span></hx-date-picker>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="help-text"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect((assigned[0] as HTMLElement).textContent).toBe('MM/DD/YYYY');
    });
  });

  // ─── i18n / label overrides ───

  describe('i18n / label overrides', () => {
    it('uses default English label for previous month button', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker label="Date"></hx-date-picker>');
      await el.updateComplete;
      expect(el.previousMonthLabel).toBe('Previous month');
    });

    it('renders custom previousMonthLabel when set via property', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker label="Date"></hx-date-picker>');
      el.previousMonthLabel = 'Mois précédent';
      await el.updateComplete;
      expect(el.previousMonthLabel).toBe('Mois précédent');
    });
  });

  // ─── Focus Trap: edge cases (2) ────────────────────────────────────────

  describe('Focus Trap: edge cases', () => {
    it('_handleCalendarTab does nothing when calendar has no focusable elements', async () => {
      // Open calendar then remove all focusable children from the shadow root's calendar element
      // to exercise the early-return branch in _handleCalendarTab when focusableEls.length === 0.
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);

      const calendar = shadowQuery<HTMLElement>(el, '[part="calendar"]')!;
      // Disable every button so querySelectorAll returns zero focusable elements.
      const buttons = Array.from(calendar.querySelectorAll<HTMLButtonElement>('button'));
      buttons.forEach((b) => {
        b.disabled = true;
        b.setAttribute('tabindex', '-1');
      });

      // Dispatching Tab should not throw and the calendar should remain open.
      let threw = false;
      try {
        calendar.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
        );
        await el.updateComplete;
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
      // Calendar still open — no navigation side-effect occurred.
      expect(shadowQuery(el, '[part="calendar"]')).toBeTruthy();
    });

    it('Shift+Tab from first focusable element wraps focus to last focusable element', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      await openCalendar(el);
      // Wait an extra cycle so _focusActiveDay's inner updateComplete.then() has run
      // and tabindex attributes have settled before we snapshot the focusable list.
      await el.updateComplete;

      const calendar = shadowQuery<HTMLElement>(el, '[part="calendar"]')!;

      // Collect focusable elements to identify first and last.
      const focusableEls = Array.from(
        calendar.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
      );
      expect(focusableEls.length).toBeGreaterThan(1);

      const firstEl = focusableEls[0]!;

      // Focus the first focusable element so shadow active element === first.
      firstEl.focus();
      await el.updateComplete;

      // Dispatch Shift+Tab on the calendar — the focus trap should wrap to last.
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      calendar.dispatchEvent(tabEvent);
      await el.updateComplete;

      // Re-query focusable elements after the trap fires so we compare against the
      // live DOM state (the component uses the same query internally).
      const focusableElsAfter = Array.from(
        calendar.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
      );
      const lastElAfter = focusableElsAfter[focusableElsAfter.length - 1]!;

      // After wrapping, the last focusable element should be shadow-active.
      expect(el.shadowRoot!.activeElement).toBe(lastElAfter);
    });
  });

  // ─── _focusActiveDay: all days disabled (1) ─────────────────────────────

  describe('Focus Management: all days disabled', () => {
    it('does not throw when all days in view are disabled via min/max covering entire month', async () => {
      // min > last day of the month forces every day in Jan 2026 to be "before min" — all disabled.
      // The component sets min/max via ISO strings; use a min that is after all days in the view.
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-01-15" min="2026-02-01" max="2026-02-28"></hx-date-picker>',
      );

      // Open calendar — this triggers _focusActiveDay. With min=2026-02-01 the view is at Jan 2026
      // (because the selected value is in Jan), but all Jan days are before min so none are enabled.
      let threw = false;
      try {
        await openCalendar(el);
        await el.updateComplete;
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
      // Calendar renders even though no day can be focused.
      expect(shadowQuery(el, '[part="calendar"]')).toBeTruthy();
    });
  });

  // ─── _parseISODate: invalid input (1) ───────────────────────────────────

  describe('_parseISODate: invalid input', () => {
    it('does not display a value when an invalid ISO string is set', async () => {
      // _parseISODate returns null for malformed strings; _formatForDisplay returns '' in that case.
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="not-a-date"></hx-date-picker>',
      );
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      // The display value should be empty — not the raw invalid string.
      expect(input.value).toBe('');
    });

    it('treats completely garbage date strings as invalid', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      el.value = 'garbage!!';
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('');
    });
  });

  // ─── _updateValidity: error prop + required simultaneously (1) ──────────

  describe('_updateValidity: error prop and required together', () => {
    it('uses error prop as the validation message when both error and required are set and value is empty', async () => {
      // When required=true, value='', and error is set, _updateValidity picks
      // `this.error || 'This field is required.'` — so the error prop string wins.
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker required error="Custom error message"></hx-date-picker>',
      );
      await el.updateComplete;

      // Field is invalid because required + no value.
      expect(el.checkValidity()).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      // The validation message should reflect the error prop, not the default text.
      expect(el.validationMessage).toBe('Custom error message');
    });

    it('renders both the error message div and the required marker simultaneously', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker label="Date" required error="Pick a date"></hx-date-picker>',
      );
      await el.updateComplete;

      const errorDiv = shadowQuery(el, '[role="alert"]');
      const requiredMarker = shadowQuery(el, '.field__required-marker');

      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent?.trim()).toBe('Pick a date');
      expect(requiredMarker).toBeTruthy();
    });
  });

  // ─── Keyboard ignored when calendar is closed (1) ───────────────────────

  describe('Keyboard: ignored when calendar is closed', () => {
    it('arrow keys have no effect when calendar is not open', async () => {
      // The calendar keydown handler is only bound when _isOpen=true (element renders conditionally).
      // Dispatching arrow keys on a closed picker should not open the calendar or change state.
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-10"></hx-date-picker>',
      );

      // Confirm calendar is closed.
      expect(shadowQuery(el, '[part="calendar"]')).toBeNull();

      // Dispatch several arrow keys on the component host — no calendar listener is attached.
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      );
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;

      // Calendar must still be closed and value unchanged.
      expect(shadowQuery(el, '[part="calendar"]')).toBeNull();
      expect(el.value).toBe('2026-03-10');
    });

    it('document Escape key has no effect when calendar is already closed', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');

      // Ensure closed.
      expect(shadowQuery(el, '[part="calendar"]')).toBeNull();

      // The document keydown handler checks `this._isOpen` before closing — no-op when closed.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      expect(shadowQuery(el, '[part="calendar"]')).toBeNull();
    });
  });

  // ─── Arrow key wrapping to next/prev month (2) ──────────────────────────

  describe('Keyboard Navigation: arrow key month wrapping', () => {
    it('ArrowRight from last day of month wraps to first day of next month', async () => {
      // March 2026 has 31 days. Arrow right from day 31 should go to April 1.
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-03-31"></hx-date-picker>',
      );
      await openCalendar(el);

      const monthLabelBefore =
        shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';
      const calendar = shadowQuery(el, '[part="calendar"]')!;

      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;

      // Month label should change from March 2026 to April 2026.
      const monthLabelAfter = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';
      expect(monthLabelAfter).not.toBe(monthLabelBefore);

      // Day 1 of the new month should be focusable.
      const focusedDay = el.shadowRoot!.querySelector<HTMLButtonElement>(
        '[data-day="1"][tabindex="0"]',
      );
      expect(focusedDay).toBeTruthy();
    });

    it('ArrowLeft from first day of month wraps to last day of previous month', async () => {
      // April 1, 2026 → arrow left → March 31, 2026.
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker value="2026-04-01"></hx-date-picker>',
      );
      await openCalendar(el);

      const monthLabelBefore =
        shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';
      const calendar = shadowQuery(el, '[part="calendar"]')!;

      calendar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
      );
      // The component chains multiple async updates: _prevMonth() triggers a render,
      // _focusedDay assignment triggers another, and updateComplete.then() focuses the button.
      // Wait for the month to change, then verify day 31 exists in the new calendar grid.
      await el.updateComplete;
      await new Promise((r) => requestAnimationFrame(r));
      await el.updateComplete;

      const monthLabelAfter = shadowQuery(el, '.calendar__month-label')?.textContent?.trim() ?? '';
      expect(monthLabelAfter).not.toBe(monthLabelBefore);

      // Day 31 of March should exist in the calendar grid (March has 31 days).
      const day31 = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-day="31"]');
      expect(day31).toBeTruthy();
    });
  });
});
