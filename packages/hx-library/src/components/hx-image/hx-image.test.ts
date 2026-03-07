import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixImage } from './hx-image.js';
import './index.js';

afterEach(cleanup);

describe('hx-image', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders an img element inside shadow DOM', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      const img = shadowQuery(el, 'img');
      expect(img).toBeTruthy();
    });

    it('exposes "base" CSS part on the img element', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      const img = shadowQuery(el, '[part="base"]');
      expect(img).toBeTruthy();
      expect(img?.tagName.toLowerCase()).toBe('img');
    });

    it('applies default loading=lazy to the img', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });
  });

  // ─── Property: src (2) ───

  describe('Property: src', () => {
    it('sets the src attribute on the img element', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/photo.jpg" alt="Photo"></hx-image>');
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg');
    });

    it('reflects property to img src when changed', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/a.jpg" alt="A"></hx-image>');
      el.src = 'https://example.com/b.jpg';
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('src')).toBe('https://example.com/b.jpg');
    });
  });

  // ─── Property: alt / ARIA (4) ───

  describe('Property: alt and ARIA', () => {
    it('sets alt text on the img element', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Descriptive text"></hx-image>');
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('alt')).toBe('Descriptive text');
    });

    it('does NOT add role=presentation when alt is non-empty', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Descriptive text"></hx-image>');
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBeNull();
    });

    it('adds role=presentation when alt is empty string (decorative)', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt=""></hx-image>');
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBe('presentation');
    });

    it('does NOT add aria-label to the host element', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Photo"></hx-image>');
      expect(el.hasAttribute('aria-label')).toBe(false);
    });
  });

  // ─── Property: loading (2) ───

  describe('Property: loading', () => {
    it('defaults to loading=lazy', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });

    it('sets loading=eager when specified', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" loading="eager"></hx-image>');
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('eager');
    });
  });

  // ─── Events (2) ───

  describe('Events', () => {
    it('dispatches hx-load when image loads', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      expect(img).toBeTruthy();

      const loadPromise = oneEvent(el, 'hx-load');
      img!.dispatchEvent(new Event('load'));
      const event = await loadPromise;
      expect(event).toBeTruthy();
      expect(event.type).toBe('hx-load');
    });

    it('dispatches hx-error when image fails to load', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>');
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      expect(img).toBeTruthy();

      const errorPromise = oneEvent(el, 'hx-error');
      img!.dispatchEvent(new Event('error'));
      const event = await errorPromise;
      expect(event).toBeTruthy();
      expect(event.type).toBe('hx-error');
    });
  });

  // ─── Fallback (3) ───

  describe('Fallback', () => {
    it('shows fallback slot when image fails and no fallback-src is set', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"><span slot="fallback" class="fb">Broken</span></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer).toBeTruthy();

      const fallbackContent = el.querySelector('.fb');
      expect(fallbackContent).toBeTruthy();
      expect(fallbackContent?.textContent).toBe('Broken');
    });

    it('switches to fallback-src when primary src fails', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" fallback-src="https://example.com/fallback.jpg" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');

      // Simulate primary src error
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const updatedImg = shadowQuery<HTMLImageElement>(el, 'img');
      expect(updatedImg?.getAttribute('src')).toBe('https://example.com/fallback.jpg');
    });

    it('shows fallback slot after fallback-src also fails', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" fallback-src="https://also-broken.url/fallback.jpg" alt="Test"><span slot="fallback" class="fb2">Unavailable</span></hx-image>',
      );

      // First error triggers fallback-src switch
      const firstImg = shadowQuery<HTMLImageElement>(el, 'img');
      firstImg!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      // Second error on fallback-src triggers full error state
      const secondImg = shadowQuery<HTMLImageElement>(el, 'img');
      secondImg!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer).toBeTruthy();
    });
  });

  // ─── CSS Parts (1) ───

  describe('CSS Parts', () => {
    it('exposes "base" part on img element', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
      expect(base?.getAttribute('part')).toBe('base');
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations with informative image (alt provided)', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="A descriptive label"></hx-image>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with decorative image (alt empty)', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt=""></hx-image>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
