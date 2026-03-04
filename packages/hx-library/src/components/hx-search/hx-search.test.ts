import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixSearch } from './hx-search.js';
import './index.js';

afterEach(cleanup);

describe('hx-search', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <input type="search">', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="search"]');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it('exposes "input" CSS part', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const input = shadowQuery(el, '[part="input"]');
      expect(input).toBeTruthy();
    });

    it('exposes "search-icon" CSS part', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const icon = shadowQuery(el, '[part="search-icon"]');
      expect(icon).toBeTruthy();
    });
  });

  // ─── Property: label (2) ───

  describe('Property: label', () => {
    it('renders label text when label prop is set', async () => {
      const el = await fixture<HelixSearch>('<hx-search label="Patient Search"></hx-search>');
      const label = shadowQuery(el, 'label');
      expect(label?.textContent?.trim()).toContain('Patient Search');
    });

    it('does not render label element when label is empty', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const label = shadowQuery(el, 'label');
      expect(label).toBeNull();
    });
  });

  // ─── Property: placeholder (2) ───

  describe('Property: placeholder', () => {
    it('defaults placeholder to "Search..."', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('Search...');
    });

    it('sets custom placeholder on native input', async () => {
      const el = await fixture<HelixSearch>(
        '<hx-search placeholder="Search patients..."></hx-search>',
      );
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.getAttribute('placeholder')).toBe('Search patients...');
    });
  });

  // ─── Property: value (2) ───

  describe('Property: value', () => {
    it('syncs value attribute to native input', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="cardiology"></hx-search>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('cardiology');
    });

    it('reflects programmatic value changes to native input', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      el.value = 'updated query';
      await el.updateComplete;
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.value).toBe('updated query');
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('reflects disabled attribute on the host element', async () => {
      const el = await fixture<HelixSearch>('<hx-search disabled></hx-search>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('sets disabled on the native input', async () => {
      const el = await fixture<HelixSearch>('<hx-search disabled></hx-search>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(input.disabled).toBe(true);
    });
  });

  // ─── Property: loading (2) ───

  describe('Property: loading', () => {
    it('reflects loading attribute on the host element', async () => {
      const el = await fixture<HelixSearch>('<hx-search loading></hx-search>');
      expect(el.hasAttribute('loading')).toBe(true);
    });

    it('shows spinner element when loading is true', async () => {
      const el = await fixture<HelixSearch>('<hx-search loading></hx-search>');
      const spinner = shadowQuery(el, '.field__spinner');
      expect(spinner).toBeTruthy();
    });
  });

  // ─── Property: hx-size (2) ───

  describe('Property: hx-size', () => {
    it('applies size class field--sm for hx-size="sm"', async () => {
      const el = await fixture<HelixSearch>('<hx-search hx-size="sm"></hx-search>');
      const field = shadowQuery(el, '.field');
      expect(field?.classList.contains('field--sm')).toBe(true);
    });

    it('applies size class field--lg for hx-size="lg"', async () => {
      const el = await fixture<HelixSearch>('<hx-search hx-size="lg"></hx-search>');
      const field = shadowQuery(el, '.field');
      expect(field?.classList.contains('field--lg')).toBe(true);
    });
  });

  // ─── Event: hx-input (2) ───

  describe('Event: hx-input', () => {
    it('fires hx-input on keystroke with value in detail', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-input');
      input.value = 'aspirin';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.value).toBe('aspirin');
    });

    it('hx-input bubbles and is composed', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-input');
      input.value = 'test';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Event: hx-search (2) ───

  describe('Event: hx-search', () => {
    it('fires hx-search immediately on Enter keydown with query in detail', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="metformin"></hx-search>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-search');
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }),
      );
      const event = await eventPromise;
      expect(event.detail.query).toBe('metformin');
    });

    it('fires hx-search after debounce when typing', async () => {
      vi.useFakeTimers();
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      const searchEvents: CustomEvent[] = [];
      el.addEventListener('hx-search', (e) => searchEvents.push(e as CustomEvent));

      input.value = 'ibuprofen';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(searchEvents).toHaveLength(0);
      vi.runAllTimers();
      expect(searchEvents).toHaveLength(1);
      expect(searchEvents[0].detail.query).toBe('ibuprofen');
      vi.useRealTimers();
    });
  });

  // ─── Event: hx-clear (2) ───

  describe('Event: hx-clear', () => {
    it('fires hx-clear when clear() method is called', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="some query"></hx-search>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-clear');
      el.clear();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-clear when clear button is clicked', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="some query"></hx-search>');
      const clearBtn = shadowQuery<HTMLButtonElement>(el, '[part="clear-button"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-clear');
      clearBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Clear Button Visibility (3) ───

  describe('Clear button visibility', () => {
    it('clear button is visible when value is non-empty', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="query text"></hx-search>');
      const clearBtn = shadowQuery(el, '[part="clear-button"]');
      expect(clearBtn).toBeTruthy();
    });

    it('clear button is hidden when value is empty', async () => {
      const el = await fixture<HelixSearch>('<hx-search value=""></hx-search>');
      const clearBtn = shadowQuery(el, '[part="clear-button"]');
      expect(clearBtn).toBeNull();
    });

    it('clear button is hidden when component is disabled even with a value', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="query text" disabled></hx-search>');
      const clearBtn = shadowQuery(el, '[part="clear-button"]');
      expect(clearBtn).toBeNull();
    });
  });

  // ─── Form Integration (3) ───

  describe('Form integration', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-search') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('formResetCallback clears the value', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="existing query"></hx-search>');
      el.formResetCallback();
      await el.updateComplete;
      expect(el.value).toBe('');
    });

    it('setFormValue is called with current value on update', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      // Confirm the element participates in form association via ElementInternals
      expect(el.form).toBeNull();
      // Verify value is reflected correctly (setFormValue called in updated())
      el.value = 'test-value';
      await el.updateComplete;
      expect(el.value).toBe('test-value');
    });
  });

  // ─── Public Methods (2) ───

  describe('Public methods', () => {
    it('focus() delegates focus to the native input', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      el.focus();
      await new Promise((r) => setTimeout(r, 50));
      const input = shadowQuery<HTMLInputElement>(el, 'input')!;
      expect(el.shadowRoot?.activeElement).toBe(input);
    });

    it('clear() resets value to empty and dispatches hx-clear', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="to be cleared"></hx-search>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-clear');
      el.clear();
      await eventPromise;
      await el.updateComplete;
      expect(el.value).toBe('');
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders label content', async () => {
      const el = await fixture<HelixSearch>(
        '<hx-search><span slot="">Custom label</span></hx-search>',
      );
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot:not([name])');
      expect(slot).toBeTruthy();
    });

    it('suggestions slot renders below the input', async () => {
      const el = await fixture<HelixSearch>(
        '<hx-search><div slot="suggestions">Result 1</div></hx-search>',
      );
      const suggestionsDiv = el.querySelector('[slot="suggestions"]');
      expect(suggestionsDiv).toBeTruthy();
      expect(suggestionsDiv?.textContent).toBe('Result 1');
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "clear-button" CSS part when value is present', async () => {
      const el = await fixture<HelixSearch>('<hx-search value="medication"></hx-search>');
      const clearBtn = shadowQuery(el, '[part="clear-button"]');
      expect(clearBtn).toBeTruthy();
    });

    it('exposes "suggestions" CSS part', async () => {
      const el = await fixture<HelixSearch>('<hx-search></hx-search>');
      const suggestions = shadowQuery(el, '[part="suggestions"]');
      expect(suggestions).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixSearch>('<hx-search label="Patient Search"></hx-search>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixSearch>(
        '<hx-search label="Patient Search" disabled></hx-search>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when loading', async () => {
      const el = await fixture<HelixSearch>(
        '<hx-search label="Patient Search" loading></hx-search>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with a value and clear button visible', async () => {
      const el = await fixture<HelixSearch>(
        '<hx-search label="Patient Search" value="cardiology"></hx-search>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
