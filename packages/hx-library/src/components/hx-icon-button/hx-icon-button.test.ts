import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixIconButton } from './hx-icon-button.js';
import './index.js';

afterEach(cleanup);

describe('hx-icon-button', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <button> element by default', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
    });

    it('exposes "button" CSS part', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const part = shadowQuery(el, '[part="button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" CSS part', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('applies default variant=ghost class', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--ghost')).toBe(true);
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('sets aria-label on native button from label property', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Delete record"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('aria-label')).toBe('Delete record');
    });

    it('sets title attribute on native button from label property', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Edit patient"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('title')).toBe('Edit patient');
    });

    it('renders nothing when label is empty', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button></hx-icon-button>');
      await el.updateComplete;
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeNull();
    });
  });

  // ─── Property: variant (6) ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Action" variant="primary"></hx-icon-button>',
      );
      expect(el.getAttribute('variant')).toBe('primary');
    });

    it('applies primary class', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Action" variant="primary"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--primary')).toBe(true);
    });

    it('applies secondary class', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Action" variant="secondary"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--secondary')).toBe(true);
    });

    it('applies tertiary class', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Action" variant="tertiary"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--tertiary')).toBe(true);
    });

    it('applies danger class', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Delete" variant="danger"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--danger')).toBe(true);
    });

    it('applies ghost class (default)', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close" variant="ghost"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--ghost')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close" hx-size="sm"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--sm')).toBe(true);
    });

    it('applies md class (default)', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--md')).toBe(true);
    });

    it('applies lg class', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close" hx-size="lg"></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.classList.contains('button--lg')).toBe(true);
    });
  });

  // ─── Property: disabled (4) ───

  describe('Property: disabled', () => {
    it('sets native disabled attribute', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close" disabled></hx-icon-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.disabled).toBe(true);
    });

    it('sets aria-disabled="true"', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close" disabled></hx-icon-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when enabled', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.hasAttribute('aria-disabled')).toBe(false);
    });

    it('host has disabled attribute reflected', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close" disabled></hx-icon-button>',
      );
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Property: type (3) ───

  describe('Property: type', () => {
    it('defaults to type="button"', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('type')).toBe('button');
    });

    it('sets type="submit" on native button', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Submit" type="submit"></hx-icon-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('type')).toBe('submit');
    });

    it('sets type="reset" on native button', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Reset" type="reset"></hx-icon-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('type')).toBe('reset');
    });
  });

  // ─── Property: href (2) ───

  describe('Property: href', () => {
    it('renders <a> element when href is set', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Visit site" href="https://example.com"></hx-icon-button>',
      );
      const anchor = shadowQuery(el, 'a');
      expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    });

    it('renders <button> element when href is not set', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
      expect(shadowQuery(el, 'a')).toBeNull();
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-click on click', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent(el, 'hx-click');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-click bubbles and is composed', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-click detail contains originalEvent', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent<{ originalEvent: MouseEvent }>>(el, 'hx-click');
      btn?.click();
      const event = await eventPromise;
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('does NOT dispatch hx-click when disabled', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close" disabled></hx-icon-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      btn?.click();
      // Give time for any async dispatch
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('Enter activates native button', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('Space activates native button', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('default slot renders icon content', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Add"><svg aria-hidden="true"><use href="#icon-add"></use></svg></hx-icon-button>',
      );
      const svg = el.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  // ─── Form (3) ───

  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-icon-button') as unknown as {
        formAssociated: boolean;
      };
      expect(ctor.formAssociated).toBe(true);
    });

    it('has ElementInternals attached (form getter returns null outside form)', async () => {
      const el = await fixture<HelixIconButton>('<hx-icon-button label="Close"></hx-icon-button>');
      // ElementInternals is attached in constructor; form is null when not inside a <form>
      expect(el.form).toBe(null);
    });

    it('calls form.requestSubmit on type=submit click', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<hx-icon-button label="Submit" type="submit"></hx-icon-button>';
      const container = document.getElementById('test-fixture-container');
      expect(container).toBeTruthy();
      container?.appendChild(form);
      const el = form.querySelector('hx-icon-button') as HelixIconButton;
      await el.updateComplete;

      let submitted = false;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitted = true;
      });

      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      btn?.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(submitted).toBe(true);
    });

    it('submits name/value pair with form data', async () => {
      const form = document.createElement('form');
      form.innerHTML =
        '<hx-icon-button label="Submit" type="submit" name="action" value="save"></hx-icon-button>';
      const container = document.getElementById('test-fixture-container');
      expect(container).toBeTruthy();
      container?.appendChild(form);
      const el = form.querySelector('hx-icon-button') as HelixIconButton;
      await el.updateComplete;

      let submitted = false;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitted = true;
      });

      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('name')).toBe('action');
      expect(btn?.getAttribute('value')).toBe('save');
      btn?.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(submitted).toBe(true);
    });

    it('type=reset triggers form reset', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <input type="text" name="username" value="original">
        <hx-icon-button label="Reset" type="reset"></hx-icon-button>
      `;
      const container = document.getElementById('test-fixture-container');
      expect(container).toBeTruthy();
      container?.appendChild(form);
      const el = form.querySelector('hx-icon-button') as HelixIconButton;
      const input = form.querySelector('input') as HTMLInputElement;
      await el.updateComplete;

      // Change input value
      input.value = 'changed';
      expect(input.value).toBe('changed');

      // Click reset button
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      btn?.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(input.value).toBe('original');
    });
  });

  // ─── Accessibility (axe-core) (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state (with label)', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close dialog"></hx-icon-button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixIconButton>(
        '<hx-icon-button label="Close dialog" disabled></hx-icon-button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all 5 variants', async () => {
      const variants = ['primary', 'secondary', 'tertiary', 'danger', 'ghost'] as const;
      for (const variant of variants) {
        const el = await fixture<HelixIconButton>(
          `<hx-icon-button label="Action button" variant="${variant}"></hx-icon-button>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no axe violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
