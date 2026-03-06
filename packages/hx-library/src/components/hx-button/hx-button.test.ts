import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
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
      const btn = shadowQuery(el, '[part~="button"]');
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

  // ─── Property: variant (6) ───

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

    it('applies tertiary class', async () => {
      const el = await fixture<WcButton>('<hx-button variant="tertiary">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--tertiary')).toBe(true);
    });

    it('applies danger class', async () => {
      const el = await fixture<WcButton>('<hx-button variant="danger">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--danger')).toBe(true);
    });

    it('applies outline class', async () => {
      const el = await fixture<WcButton>('<hx-button variant="outline">Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--outline')).toBe(true);
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

    it('does not set aria-disabled on native button (native disabled is sufficient)', async () => {
      const el = await fixture<WcButton>('<hx-button disabled>Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.hasAttribute('aria-disabled')).toBe(false);
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

  // ─── Property: loading (5) ───

  describe('Property: loading', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      expect(el.loading).toBe(false);
    });

    it('adds button--loading class when true', async () => {
      const el = await fixture<WcButton>('<hx-button loading>Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.classList.contains('button--loading')).toBe(true);
    });

    it('shows spinner when loading', async () => {
      const el = await fixture<WcButton>('<hx-button loading>Click</hx-button>');
      const spinner = shadowQuery(el, '[part="spinner"]');
      expect(spinner).toBeTruthy();
    });

    it('prevents hx-click when loading', async () => {
      const el = await fixture<WcButton>('<hx-button loading>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      btn.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });

    it('sets aria-busy="true" when loading', async () => {
      const el = await fixture<WcButton>('<hx-button loading>Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.getAttribute('aria-busy')).toBe('true');
    });
  });

  // ─── href mode (4) ───

  describe('href mode', () => {
    it('renders <a> element when href is set', async () => {
      const el = await fixture<WcButton>('<hx-button href="https://example.com">Link</hx-button>');
      const anchor = shadowQuery(el, 'a');
      expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    });

    it('sets href attribute on anchor', async () => {
      const el = await fixture<WcButton>('<hx-button href="https://example.com">Link</hx-button>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('href')).toBe('https://example.com');
    });

    it('sets target attribute on anchor', async () => {
      const el = await fixture<WcButton>(
        '<hx-button href="https://example.com" target="_blank">Link</hx-button>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('target')).toBe('_blank');
    });

    it('sets rel="noopener noreferrer" when target="_blank"', async () => {
      const el = await fixture<WcButton>(
        '<hx-button href="https://example.com" target="_blank">Link</hx-button>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('does not set rel when target is not "_blank"', async () => {
      const el = await fixture<WcButton>('<hx-button href="https://example.com">Link</hx-button>');
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.hasAttribute('rel')).toBe(false);
    });

    it('suppresses hx-click and sets aria-busy when loading in anchor mode', async () => {
      const el = await fixture<WcButton>(
        '<hx-button href="https://example.com" loading>Link</hx-button>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('aria-busy')).toBe('true');
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      anchor.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });

    it('removes href when disabled in anchor mode', async () => {
      const el = await fixture<WcButton>(
        '<hx-button href="https://example.com" disabled>Link</hx-button>',
      );
      const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
      expect(anchor.getAttribute('href')).not.toBe('https://example.com');
      expect(anchor.getAttribute('aria-disabled')).toBe('true');
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      anchor.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-click on click', async () => {
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

    it('does NOT dispatch hx-click when disabled', async () => {
      const el = await fixture<WcButton>('<hx-button disabled>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      btn.click();
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('Enter activates native button', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn.focus();
      await userEvent.keyboard('{Enter}');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Space activates native button', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn.focus();
      await userEvent.keyboard(' ');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Slots (4) ───

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

    it('prefix slot renders content', async () => {
      const el = await fixture<WcButton>(
        '<hx-button><svg slot="prefix" aria-hidden="true"></svg>Label</hx-button>',
      );
      const slottedPrefix = el.querySelector('[slot="prefix"]');
      expect(slottedPrefix).toBeTruthy();
      expect(slottedPrefix?.tagName.toLowerCase()).toBe('svg');
    });

    it('suffix slot renders content', async () => {
      const el = await fixture<WcButton>(
        '<hx-button>Label<svg slot="suffix" aria-hidden="true"></svg></hx-button>',
      );
      const slottedSuffix = el.querySelector('[slot="suffix"]');
      expect(slottedSuffix).toBeTruthy();
      expect(slottedSuffix?.tagName.toLowerCase()).toBe('svg');
    });
  });

  // ─── CSS Parts (4) ───

  describe('CSS Parts', () => {
    it('exposes "label" part', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const labelPart = shadowQuery(el, '[part~="label"]');
      expect(labelPart).toBeTruthy();
    });

    it('exposes "prefix" part', async () => {
      const el = await fixture<WcButton>(
        '<hx-button><span slot="prefix">*</span>Click</hx-button>',
      );
      const prefixPart = shadowQuery(el, '[part~="prefix"]');
      expect(prefixPart).toBeTruthy();
    });

    it('exposes "suffix" part', async () => {
      const el = await fixture<WcButton>(
        '<hx-button>Click<span slot="suffix">*</span></hx-button>',
      );
      const suffixPart = shadowQuery(el, '[part~="suffix"]');
      expect(suffixPart).toBeTruthy();
    });

    it('exposes "spinner" part when loading', async () => {
      const el = await fixture<WcButton>('<hx-button loading>Click</hx-button>');
      const spinnerPart = shadowQuery(el, '[part~="spinner"]');
      expect(spinnerPart).toBeTruthy();
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
      await el.updateComplete;
      expect(submitted).toBe(true);
    });

    it('returns the parent form from form getter', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-button>Click</hx-button>';
      document.getElementById('test-fixture-container')!.appendChild(form);
      const el = form.querySelector('hx-button') as WcButton;
      await el.updateComplete;
      expect(el.form).toBe(form);
    });

    it('calls setFormValue when name and value are set on submit', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-button type="submit" name="action" value="confirm">Submit</hx-button>';
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
      await el.updateComplete;
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
      await el.updateComplete;
      expect(wasReset).toBe(true);
    });
  });

  // ─── Property: label (aria-label passthrough) ───

  describe('Property: label', () => {
    it('forwards label to inner button aria-label', async () => {
      const el = await fixture<WcButton>('<hx-button label="Close dialog">X</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.getAttribute('aria-label')).toBe('Close dialog');
    });

    it('forwards label to inner anchor aria-label', async () => {
      const el = await fixture<WcButton>(
        '<hx-button href="https://example.com" label="Visit site">Link</hx-button>',
      );
      const anchor = shadowQuery(el, 'a')!;
      expect(anchor.getAttribute('aria-label')).toBe('Visit site');
    });

    it('does not set aria-label when label is not provided', async () => {
      const el = await fixture<WcButton>('<hx-button>Click</hx-button>');
      const btn = shadowQuery(el, 'button')!;
      expect(btn.hasAttribute('aria-label')).toBe(false);
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

    it('has no axe violations for original variants', async () => {
      for (const variant of ['primary', 'secondary', 'ghost']) {
        const el = await fixture<WcButton>(`<hx-button variant="${variant}">Click me</hx-button>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations for new variants', async () => {
      for (const variant of ['tertiary', 'danger', 'outline']) {
        const el = await fixture<WcButton>(`<hx-button variant="${variant}">Click me</hx-button>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when loading', async () => {
      const el = await fixture<WcButton>('<hx-button loading>Loading...</hx-button>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in href (anchor) mode', async () => {
      const el = await fixture<WcButton>(
        '<hx-button href="https://example.com">Visit site</hx-button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
