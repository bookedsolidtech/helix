import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { WcRadio } from './wc-radio.js';
import './index.js';

afterEach(cleanup);

describe('wc-radio', () => {

  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="Option A"></wc-radio>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders hidden native <input type="radio">', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="Option A"></wc-radio>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="radio"]');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it('renders label text', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="Option A"></wc-radio>');
      const label = shadowQuery(el, '.radio__label');
      expect(label?.textContent?.trim()).toContain('Option A');
    });
  });

  // ─── Property: value (1) ───

  describe('Property: value', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<WcRadio>('<wc-radio></wc-radio>');
      expect(el.value).toBe('');
    });
  });

  // ─── Property: checked (2) ───

  describe('Property: checked', () => {
    it('defaults to unchecked', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A"></wc-radio>');
      expect(el.checked).toBe(false);
    });

    it('applies checked class when checked', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A" checked></wc-radio>');
      const container = shadowQuery(el, '.radio');
      expect(container?.classList.contains('radio--checked')).toBe(true);
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('defaults to not disabled', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A"></wc-radio>');
      expect(el.disabled).toBe(false);
    });

    it('applies disabled class when disabled', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A" disabled></wc-radio>');
      const container = shadowQuery(el, '.radio');
      expect(container?.classList.contains('radio--disabled')).toBe(true);
    });
  });

  // ─── ARIA (2) ───

  describe('ARIA', () => {
    it('sets role="radio" on host', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A"></wc-radio>');
      expect(el.getAttribute('role')).toBe('radio');
    });

    it('sets aria-checked matching checked state', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A" checked></wc-radio>');
      expect(el.getAttribute('aria-checked')).toBe('true');
    });
  });

  // ─── Events (2) ───

  describe('Events', () => {
    it('dispatches wc-radio-select on click', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A"></wc-radio>');
      let detail: { value: string } | null = null;
      el.addEventListener('wc-radio-select', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);
      const container = shadowQuery<HTMLElement>(el, '.radio')!;
      container.click();
      expect(detail).toEqual({ value: 'a' });
    });

    it('does not dispatch when disabled', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A" disabled></wc-radio>');
      let fired = false;
      el.addEventListener('wc-radio-select', () => { fired = true; });
      const container = shadowQuery<HTMLElement>(el, '.radio')!;
      container.click();
      expect(fired).toBe(false);
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "radio" CSS part', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A"></wc-radio>');
      const part = shadowQuery(el, '[part="radio"]');
      expect(part).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="A"></wc-radio>');
      const part = shadowQuery(el, '[part="label"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('default slot overrides label property', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="Fallback"><strong>Custom</strong></wc-radio>');
      const slotted = el.querySelector('strong');
      expect(slotted?.textContent).toBe('Custom');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcRadio>('<wc-radio value="a" label="Option A"></wc-radio>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

});
