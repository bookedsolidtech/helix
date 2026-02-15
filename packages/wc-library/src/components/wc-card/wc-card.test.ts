import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, shadowQueryAll, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcCard } from './wc-card.js';
import './index.js';

afterEach(cleanup);

describe('wc-card', () => {

  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "card" CSS part', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const card = shadowQuery(el, '[part="card"]');
      expect(card).toBeTruthy();
    });

    it('applies default variant + elevation classes', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--default')).toBe(true);
      expect(card.classList.contains('card--flat')).toBe(true);
    });

    it('renders container div', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const card = shadowQuery(el, 'div.card');
      expect(card).toBeTruthy();
    });
  });

  // ─── Property: variant (3) ───

  describe('Property: variant', () => {
    it('applies default class', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--default')).toBe(true);
    });

    it('applies featured class', async () => {
      const el = await fixture<WcCard>('<wc-card variant="featured">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--featured')).toBe(true);
    });

    it('applies compact class', async () => {
      const el = await fixture<WcCard>('<wc-card variant="compact">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--compact')).toBe(true);
    });
  });

  // ─── Property: elevation (3) ───

  describe('Property: elevation', () => {
    it('flat applies no shadow class', async () => {
      const el = await fixture<WcCard>('<wc-card elevation="flat">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--flat')).toBe(true);
    });

    it('raised applies medium shadow class', async () => {
      const el = await fixture<WcCard>('<wc-card elevation="raised">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--raised')).toBe(true);
    });

    it('floating applies large shadow class', async () => {
      const el = await fixture<WcCard>('<wc-card elevation="floating">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--floating')).toBe(true);
    });
  });

  // ─── Property: wc-href (4) ───

  describe('Property: wc-href', () => {
    it('has no role when no wc-href', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.hasAttribute('role')).toBe(false);
    });

    it('has role="link" when wc-href set', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.getAttribute('role')).toBe('link');
    });

    it('has tabindex="0" when wc-href set', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.getAttribute('tabindex')).toBe('0');
    });

    it('has aria-label="Navigate to {wc-href}" when wc-href set', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.getAttribute('aria-label')).toBe('Navigate to /test');
    });
  });

  // ─── Interactivity (3) ───

  describe('Interactivity', () => {
    it('applies card--interactive class when wc-href', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--interactive')).toBe(true);
    });

    it('does not apply card--interactive without wc-href', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      expect(card.classList.contains('card--interactive')).toBe(false);
    });

    it('has cursor:pointer when interactive', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      const styles = getComputedStyle(card);
      expect(styles.cursor).toBe('pointer');
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches wc-card-click when wc-href + click', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      const eventPromise = oneEvent(el, 'wc-card-click');
      card.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('wc-card-click detail contains url and originalEvent', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-card-click');
      card.click();
      const event = await eventPromise;
      expect(event.detail.url).toBe('/test');
      expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('does NOT dispatch event without wc-href', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      let fired = false;
      el.addEventListener('wc-card-click', () => { fired = true; });
      card.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Keyboard (3) ───

  describe('Keyboard', () => {
    it('Enter fires wc-card-click when interactive', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-card-click');
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.url).toBe('/test');
    });

    it('Space fires wc-card-click when interactive', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="/test">Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-card-click');
      card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event.detail.url).toBe('/test');
    });

    it('no keyboard action without wc-href', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const card = shadowQuery(el, '.card')!;
      let fired = false;
      el.addEventListener('wc-card-click', () => { fired = true; });
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
    });
  });

  // ─── Slot: default (1) ───

  describe('Slot: default', () => {
    it('body content renders in card__body', async () => {
      const el = await fixture<WcCard>('<wc-card>Body content here</wc-card>');
      const body = shadowQuery(el, '.card__body');
      expect(body).toBeTruthy();
      expect(el.textContent?.trim()).toContain('Body content here');
    });
  });

  // ─── Slot: heading (2) ───

  describe('Slot: heading', () => {
    it('heading content renders', async () => {
      const el = await fixture<WcCard>('<wc-card><span slot="heading">Title</span>Body</wc-card>');
      const headingSlot = el.querySelector('[slot="heading"]');
      expect(headingSlot).toBeTruthy();
      expect(headingSlot?.textContent).toBe('Title');
    });

    it('heading section hidden when empty', async () => {
      const el = await fixture<WcCard>('<wc-card>Body only</wc-card>');
      const headingDiv = shadowQuery(el, '.card__heading')!;
      expect(headingDiv.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Slot: image (2) ───

  describe('Slot: image', () => {
    it('image content renders', async () => {
      const el = await fixture<WcCard>('<wc-card><img slot="image" src="test.jpg" alt="test" />Body</wc-card>');
      const img = el.querySelector('[slot="image"]');
      expect(img).toBeTruthy();
    });

    it('image section hidden when empty', async () => {
      const el = await fixture<WcCard>('<wc-card>Body only</wc-card>');
      const imageDiv = shadowQuery(el, '.card__image')!;
      expect(imageDiv.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Slot: footer (2) ───

  describe('Slot: footer', () => {
    it('footer content renders', async () => {
      const el = await fixture<WcCard>('<wc-card><span slot="footer">Footer text</span>Body</wc-card>');
      const footer = el.querySelector('[slot="footer"]');
      expect(footer).toBeTruthy();
      expect(footer?.textContent).toBe('Footer text');
    });

    it('footer section hidden when empty', async () => {
      const el = await fixture<WcCard>('<wc-card>Body only</wc-card>');
      const footerDiv = shadowQuery(el, '.card__footer')!;
      expect(footerDiv.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Slot: actions (2) ───

  describe('Slot: actions', () => {
    it('actions content renders', async () => {
      const el = await fixture<WcCard>('<wc-card><button slot="actions">Action</button>Body</wc-card>');
      const action = el.querySelector('[slot="actions"]');
      expect(action).toBeTruthy();
      expect(action?.textContent).toBe('Action');
    });

    it('actions section hidden when empty', async () => {
      const el = await fixture<WcCard>('<wc-card>Body only</wc-card>');
      const actionsDiv = shadowQuery(el, '.card__actions')!;
      expect(actionsDiv.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── CSS Parts (3) ───

  describe('CSS Parts', () => {
    it('heading part exposed', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const heading = shadowQuery(el, '[part="heading"]');
      expect(heading).toBeTruthy();
    });

    it('body part exposed', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const body = shadowQuery(el, '[part="body"]');
      expect(body).toBeTruthy();
    });

    it('footer part exposed', async () => {
      const el = await fixture<WcCard>('<wc-card>Content</wc-card>');
      const footer = shadowQuery(el, '[part="footer"]');
      expect(footer).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcCard>('<wc-card><span slot="heading">Title</span><p>Content</p></wc-card>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when interactive', async () => {
      const el = await fixture<WcCard>('<wc-card wc-href="https://example.com"><span slot="heading">Title</span><p>Content</p></wc-card>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'featured', 'compact']) {
        const el = await fixture<WcCard>(`<wc-card variant="${variant}"><span slot="heading">Title</span><p>Content</p></wc-card>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });

});
