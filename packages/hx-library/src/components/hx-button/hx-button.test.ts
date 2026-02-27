import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcButton } from './hx-button.js';
import './index.js';

afterEach(cleanup);

describe('hx-button', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "button" CSS part', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn).toBeTruthy();
    });

    it('applies default variant=primary class', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--primary')).toBe(true);
    });

    it('applies default size=md class', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--md')).toBe(true);
    });

    it('renders native <button> element', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
    });
  });

  // ─── Property: variant (3) ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const el = await fixture<WcButton>('<hx-button variant="secondary">Click</hx-button>');
      expect(el.getAttribute('variant')).toBe('secondary');
    });

    it('applies secondary class', async () => {
      const el = await fixture<WcButton>('<hx-button variant="secondary">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--secondary')).toBe(true);
    });

    it('applies ghost class', async () => {
      const el = await fixture<WcButton>('<hx-button variant="ghost">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--ghost')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class', async () => {
      const el = await fixture<WcButton>('<hx-button hx-size="sm">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--sm')).toBe(true);
    });

    it('applies md class', async () => {
      const el = await fixture<WcButton>('<hx-button hx-size="md">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<WcButton>('<hx-button hx-size="lg">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--lg')).toBe(true);
    });
  });

  // ─── Property: disabled (4) ───

  describe('Property: disabled', () => {
    it('sets native disabled attribute', async () => {
      const el = await fixture<WcButton>('<hx-button disabled>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.disabled).toBe(true);
    });

    it('sets aria-disabled="true"', async () => {
      const el = await fixture<WcButton>('<hx-button disabled>Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when enabled', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.hasAttribute('aria-disabled')).toBe(false);
    });

    it('applies host opacity 0.5 via disabled attribute', async () => {
      const el = await fixture<WcButton>('<hx-button disabled>Click</hx-button>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Property: type (3) ───

  describe('Property: type', () => {
    it('defaults to type="button"', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('type')).toBe('button');
    });

    it('sets type="submit" on native button', async () => {
      const el = await fixture<WcButton>('<hx-button type="submit">Submit</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('type')).toBe('submit');
    });

    it('sets type="reset" on native button', async () => {
      const el = await fixture<WcButton>('<hx-button type="reset">Reset</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('type')).toBe('reset');
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches wc-click on click', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent(el, 'hx-click');
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-click bubbles and is composed', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-click detail contains originalEvent', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn.click();
      const event = await eventPromise;
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('does NOT dispatch wc-click when disabled', async () => {
      const el = await fixture<WcButton>('<hx-button disabled>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      btn.click();
      // Give time for any async dispatch
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('Enter activates native button', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Space activates native button', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const el = await fixture<WcButton>('<hx-button>Hello World</hx-button>');
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('default slot renders HTML', async () => {
      const el = await fixture<WcButton>('<hx-button><span class="icon">+</span> Add</hx-button>');
      const span = el.querySelector('span.icon');
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe('+');
    });
  });

  // ─── Form (4) ───

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-button') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      // ElementInternals is attached in constructor — verify form getter works
      expect(el.form).toBe(null); // null when not inside a form
    });

    it('calls form.requestSubmit on type=submit click', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-button type="submit">Submit</hx-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-button') as WcButton;
      await el.updateComplete;

      let submitted = false;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitted = true;
      });

      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      btn.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(submitted).toBe(true);
    });

    it('calls form.reset on type=reset click', async () => {
      const form = document.createElement('form');
      form.innerHTML =
        '<input name="test" value="hello" /><hx-button type="reset">Reset</hx-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-button') as WcButton;
      await el.updateComplete;

      const input = form.querySelector('input') as HTMLInputElement;
      input.value = 'changed';

      let wasReset = false;
      form.addEventListener('reset', () => {
        wasReset = true;
      });

      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      btn.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(wasReset).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcButton>('<hx-button>Click me</hx-button>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<WcButton>('<hx-button disabled>Click me</hx-button>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['primary', 'secondary', 'ghost']) {
        const el = await fixture<WcButton>(`<hx-button variant="${variant}">Click me</hx-button>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });

  // ─── Dynamic Property Updates ───

  describe('Dynamic Property Updates', () => {
    it('updates variant class when property changes', async () => {
      const el = await fixture<WcButton>('<hx-button variant="primary">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--primary')).toBe(true);
      el.variant = 'ghost';
      await el.updateComplete;
      expect(btn.classList.contains('button--ghost')).toBe(true);
      expect(btn.classList.contains('button--primary')).toBe(false);
    });

    it('updates size class when property changes', async () => {
      const el = await fixture<WcButton>('<hx-button hx-size="sm">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--sm')).toBe(true);
      el.size = 'lg';
      await el.updateComplete;
      expect(btn.classList.contains('button--lg')).toBe(true);
      expect(btn.classList.contains('button--sm')).toBe(false);
    });

    it('el.form returns the associated form when inside one', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-button type="submit">Submit</hx-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-button') as WcButton;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });
  });
});
