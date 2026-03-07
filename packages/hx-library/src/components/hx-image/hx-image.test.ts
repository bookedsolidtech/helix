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

  // ─── Property: decorative (3) ───

  describe('Property: decorative', () => {
    it('adds role=presentation and alt="" when decorative is set', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" decorative></hx-image>');
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBe('presentation');
      expect(img?.getAttribute('alt')).toBe('');
    });

    it('reflects decorative attribute to host', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" decorative></hx-image>');
      expect(el.hasAttribute('decorative')).toBe(true);
    });

    it('decorative prop takes precedence — sets role=presentation even when alt is provided', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Ignored" decorative></hx-image>');
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBe('presentation');
      expect(img?.getAttribute('alt')).toBe('');
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

  // ─── Property: rounded (4) ───

  describe('Property: rounded', () => {
    it('applies theme radius token when rounded attribute is present (empty string)', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" rounded></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_radius:var(--hx-border-radius-md');
    });

    it('applies custom CSS value when rounded is a non-empty string', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" rounded="1rem"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_radius:1rem');
    });

    it('applies 50% border-radius for circular images', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" rounded="50%"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_radius:50%');
    });

    it('does not apply border-radius when rounded="false"', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" rounded="false"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).not.toContain('--_radius');
    });
  });

  // ─── Property: ratio (2) ───

  describe('Property: ratio', () => {
    it('sets --_ratio CSS variable on the container', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" ratio="16/9"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_ratio:16/9');
    });

    it('does not set --_ratio when ratio is not provided', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).not.toContain('--_ratio');
    });
  });

  // ─── Property: fit (2) ───

  describe('Property: fit', () => {
    it('sets --_fit CSS variable on the container', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" fit="contain"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_fit:contain');
    });

    it('does not set --_fit when fit is not provided', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).not.toContain('--_fit');
    });
  });

  // ─── Property: width / height (4) ───

  describe('Property: width and height', () => {
    it('sets width in px when a number is provided', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" width="200"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('width:');
    });

    it('sets height in px when a number is provided', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" height="150"></hx-image>');
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('height:');
    });

    it('sets width attribute on the inner img element', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" width="320"></hx-image>');
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('width')).toBe('320');
    });

    it('sets height attribute on the inner img element', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test" height="240"></hx-image>');
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('height')).toBe('240');
    });
  });

  // ─── Property: srcset and sizes (3) ───

  describe('Property: srcset and sizes', () => {
    it('sets srcset attribute on the inner img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" srcset="https://example.com/img-400.png 400w, https://example.com/img-800.png 800w"></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('srcset')).toContain('400w');
      expect(img?.getAttribute('srcset')).toContain('800w');
    });

    it('sets sizes attribute on the inner img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" srcset="https://example.com/img-400.png 400w" sizes="(max-width: 600px) 100vw, 50vw"></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('sizes')).toContain('max-width');
    });

    it('omits srcset attribute when not provided', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.hasAttribute('srcset')).toBe(false);
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

    it('shows fallback slot and dispatches hx-error after fallback-src also fails', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" fallback-src="https://also-broken.url/fallback.jpg" alt="Test"><span slot="fallback" class="fb2">Unavailable</span></hx-image>',
      );

      // First error triggers fallback-src switch
      const firstImg = shadowQuery<HTMLImageElement>(el, 'img');
      firstImg!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      // Second error on fallback-src triggers full error state — listen before triggering
      const errorPromise = oneEvent(el, 'hx-error');
      const secondImg = shadowQuery<HTMLImageElement>(el, 'img');
      secondImg!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      // Assert hx-error was dispatched after both sources failed
      const event = await errorPromise;
      expect(event.type).toBe('hx-error');

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer).toBeTruthy();
    });
  });

  // ─── Error container (2) ───

  describe('Error container', () => {
    it('error container has role=alert for screen reader announcements', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>');
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer?.getAttribute('role')).toBe('alert');
    });

    it('error container has aria-live=polite attribute', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>');
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer?.getAttribute('aria-live')).toBe('polite');
    });
  });

  // ─── CSS Parts (1) ───

  describe('CSS Parts', () => {
    it('exposes "base" part on img element and "caption" part on figcaption', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt="Test"></hx-image>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
      expect(base?.getAttribute('part')).toBe('base');

      const caption = shadowQuery(el, '[part="caption"]');
      expect(caption).toBeTruthy();
      expect(caption?.tagName.toLowerCase()).toBe('figcaption');
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

    it('has no axe violations with decorative image (decorative prop)', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" decorative></hx-image>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with decorative image (alt empty string)', async () => {
      const el = await fixture<HelixImage>('<hx-image src="https://example.com/img.png" alt=""></hx-image>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
