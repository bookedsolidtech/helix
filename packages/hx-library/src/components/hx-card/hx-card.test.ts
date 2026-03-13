import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixCard } from './hx-card.js';
import './index.js';

afterEach(cleanup);

describe('hx-card', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "card" CSS part', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '[part="card"]');
      expect(card).toBeTruthy();
    });

    it('applies default variant + elevation classes', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--default')).toBe(true);
      expect(card.classList.contains('card--flat')).toBe(true);
    });

    it('renders container div', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, 'div.card');
      expect(card).toBeTruthy();
    });
  });

  // ─── Property: variant (3) ───

  describe('Property: variant', () => {
    it('applies default class', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--default')).toBe(true);
    });

    it('applies featured class', async () => {
      const el = await fixture<HelixCard>('<hx-card variant="featured">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--featured')).toBe(true);
    });

    it('applies compact class', async () => {
      const el = await fixture<HelixCard>('<hx-card variant="compact">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--compact')).toBe(true);
    });
  });

  // ─── Property: elevation (3) ───

  describe('Property: elevation', () => {
    it('flat applies no shadow class', async () => {
      const el = await fixture<HelixCard>('<hx-card elevation="flat">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--flat')).toBe(true);
    });

    it('raised applies medium shadow class', async () => {
      const el = await fixture<HelixCard>('<hx-card elevation="raised">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--raised')).toBe(true);
    });

    it('floating applies large shadow class', async () => {
      const el = await fixture<HelixCard>('<hx-card elevation="floating">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--floating')).toBe(true);
    });
  });

  // ─── Property: hx-href (4) ───

  describe('Property: hx-href', () => {
    it('has no role when no hx-href', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.hasAttribute('role')).toBe(false);
    });

    it('has role="link" when hx-href set', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.getAttribute('role')).toBe('link');
    });

    it('has tabindex="0" when hx-href set', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.getAttribute('tabindex')).toBe('0');
    });

    it('has no aria-label by default when hx-href set (accessible name from content)', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.hasAttribute('aria-label')).toBe(false);
    });

    it('uses hx-aria-label when provided on interactive card', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card hx-href="/test" hx-aria-label="View patient record">Content</hx-card>',
      );
      const card = shadowQuery(el, '.card')!;
      expect(card.getAttribute('aria-label')).toBe('View patient record');
    });

    it('updates interactive attributes when hxHref changes after initial render', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.hasAttribute('role')).toBe(false);
      expect(card.hasAttribute('tabindex')).toBe(false);

      el.hxHref = '/new-path';
      await el.updateComplete;

      expect(card.getAttribute('role')).toBe('link');
      expect(card.getAttribute('tabindex')).toBe('0');
      expect(card.classList.contains('card--interactive')).toBe(true);

      el.hxHref = undefined;
      await el.updateComplete;

      expect(card.hasAttribute('role')).toBe(false);
      expect(card.hasAttribute('tabindex')).toBe(false);
      expect(card.classList.contains('card--interactive')).toBe(false);
    });
  });

  // ─── Interactivity (3) ───

  describe('Interactivity', () => {
    it('applies card--interactive class when hx-href', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--interactive')).toBe(true);
    });

    it('does not apply card--interactive without hx-href', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--interactive')).toBe(false);
    });

    it('has cursor:pointer when interactive', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      const styles = getComputedStyle(card);
      expect(styles.cursor).toBe('pointer');
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches hx-click when hx-href + click', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      const eventPromise = oneEvent(el, 'hx-click');
      card.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-click detail contains href and originalEvent', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      card.click();
      const event = await eventPromise;
      expect(event.detail.href).toBe('/test');
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('does NOT dispatch event without hx-href', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      card.click();
      // Allow brief settle time to confirm hx-click is not dispatched on a non-interactive card
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard (3) ───

  describe('Keyboard', () => {
    it('Enter fires hx-click when interactive', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.href).toBe('/test');
    });

    it('Space fires hx-click when interactive', async () => {
      const el = await fixture<HelixCard>('<hx-card hx-href="/test">Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
      card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.href).toBe('/test');
    });

    it('no keyboard action without hx-href', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '.card')!;
      let fired = false;
      el.addEventListener('hx-click', () => {
        fired = true;
      });
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      // Allow brief settle time to confirm hx-click is not dispatched on a non-interactive card
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Slot: default (1) ───

  describe('Slot: default', () => {
    it('body content renders in card__body', async () => {
      const el = await fixture<HelixCard>('<hx-card>Body content here</hx-card>');
      const body = shadowQuery(el, '.card__body');
      expect(body).toBeTruthy();
      expect(el.textContent?.trim()).toContain('Body content here');
    });
  });

  // ─── Slot: heading (2) ───

  describe('Slot: heading', () => {
    it('heading content renders', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card><span slot="heading">Title</span>Body</hx-card>',
      );
      const headingSlot = el.querySelector('[slot="heading"]');
      expect(headingSlot).toBeTruthy();
      expect(headingSlot?.textContent).toBe('Title');
    });

    it('heading section hidden when empty', async () => {
      const el = await fixture<HelixCard>('<hx-card>Body only</hx-card>');
      const headingDiv = shadowQuery(el, '.card__heading')!;
      expect(headingDiv.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Slot: image (2) ───

  describe('Slot: image', () => {
    it('image content renders', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card><img slot="image" src="test.jpg" alt="test" />Body</hx-card>',
      );
      const img = el.querySelector('[slot="image"]');
      expect(img).toBeTruthy();
    });

    it('image section hidden when empty', async () => {
      const el = await fixture<HelixCard>('<hx-card>Body only</hx-card>');
      const imageDiv = shadowQuery(el, '.card__image')!;
      expect(imageDiv.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Slot: footer (2) ───

  describe('Slot: footer', () => {
    it('footer content renders', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card><span slot="footer">Footer text</span>Body</hx-card>',
      );
      const footer = el.querySelector('[slot="footer"]');
      expect(footer).toBeTruthy();
      expect(footer?.textContent).toBe('Footer text');
    });

    it('footer section hidden when empty', async () => {
      const el = await fixture<HelixCard>('<hx-card>Body only</hx-card>');
      const footerDiv = shadowQuery(el, '.card__footer')!;
      expect(footerDiv.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Slot: actions (2) ───

  describe('Slot: actions', () => {
    it('actions content renders', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card><button slot="actions">Action</button>Body</hx-card>',
      );
      const action = el.querySelector('[slot="actions"]');
      expect(action).toBeTruthy();
      expect(action?.textContent).toBe('Action');
    });

    it('actions section hidden when empty', async () => {
      const el = await fixture<HelixCard>('<hx-card>Body only</hx-card>');
      const actionsDiv = shadowQuery(el, '.card__actions')!;
      expect(actionsDiv.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── CSS Parts (3) ───

  describe('CSS Parts', () => {
    it('card part exposed', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const card = shadowQuery(el, '[part="card"]');
      expect(card).toBeTruthy();
    });

    it('image part exposed', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const image = shadowQuery(el, '[part="image"]');
      expect(image).toBeTruthy();
    });

    it('heading part exposed', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const heading = shadowQuery(el, '[part="heading"]');
      expect(heading).toBeTruthy();
    });

    it('body part exposed', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const body = shadowQuery(el, '[part="body"]');
      expect(body).toBeTruthy();
    });

    it('footer part exposed', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const footer = shadowQuery(el, '[part="footer"]');
      expect(footer).toBeTruthy();
    });

    it('actions part exposed', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      const actions = shadowQuery(el, '[part="actions"]');
      expect(actions).toBeTruthy();
    });
  });

  // ─── Interactive + Actions Anti-Pattern ───

  describe('Interactive + Actions slot (known limitation)', () => {
    it('renders both hx-href and actions slot content (ARIA anti-pattern — avoid in production)', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card hx-href="/test"><span slot="heading">Title</span><button slot="actions">Action</button></hx-card>',
      );
      const card = shadowQuery(el, '.card')!;
      // Card has role="link" when hx-href is set
      expect(card.getAttribute('role')).toBe('link');
      // Actions slot is populated (consumer's responsibility to avoid this combination)
      const action = el.querySelector('[slot="actions"]');
      expect(action).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card><span slot="heading">Title</span><p>Content</p></hx-card>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when interactive', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card hx-href="https://example.com"><span slot="heading">Title</span><p>Content</p></hx-card>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when interactive with hx-aria-label', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card hx-href="https://example.com" hx-aria-label="View patient record"><span slot="heading">Title</span><p>Content</p></hx-card>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'featured', 'compact']) {
        const el = await fixture<HelixCard>(
          `<hx-card variant="${variant}"><span slot="heading">Title</span><p>Content</p></hx-card>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    // P2-05: axe-core must cover the interactive card + actions slot combination
    it('has no axe violations — interactive card with hx-aria-label and actions slot', async () => {
      const el = await fixture<HelixCard>(
        '<hx-card hx-href="https://example.com" hx-aria-label="View patient record"><span slot="heading">Patient: Jane Doe</span><p>MRN: 885521</p><button slot="actions">View Chart</button></hx-card>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Horizontal Layout (known gap) ───

  describe('Horizontal layout (known gap)', () => {
    // P2-10: The audit spec calls out horizontal/vertical layout as an expected feature.
    // The component does not implement a horizontal layout variant. This test documents
    // the known gap so any future implementation will be caught by the test suite.
    it('does not have a horizontal layout property (known gap — not yet implemented)', async () => {
      const el = await fixture<HelixCard>('<hx-card>Content</hx-card>');
      // No "orientation" or "layout" property exists on the component
      expect((el as unknown as Record<string, unknown>)['orientation']).toBeUndefined();
      expect((el as unknown as Record<string, unknown>)['layout']).toBeUndefined();
    });
  });
});
