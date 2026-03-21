import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import {
  fixture,
  shadowQuery,
  shadowQueryAll,
  oneEvent,
  cleanup,
  checkA11y,
} from '../../test-utils.js';
import { HelixRating } from './hx-rating.js';
import './index.js';

afterEach(cleanup);

describe('hx-rating', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixRating>('<hx-rating></hx-rating>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders base container with radiogroup role', async () => {
      const el = await fixture<HelixRating>('<hx-rating></hx-rating>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('role')).toBe('radiogroup');
    });

    it('renders correct number of symbol elements', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5"></hx-rating>');
      const symbols = shadowQueryAll(el, '[part="symbol"]');
      expect(symbols.length).toBe(5);
    });

    it('renders custom max stars', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="3"></hx-rating>');
      const symbols = shadowQueryAll(el, '[part="symbol"]');
      expect(symbols.length).toBe(3);
    });
  });

  // ─── Property: value (4) ───

  describe('Property: value', () => {
    it('defaults value to 0', async () => {
      const el = await fixture<HelixRating>('<hx-rating></hx-rating>');
      expect(el.value).toBe(0);
    });

    it('reflects value attribute', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="3"></hx-rating>');
      expect(el.value).toBe(3);
    });

    it('marks correct star as checked', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="3" max="5"></hx-rating>');
      const symbols = shadowQueryAll(el, '[role="radio"]');
      expect(symbols[2]?.getAttribute('aria-checked')).toBe('true');
    });

    it('all stars are unchecked when value is 0', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="0" max="5"></hx-rating>');
      const symbols = shadowQueryAll(el, '[role="radio"]');
      const checkedCount = symbols.filter((s) => s.getAttribute('aria-checked') === 'true').length;
      expect(checkedCount).toBe(0);
    });
  });

  // ─── Property: readonly (3) ───

  describe('Property: readonly', () => {
    it('renders role="img" when readonly', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="3" readonly></hx-rating>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('role')).toBe('img');
    });

    it('has descriptive aria-label when readonly', async () => {
      const el = await fixture<HelixRating>(
        '<hx-rating value="3" max="5" label="Product" readonly></hx-rating>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Product: 3 out of 5');
    });

    it('does not fire hx-change when readonly and clicked', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="2" readonly></hx-rating>');
      let fired = false;
      el.addEventListener('hx-change', () => {
        fired = true;
      });
      const symbol = shadowQuery<HTMLElement>(el, '[part="symbol"]');
      symbol?.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixRating>('<hx-rating disabled></hx-rating>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('sets aria-disabled on base when disabled', async () => {
      const el = await fixture<HelixRating>('<hx-rating disabled></hx-rating>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not fire hx-change when disabled and clicked', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="2" disabled></hx-rating>');
      let fired = false;
      el.addEventListener('hx-change', () => {
        fired = true;
      });
      const symbol = shadowQuery<HTMLElement>(el, '[part="symbol"]');
      symbol?.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Click to Rate (3) ───

  describe('Click to Rate', () => {
    it('fires hx-change with correct value on click', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5"></hx-rating>');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      const symbols = shadowQueryAll<HTMLElement>(el, '[part="symbol"]');
      symbols[2]?.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe(3);
    });

    it('updates value property after click', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5"></hx-rating>');
      const symbols = shadowQueryAll<HTMLElement>(el, '[part="symbol"]');
      symbols[4]?.click();
      await el.updateComplete;
      expect(el.value).toBe(5);
    });

    it('hx-change bubbles and is composed', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5"></hx-rating>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
      const symbols = shadowQueryAll<HTMLElement>(el, '[part="symbol"]');
      symbols[0]?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Keyboard Navigation (5) ───

  describe('Keyboard Navigation', () => {
    it('ArrowRight increases value by 1', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="2" max="5"></hx-rating>');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(3);
    });

    it('ArrowLeft decreases value by 1', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="3" max="5"></hx-rating>');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(2);
    });

    it('Home key sets value to 0', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="3" max="5"></hx-rating>');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(0);
    });

    it('End key sets value to max', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="2" max="5"></hx-rating>');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(5);
    });

    it('does not exceed max on ArrowRight', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="5" max="5"></hx-rating>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(el.value).toBe(5);
    });

    it('restores focus to active star after ArrowRight', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="2" max="5"></hx-rating>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      // Wait for value update and the subsequent focus restoration
      await el.updateComplete;
      await el.updateComplete;
      const activeSymbol = el.shadowRoot?.querySelector<HTMLElement>(
        '[part="symbol"][tabindex="0"]',
      );
      expect(activeSymbol).toBeTruthy();
      expect(activeSymbol?.getAttribute('data-index')).toBe('3');
      expect(el.shadowRoot?.activeElement).toBe(activeSymbol);
    });
  });

  // ─── Half-Star Precision (3) ───

  describe('Half-Star Precision', () => {
    it('accepts 0.5 value with precision=0.5', async () => {
      const el = await fixture<HelixRating>(
        '<hx-rating value="2.5" max="5" precision="0.5"></hx-rating>',
      );
      expect(el.value).toBe(2.5);
    });

    it('renders role="slider" with correct aria attributes for value=2.5 with precision=0.5', async () => {
      const el = await fixture<HelixRating>(
        '<hx-rating value="2.5" max="5" precision="0.5"></hx-rating>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('role')).toBe('slider');
      expect(base?.getAttribute('aria-valuenow')).toBe('2.5');
      expect(base?.getAttribute('aria-valuemin')).toBe('0');
      expect(base?.getAttribute('aria-valuemax')).toBe('5');
      expect(base?.getAttribute('aria-valuetext')).toBe('2.5 out of 5 stars');
    });

    it('ArrowRight increases by 0.5 with precision=0.5', async () => {
      const el = await fixture<HelixRating>(
        '<hx-rating value="2" max="5" precision="0.5"></hx-rating>',
      );
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(2.5);
    });

    it('clicking right half of star sets full integer value with precision=0.5', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5" precision="0.5"></hx-rating>');
      const symbols = shadowQueryAll<HTMLElement>(el, '[part="symbol"]');
      const star = symbols[2]!;
      const rect = star.getBoundingClientRect();
      // Position clientX in the right half of the 3rd star
      const rightHalfX = rect.left + rect.width * 0.75;
      const centerY = rect.top + rect.height / 2;
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-change');
      star.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          composed: true,
          clientX: rightHalfX,
          clientY: centerY,
        }),
      );
      const event = await eventPromise;
      expect(event.detail.value).toBe(3);
    });
  });

  // ─── Hover Preview (2) ───

  describe('Hover Preview', () => {
    it('fires hx-hover with correct value on mouseenter', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5"></hx-rating>');
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-hover');
      const symbols = shadowQueryAll<HTMLElement>(el, '[part="symbol"]');
      // Dispatch mouseenter on 3rd star (precision=1, so _resolveValue returns i=3)
      symbols[2]?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe(3);
    });

    it('hx-hover bubbles and is composed', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5"></hx-rating>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-hover');
      const symbols = shadowQueryAll<HTMLElement>(el, '[part="symbol"]');
      symbols[0]?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('mousemove dispatches hx-hover with half-star precision on left half', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5" precision="0.5"></hx-rating>');
      const symbols = shadowQueryAll<HTMLElement>(el, '[part="symbol"]');
      const star = symbols[2]!;
      const rect = star.getBoundingClientRect();
      // Position clientX in the left half of the 3rd star
      const leftHalfX = rect.left + rect.width * 0.25;
      const centerY = rect.top + rect.height / 2;
      const eventPromise = oneEvent<CustomEvent<{ value: number }>>(el, 'hx-hover');
      star.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          composed: true,
          clientX: leftHalfX,
          clientY: centerY,
        }),
      );
      const event = await eventPromise;
      expect(event.detail.value).toBe(2.5);
    });
  });

  // ─── Form Participation (5) ───

  describe('Form Participation', () => {
    it('is form-associated', () => {
      expect((HelixRating as unknown as { formAssociated: boolean }).formAssociated).toBe(true);
    });

    it('formResetCallback resets value to default', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="4" max="5"></hx-rating>');
      expect(el.value).toBe(4);
      el.formResetCallback();
      await el.updateComplete;
      // default value is captured at firstUpdated from the initial value attribute
      expect(el.value).toBe(4);
    });

    it('formResetCallback resets to 0 when no default value set', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5"></hx-rating>');
      // Simulate user interaction changing value
      const symbols = shadowQueryAll<HTMLElement>(el, '[part="symbol"]');
      symbols[2]?.click();
      await el.updateComplete;
      expect(el.value).toBe(3);
      el.formResetCallback();
      await el.updateComplete;
      // _defaultValue was 0 at firstUpdated (no value attribute)
      expect(el.value).toBe(0);
    });

    it('formStateRestoreCallback restores numeric value from string state', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="5"></hx-rating>');
      el.formStateRestoreCallback('3', 'restore');
      await el.updateComplete;
      expect(el.value).toBe(3);
    });

    it('formStateRestoreCallback ignores non-numeric string state', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="2" max="5"></hx-rating>');
      el.formStateRestoreCallback('not-a-number', 'restore');
      await el.updateComplete;
      // value should remain unchanged
      expect(el.value).toBe(2);
    });

    it('formStateRestoreCallback ignores null state', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="2" max="5"></hx-rating>');
      el.formStateRestoreCallback(null, 'restore');
      await el.updateComplete;
      expect(el.value).toBe(2);
    });

    it('submits value in form data', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-rating name="rating" value="4"></hx-rating>';
      document.body.appendChild(form);
      const rating = form.querySelector('hx-rating') as HelixRating;
      await rating.updateComplete;

      const data = new FormData(form);
      expect(data.get('rating')).toBe('4');
      document.body.removeChild(form);
    });

    it('reflects name property', async () => {
      const el = await fixture<HelixRating>('<hx-rating name="stars"></hx-rating>');
      expect(el.name).toBe('stars');
    });

    it('formDisabledCallback sets disabled when parent fieldset is disabled', async () => {
      const el = await fixture<HelixRating>('<hx-rating></hx-rating>');
      el.formDisabledCallback(true);
      await el.updateComplete;
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      await el.updateComplete;
      expect(el.disabled).toBe(false);
    });

    it('checkValidity returns true when not required', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="0"></hx-rating>');
      expect(el.checkValidity()).toBe(true);
    });

    it('checkValidity returns false when required and value is 0', async () => {
      const el = await fixture<HelixRating>('<hx-rating required value="0"></hx-rating>');
      expect(el.checkValidity()).toBe(false);
    });

    it('checkValidity returns true when required and value is non-zero', async () => {
      const el = await fixture<HelixRating>('<hx-rating required value="3"></hx-rating>');
      expect(el.checkValidity()).toBe(true);
    });

    it('reportValidity is a function', async () => {
      const el = await fixture<HelixRating>('<hx-rating></hx-rating>');
      expect(typeof el.reportValidity).toBe('function');
    });

    it('validity.valueMissing is true when required and value is 0', async () => {
      const el = await fixture<HelixRating>('<hx-rating required value="0"></hx-rating>');
      expect(el.validity.valueMissing).toBe(true)
    });
  });

  // ─── ARIA (4) ───

  describe('ARIA', () => {
    it('base has aria-label from label property', async () => {
      const el = await fixture<HelixRating>('<hx-rating label="My Rating"></hx-rating>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('My Rating');
    });

    it('base defaults aria-label to "Rating"', async () => {
      const el = await fixture<HelixRating>('<hx-rating></hx-rating>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('aria-label')).toBe('Rating');
    });

    it('each symbol has role="radio"', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="3"></hx-rating>');
      const symbols = shadowQueryAll(el, '[part="symbol"]');
      symbols.forEach((s) => expect(s.getAttribute('role')).toBe('radio'));
    });

    it('star labels are "1 star", "2 stars", etc.', async () => {
      const el = await fixture<HelixRating>('<hx-rating max="3"></hx-rating>');
      const symbols = shadowQueryAll(el, '[role="radio"]');
      expect(symbols[0]?.getAttribute('aria-label')).toBe('1 star');
      expect(symbols[1]?.getAttribute('aria-label')).toBe('2 stars');
      expect(symbols[2]?.getAttribute('aria-label')).toBe('3 stars');
    });
  });

  // ─── Accessibility (axe-core) (4) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixRating>('<hx-rating label="Product rating"></hx-rating>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with value set', async () => {
      const el = await fixture<HelixRating>(
        '<hx-rating value="3" max="5" label="Product rating"></hx-rating>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in readonly state', async () => {
      const el = await fixture<HelixRating>(
        '<hx-rating value="4" max="5" label="Product rating" readonly></hx-rating>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixRating>(
        '<hx-rating value="2" label="Product rating" disabled></hx-rating>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Slot projection ───

  describe('Slot projection', () => {
    it('projects custom svg into the icon slot', async () => {
      const el = await fixture<HelixRating>(
        `<hx-rating value="3" label="Rating">
          <svg slot="icon" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>
        </hx-rating>`,
      );
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(1);
      expect(assigned[0].tagName.toLowerCase()).toBe('svg');
    });

    it('icon slot is empty when no icon content is provided', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="3" label="Rating"></hx-rating>');
      await el.updateComplete;
      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="icon"]')!;
      const assigned = slot.assignedElements();
      expect(assigned).toHaveLength(0);
    });
  });

  // ─── i18n / label overrides ───

  describe('i18n / label overrides', () => {
    it('labelStar returns singular English format for 1 star', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="3" label="Rating"></hx-rating>');
      await el.updateComplete;
      expect(el.labelStar(1)).toBe('1 star');
    });

    it('labelStar returns plural English format for multiple stars', async () => {
      const el = await fixture<HelixRating>('<hx-rating value="3" label="Rating"></hx-rating>');
      await el.updateComplete;
      expect(el.labelStar(3)).toBe('3 stars');
    });
  });
});
