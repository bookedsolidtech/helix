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

    it('trigger has aria-expanded="false" when calendar is closed', async () => {
      const el = await fixture<HelixDatePicker>('<hx-date-picker></hx-date-picker>');
      const trigger = getTriggerButton(el);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
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
      // Set min to the 15th of the current month being rendered.
      // We open without a set value, so view defaults to current month.
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const minDate = `${year}-${month}-15`;

      const el = await fixture<HelixDatePicker>(
        `<hx-date-picker min="${minDate}"></hx-date-picker>`,
      );
      await openCalendar(el);

      const days = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="day"]');
      // Day 1 should be before the min date and therefore disabled.
      const dayOne = Array.from(days).find((d) => d.dataset['day'] === '1');
      if (dayOne) {
        expect(dayOne.getAttribute('aria-disabled')).toBe('true');
      }
    });

    it('days after max have aria-disabled="true"', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const maxDate = `${year}-${month}-05`;

      const el = await fixture<HelixDatePicker>(
        `<hx-date-picker max="${maxDate}"></hx-date-picker>`,
      );
      await openCalendar(el);

      const days = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="day"]');
      // Find any day button with data-day > 5 — it must be aria-disabled.
      const dayAfterMax = Array.from(days).find((d) => Number(d.dataset['day']) > 5);
      if (dayAfterMax) {
        expect(dayAfterMax.getAttribute('aria-disabled')).toBe('true');
      }
    });

    it('clicking a disabled day does NOT fire hx-change', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const minDate = `${year}-${month}-20`;

      const el = await fixture<HelixDatePicker>(
        `<hx-date-picker min="${minDate}"></hx-date-picker>`,
      );
      await openCalendar(el);

      let eventFired = false;
      el.addEventListener('hx-change', () => {
        eventFired = true;
      });

      // Day 1 is before min-20, so it is disabled.
      const days = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="day"]');
      const dayOne = Array.from(days).find((d) => d.dataset['day'] === '1');
      if (dayOne) {
        dayOne.click();
        await el.updateComplete;
      }

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
    it('sets name attribute on the native input', async () => {
      const el = await fixture<HelixDatePicker>(
        '<hx-date-picker name="discharge-date"></hx-date-picker>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('name')).toBe('discharge-date');
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
});
