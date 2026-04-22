import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HxRadio } from './hx-radio.js';
import './index.js';

afterEach(cleanup);

describe('hx-radio', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="Option A"></hx-radio>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders hidden native <input type="radio">', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="Option A"></hx-radio>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="radio"]');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it('renders label text', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="Option A"></hx-radio>');
      const label = shadowQuery(el, '.radio__label');
      expect(label?.textContent?.trim()).toContain('Option A');
    });
  });

  // ─── Property: value (1) ───

  describe('Property: value', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HxRadio>('<hx-radio></hx-radio>');
      expect(el.value).toBe('');
    });
  });

  // ─── Property: checked (2) ───

  describe('Property: checked', () => {
    it('defaults to unchecked', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      expect(el.checked).toBe(false);
    });

    it('applies checked class when checked', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" checked></hx-radio>');
      const container = shadowQuery(el, '.radio');
      expect(container?.classList.contains('radio--checked')).toBe(true);
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('defaults to not disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      expect(el.disabled).toBe(false);
    });

    it('applies disabled class when disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" disabled></hx-radio>');
      const container = shadowQuery(el, '.radio');
      expect(container?.classList.contains('radio--disabled')).toBe(true);
    });
  });

  // ─── ARIA (2) ───

  describe('ARIA', () => {
    it('projects role="radio" via ElementInternals', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      // ARIA state is surfaced to the accessibility tree via ElementInternals,
      // not via host-attribute mutation, so getAttribute('role') is null.
      expect(el.getAttribute('role')).toBeNull();
      expect((el as unknown as { _internals: ElementInternals })._internals.role).toBe('radio');
    });

    it('projects aria-checked matching checked state via ElementInternals', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" checked></hx-radio>');
      expect(el.hasAttribute('aria-checked')).toBe(false);
      expect((el as unknown as { _internals: ElementInternals })._internals.ariaChecked).toBe(
        'true',
      );
    });

    it('updates aria-checked on ElementInternals when checked changes', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBe('false');
      el.checked = true;
      await el.updateComplete;
      expect(internals.ariaChecked).toBe('true');
    });
  });

  // ─── Events (2) ───

  describe('Events', () => {
    it('dispatches wc-radio-select on click', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      let detail: { value: string } | null = null;
      el.addEventListener('hx-radio-select', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);
      const container = shadowQuery<HTMLElement>(el, '.radio')!;
      container.click();
      expect(detail).toEqual({ value: 'a' });
    });

    it('does not dispatch when disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" disabled></hx-radio>');
      let fired = false;
      el.addEventListener('hx-radio-select', () => {
        fired = true;
      });
      const container = shadowQuery<HTMLElement>(el, '.radio')!;
      container.click();
      expect(fired).toBe(false);
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "radio" CSS part', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      const part = shadowQuery(el, '[part="radio"]');
      expect(part).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      const part = shadowQuery(el, '[part="label"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('default slot overrides label property', async () => {
      const el = await fixture<HxRadio>(
        '<hx-radio value="a" label="Fallback"><strong>Custom</strong></hx-radio>',
      );
      const slotted = el.querySelector('strong');
      expect(slotted?.textContent).toBe('Custom');
    });
  });

  // ─── ARIA: aria-disabled (1) ───

  describe('ARIA: aria-disabled', () => {
    it('projects aria-disabled via ElementInternals when disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" disabled></hx-radio>');
      expect(el.hasAttribute('aria-disabled')).toBe(false);
      expect((el as unknown as { _internals: ElementInternals })._internals.ariaDisabled).toBe(
        'true',
      );
    });

    it('omits aria-disabled via ElementInternals when not disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      expect(
        (el as unknown as { _internals: ElementInternals })._internals.ariaDisabled,
      ).toBeNull();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    const axeOptions = { rules: { 'nested-interactive': { enabled: false } } };

    it('has no axe violations inside a radio group', async () => {
      const group = await fixture<HTMLElement>(`
        <hx-radio-group label="Test Group">
          <hx-radio value="a" label="Option A"></hx-radio>
          <hx-radio value="b" label="Option B"></hx-radio>
        </hx-radio-group>
      `);
      const { violations } = await checkA11y(group, axeOptions);
      expect(violations).toEqual([]);
    });
  });
});
