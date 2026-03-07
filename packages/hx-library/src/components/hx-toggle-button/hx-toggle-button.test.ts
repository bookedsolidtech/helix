import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixToggleButton } from './hx-toggle-button.js';
import './index.js';

afterEach(cleanup);

describe('hx-toggle-button', () => {
  // ─── Rendering (6) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <button> element inside shadow DOM', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
    });

    it('renders with default pressed=false', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      expect(el.pressed).toBe(false);
    });

    it('renders with default variant="secondary"', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      expect(el.variant).toBe('secondary');
    });

    it('renders with default size="md"', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      expect(el.size).toBe('md');
    });

    it('exposes "button" CSS part', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery(el, '[part~="button"]');
      expect(btn).toBeTruthy();
    });
  });

  // ─── ARIA (3) ───

  describe('ARIA', () => {
    it('sets aria-pressed="false" when not pressed', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    });

    it('sets aria-pressed="true" when pressed', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button pressed>Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    });

    it('updates aria-pressed after programmatic toggle', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      el.pressed = true;
      await el.updateComplete;
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    });
  });

  // ─── Attribute Reflection (3) ───

  describe('Attribute Reflection', () => {
    it('reflects pressed attribute on host when pressed', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button pressed>Toggle</hx-toggle-button>',
      );
      expect(el.hasAttribute('pressed')).toBe(true);
    });

    it('does not reflect pressed attribute on host when not pressed', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      expect(el.hasAttribute('pressed')).toBe(false);
    });

    it('reflects variant attribute on host', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button variant="primary">Toggle</hx-toggle-button>',
      );
      expect(el.getAttribute('variant')).toBe('primary');
    });

    it('reflects hx-size attribute on host', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button hx-size="lg">Toggle</hx-toggle-button>',
      );
      expect(el.getAttribute('hx-size')).toBe('lg');
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('applies secondary class by default', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--secondary')).toBe(true);
    });

    it('applies primary class', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button variant="primary">Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--primary')).toBe(true);
    });

    it('applies tertiary class', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button variant="tertiary">Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--tertiary')).toBe(true);
    });

    it('applies ghost class', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button variant="ghost">Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--ghost')).toBe(true);
    });

    it('applies outline class', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button variant="outline">Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--outline')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies md class by default', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--md')).toBe(true);
    });

    it('applies sm class', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button hx-size="sm">Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--sm')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button hx-size="lg">Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--lg')).toBe(true);
    });
  });

  // ─── Toggle Behavior (5) ───

  describe('Toggle Behavior', () => {
    it('toggles pressed state to true on click', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      btn.click();
      await el.updateComplete;
      expect(el.pressed).toBe(true);
    });

    it('toggles pressed state back to false on second click', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button pressed>Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      btn.click();
      await el.updateComplete;
      expect(el.pressed).toBe(false);
    });

    it('applies button--pressed class when pressed', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button pressed>Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--pressed')).toBe(true);
    });

    it('removes button--pressed class when not pressed', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--pressed')).toBe(false);
    });

    it('does NOT toggle when disabled', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button disabled>Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      btn.click();
      await el.updateComplete;
      expect(el.pressed).toBe(false);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-toggle on click', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent(el, 'hx-toggle');
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-toggle event has bubbles=true and composed=true', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent<{ pressed: boolean }>>(el, 'hx-toggle');
      btn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-toggle event detail contains correct pressed=true value after toggle on', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent<{ pressed: boolean }>>(el, 'hx-toggle');
      btn.click();
      const event = await eventPromise;
      expect(event.detail.pressed).toBe(true);
    });

    it('hx-toggle event detail contains correct pressed=false value after toggle off', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button pressed>Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent<{ pressed: boolean }>>(el, 'hx-toggle');
      btn.click();
      const event = await eventPromise;
      expect(event.detail.pressed).toBe(false);
    });

    it('does NOT dispatch hx-toggle when disabled', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button disabled>Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      let fired = false;
      el.addEventListener('hx-toggle', () => {
        fired = true;
      });
      btn.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('toggles on Space key press', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      btn.focus();
      const eventPromise = oneEvent<CustomEvent<{ pressed: boolean }>>(el, 'hx-toggle');
      await page.keyboard.press('Space');
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.detail.pressed).toBe(true);
    });

    it('toggles on Enter key press', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      btn.focus();
      const eventPromise = oneEvent<CustomEvent<{ pressed: boolean }>>(el, 'hx-toggle');
      await page.keyboard.press('Enter');
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.detail.pressed).toBe(true);
    });
  });

  // ─── Disabled State (3) ───

  describe('Disabled State', () => {
    it('inner button has disabled attribute when disabled=true', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button disabled>Toggle</hx-toggle-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.disabled).toBe(true);
    });

    it('reflects disabled attribute on host', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button disabled>Toggle</hx-toggle-button>',
      );
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('inner button does NOT have disabled attribute when enabled', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.disabled).toBe(false);
    });
  });

  // ─── Form Association (5) ───

  describe('Form Association', () => {
    it('is form-associated (static formAssociated=true)', () => {
      const ctor = customElements.get('hx-toggle-button') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has form getter returning null when not inside a form', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      expect(el.form).toBe(null);
    });

    it('sets form value to value string when pressed and name/value are set', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-toggle-button name="mute" value="on">Toggle</hx-toggle-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-toggle-button') as HelixToggleButton;
      await el.updateComplete;

      el.pressed = true;
      await el.updateComplete;

      expect(el.form).toBe(form);
      // Form value is set when pressed — verify via form data
      const formData = new FormData(form);
      expect(formData.get('mute')).toBe('on');
    });

    it('sets null form value (not submitted) when not pressed', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-toggle-button name="mute" value="on">Toggle</hx-toggle-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-toggle-button') as HelixToggleButton;
      await el.updateComplete;

      // pressed defaults to false
      const formData = new FormData(form);
      expect(formData.get('mute')).toBeNull();
    });

    it('resets pressed to false on form reset', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-toggle-button name="mute" value="on" pressed>Toggle</hx-toggle-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-toggle-button') as HelixToggleButton;
      await el.updateComplete;

      expect(el.pressed).toBe(true);

      form.reset();
      await el.updateComplete;

      expect(el.pressed).toBe(false);
    });

    it('formStateRestoreCallback restores pressed=true from state "pressed"', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      expect(el.pressed).toBe(false);
      (el as unknown as { formStateRestoreCallback: (s: string) => void }).formStateRestoreCallback(
        'pressed',
      );
      expect(el.pressed).toBe(true);
    });

    it('formStateRestoreCallback restores pressed=false from non-pressed state', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button pressed>Toggle</hx-toggle-button>',
      );
      expect(el.pressed).toBe(true);
      (el as unknown as { formStateRestoreCallback: (s: string) => void }).formStateRestoreCallback(
        'off',
      );
      expect(el.pressed).toBe(false);
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('renders default slot content', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Mute</hx-toggle-button>');
      expect(el.textContent?.trim()).toBe('Mute');
    });

    it('renders prefix slot content', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button><svg slot="prefix" aria-hidden="true"></svg>Mute</hx-toggle-button>',
      );
      const slottedPrefix = el.querySelector('[slot="prefix"]');
      expect(slottedPrefix).toBeTruthy();
      expect(slottedPrefix?.tagName.toLowerCase()).toBe('svg');
    });

    it('renders suffix slot content', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button>Mute<svg slot="suffix" aria-hidden="true"></svg></hx-toggle-button>',
      );
      const slottedSuffix = el.querySelector('[slot="suffix"]');
      expect(slottedSuffix).toBeTruthy();
      expect(slottedSuffix?.tagName.toLowerCase()).toBe('svg');
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('exposes "button" part', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const part = shadowQuery(el, '[part~="button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "label" part', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const part = shadowQuery(el, '[part~="label"]');
      expect(part).toBeTruthy();
    });

    it('exposes "prefix" part', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const part = shadowQuery(el, '[part~="prefix"]');
      expect(part).toBeTruthy();
    });

    it('exposes "suffix" part', async () => {
      const el = await fixture<HelixToggleButton>('<hx-toggle-button>Toggle</hx-toggle-button>');
      const part = shadowQuery(el, '[part~="suffix"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default (unpressed) state', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button>Mute audio</hx-toggle-button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in pressed state', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button pressed>Mute audio</hx-toggle-button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixToggleButton>(
        '<hx-toggle-button disabled>Mute audio</hx-toggle-button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['primary', 'secondary', 'tertiary', 'ghost', 'outline']) {
        const el = await fixture<HelixToggleButton>(
          `<hx-toggle-button variant="${variant}">Mute audio</hx-toggle-button>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations for all sizes', async () => {
      for (const size of ['sm', 'md', 'lg']) {
        const el = await fixture<HelixToggleButton>(
          `<hx-toggle-button hx-size="${size}">Mute audio</hx-toggle-button>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `hx-size="${size}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
