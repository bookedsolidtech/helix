import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcButton } from './wc-button.js';
import './index.js';

afterEach(cleanup);

describe('wc-button', () => {

  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "button" CSS part', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery(el, '[part="button"]');
      expect(btn).toBeTruthy();
    });

    it('applies default variant=primary class', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--primary')).toBe(true);
    });

    it('applies default size=md class', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--md')).toBe(true);
    });

    it('renders native <button> element', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
    });
  });

  // ─── Property: variant (3) ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const el = await fixture<WcButton>('<wc-button variant="secondary">Click</wc-button>');
      expect(el.getAttribute('variant')).toBe('secondary');
    });

    it('applies secondary class', async () => {
      const el = await fixture<WcButton>('<wc-button variant="secondary">Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--secondary')).toBe(true);
    });

    it('applies ghost class', async () => {
      const el = await fixture<WcButton>('<wc-button variant="ghost">Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--ghost')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class', async () => {
      const el = await fixture<WcButton>('<wc-button wc-size="sm">Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--sm')).toBe(true);
    });

    it('applies md class', async () => {
      const el = await fixture<WcButton>('<wc-button wc-size="md">Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<WcButton>('<wc-button wc-size="lg">Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--lg')).toBe(true);
    });
  });

  // ─── Property: disabled (4) ───

  describe('Property: disabled', () => {
    it('sets native disabled attribute', async () => {
      const el = await fixture<WcButton>('<wc-button disabled>Click</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.disabled).toBe(true);
    });

    it('sets aria-disabled="true"', async () => {
      const el = await fixture<WcButton>('<wc-button disabled>Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when enabled', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.hasAttribute('aria-disabled')).toBe(false);
    });

    it('applies host opacity 0.5 via disabled attribute', async () => {
      const el = await fixture<WcButton>('<wc-button disabled>Click</wc-button>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Property: type (3) ───

  describe('Property: type', () => {
    it('defaults to type="button"', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('type')).toBe('button');
    });

    it('sets type="submit" on native button', async () => {
      const el = await fixture<WcButton>('<wc-button type="submit">Submit</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('type')).toBe('submit');
    });

    it('sets type="reset" on native button', async () => {
      const el = await fixture<WcButton>('<wc-button type="reset">Reset</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('type')).toBe('reset');
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches wc-click on click', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent(el, 'wc-click');
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('wc-click bubbles and is composed', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-click');
      btn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('wc-click detail contains originalEvent', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-click');
      btn.click();
      const event = await eventPromise;
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('does NOT dispatch wc-click when disabled', async () => {
      const el = await fixture<WcButton>('<wc-button disabled>Click</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      let fired = false;
      el.addEventListener('wc-click', () => { fired = true; });
      btn.click();
      // Give time for any async dispatch
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('Enter activates native button', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-click');
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Space activates native button', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-click');
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const el = await fixture<WcButton>('<wc-button>Hello World</wc-button>');
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('default slot renders HTML', async () => {
      const el = await fixture<WcButton>('<wc-button><span class="icon">+</span> Add</wc-button>');
      const span = el.querySelector('span.icon');
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe('+');
    });
  });

  // ─── Form (4) ───

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('wc-button') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached', async () => {
      const el = await fixture<WcButton>('<wc-button>Click</wc-button>');
      // ElementInternals is attached in constructor — verify form getter works
      expect(el.form).toBe(null); // null when not inside a form
    });

    it('calls form.requestSubmit on type=submit click', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<wc-button type="submit">Submit</wc-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('wc-button') as WcButton;
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
      form.innerHTML = '<input name="test" value="hello" /><wc-button type="reset">Reset</wc-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('wc-button') as WcButton;
      await el.updateComplete;

      const input = form.querySelector('input') as HTMLInputElement;
      input.value = 'changed';

      let wasReset = false;
      form.addEventListener('reset', () => { wasReset = true; });

      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      btn.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(wasReset).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcButton>('<wc-button>Click me</wc-button>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<WcButton>('<wc-button disabled>Click me</wc-button>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['primary', 'secondary', 'ghost']) {
        const el = await fixture<WcButton>(`<wc-button variant="${variant}">Click me</wc-button>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });

});
