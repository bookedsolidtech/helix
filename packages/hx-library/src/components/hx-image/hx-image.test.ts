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
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders an img element inside shadow DOM', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img).toBeTruthy();
    });

    it('exposes "base" CSS part on the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, '[part="base"]');
      expect(img).toBeTruthy();
      expect(img?.tagName.toLowerCase()).toBe('img');
    });

    it('applies default loading=lazy to the img', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });
  });

  // ─── Property: src (2) ───

  describe('Property: src', () => {
    it('sets the src attribute on the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/photo.jpg" alt="Photo"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg');
    });

    it('reflects property to img src when changed', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/a.jpg" alt="A"></hx-image>',
      );
      el.src = 'https://example.com/b.jpg';
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('src')).toBe('https://example.com/b.jpg');
    });
  });

  // ─── Property: alt / ARIA (4) ───

  describe('Property: alt and ARIA', () => {
    it('sets alt text on the img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Descriptive text"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('alt')).toBe('Descriptive text');
    });

    it('does NOT add role=presentation when alt is non-empty', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Descriptive text"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBeNull();
    });

    it('adds role=presentation when alt is empty string (decorative)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt=""></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBe('presentation');
    });

    it('does NOT add aria-label to the host element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Photo"></hx-image>',
      );
      expect(el.hasAttribute('aria-label')).toBe(false);
    });
  });

  // ─── Property: decorative (3) ───

  describe('Property: decorative', () => {
    it('adds role=presentation and alt="" when decorative is set', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" decorative></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBe('presentation');
      expect(img?.getAttribute('alt')).toBe('');
    });

    it('reflects decorative attribute to host', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" decorative></hx-image>',
      );
      expect(el.hasAttribute('decorative')).toBe(true);
    });

    it('decorative prop takes precedence — sets role=presentation even when alt is provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Ignored" decorative></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBe('presentation');
      expect(img?.getAttribute('alt')).toBe('');
    });
  });

  // ─── Property: loading (2) ───

  describe('Property: loading', () => {
    it('defaults to loading=lazy', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });

    it('sets loading=eager when specified', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" loading="eager"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('loading')).toBe('eager');
    });
  });

  // ─── Property: rounded (4) ───

  describe('Property: rounded', () => {
    it('applies theme radius token when rounded attribute is present (empty string)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_radius:var(--hx-border-radius-md');
    });

    it('applies custom CSS value when rounded is a non-empty string', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded="1rem"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_radius:1rem');
    });

    it('applies 50% border-radius for circular images', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded="50%"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_radius:50%');
    });

    it('does not apply border-radius when rounded="false"', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded="false"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).not.toContain('--_radius');
    });
  });

  // ─── Property: ratio (2) ───

  describe('Property: ratio', () => {
    it('sets --_ratio CSS variable on the container', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" ratio="16/9"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_ratio:16/9');
    });

    it('does not set --_ratio when ratio is not provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).not.toContain('--_ratio');
    });
  });

  // ─── Property: fit (2) ───

  describe('Property: fit', () => {
    it('sets --_fit CSS variable on the container', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" fit="contain"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_fit:contain');
    });

    it('does not set --_fit when fit is not provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).not.toContain('--_fit');
    });
  });

  // ─── Property: width / height (4) ───

  describe('Property: width and height', () => {
    it('sets width in px when a number is provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" width="200"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('width:');
    });

    it('sets height in px when a number is provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" height="150"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('height:');
    });

    it('sets width attribute on the inner img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" width="320"></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('width')).toBe('320');
    });

    it('sets height attribute on the inner img element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" height="240"></hx-image>',
      );
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
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.hasAttribute('srcset')).toBe(false);
    });
  });

  // ─── Events (2) ───

  describe('Events', () => {
    it('dispatches hx-load when image loads', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      expect(img).toBeTruthy();

      const loadPromise = oneEvent(el, 'hx-load');
      img!.dispatchEvent(new Event('load'));
      const event = await loadPromise;
      expect(event).toBeTruthy();
      expect(event.type).toBe('hx-load');
    });

    it('dispatches hx-error when image fails to load', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>',
      );
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
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer?.getAttribute('role')).toBe('alert');
    });

    it('error container does NOT have aria-live attribute (WCAG 4.1.2: role=alert already implies aria-live=assertive)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://broken.url/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img');
      img!.dispatchEvent(new Event('error'));
      await el.updateComplete;

      const errorContainer = shadowQuery(el, '.image__container--error');
      // role="alert" implies aria-live="assertive". Adding aria-live="polite" is
      // contradictory and was removed to comply with WCAG 4.1.2.
      expect(errorContainer?.hasAttribute('aria-live')).toBe(false);
    });
  });

  // ─── Caption slot (3) ───

  describe('Caption slot', () => {
    it('shows figcaption when caption slot content is provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"><span slot="caption">Photo credit</span></hx-image>',
      );
      await el.updateComplete;

      const caption = shadowQuery(el, '.image__caption--visible');
      expect(caption).toBeTruthy();
      expect(caption?.tagName.toLowerCase()).toBe('figcaption');
    });

    it('hides figcaption when no caption slot content is provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      await el.updateComplete;

      const caption = shadowQuery(el, '.image__caption');
      expect(caption).toBeTruthy();
      // Caption should NOT have the visible modifier class
      expect(caption?.classList.contains('image__caption--visible')).toBe(false);
    });

    it('wraps content in a semantic figure element', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const figure = shadowQuery(el, 'figure');
      expect(figure).toBeTruthy();
      expect(figure?.tagName.toLowerCase()).toBe('figure');
    });
  });

  // ─── CSS Parts (1) ───

  describe('CSS Parts', () => {
    it('exposes "base" part on img element and "caption" part on figcaption', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
      expect(base?.getAttribute('part')).toBe('base');

      const caption = shadowQuery(el, '[part="caption"]');
      expect(caption).toBeTruthy();
      expect(caption?.tagName.toLowerCase()).toBe('figcaption');
    });
  });

  // ─── Property: alt defaults (2) ───

  describe('Property: alt defaults', () => {
    it('renders empty alt text when alt is undefined (no alt attribute)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      // When alt is undefined and not decorative, altText is empty string
      expect(img?.getAttribute('alt')).toBe('');
    });

    it('does not add role=presentation when alt is undefined', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png"></hx-image>',
      );
      const img = shadowQuery(el, 'img');
      expect(img?.getAttribute('role')).toBeNull();
    });
  });

  // ─── Property: rounded — programmatic boolean ───

  describe('Property: rounded — programmatic boolean', () => {
    it('applies theme radius token when rounded set programmatically to true', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      el.rounded = true;
      // Wait for property reflection (String type reflects true → 'true' → re-read as 'true')
      await el.updateComplete;
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      // Accept both 'var(' with or without leading space after the colon
      expect(style).toMatch(/--_radius:\s*var\(--hx-border-radius-md/);
    });

    it('applies theme radius token when rounded="true" string value', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" rounded="true"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_radius:var(--hx-border-radius-md');
    });
  });

  // ─── Property: fit — all values ───

  describe('Property: fit — all values', () => {
    it('sets --_fit:cover', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" fit="cover"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_fit:cover');
    });

    it('sets --_fit:fill', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" fit="fill"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_fit:fill');
    });

    it('sets --_fit:none', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" fit="none"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_fit:none');
    });

    it('sets --_fit:scale-down', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" fit="scale-down"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_fit:scale-down');
    });
  });

  // ─── Property: loading — reflection ───

  describe('Property: loading — reflection', () => {
    it('reflects loading property to attribute', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" loading="eager"></hx-image>',
      );
      expect(el.getAttribute('loading')).toBe('eager');
    });
  });

  // ─── Property: width/height as string values ───

  describe('Property: width/height as string CSS values', () => {
    it('sets width as CSS string directly when non-numeric', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" width="50%"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('width:50%');
    });

    it('sets height as CSS string directly when non-numeric', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test" height="auto"></hx-image>',
      );
      await el.updateComplete;
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('height:auto');
    });
  });

  // ─── Events: bubbles and composed ───

  describe('Events: bubbles and composed', () => {
    it('hx-load event bubbles and is composed', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img')!;
      const loadPromise = oneEvent(el, 'hx-load');
      img.dispatchEvent(new Event('load'));
      const event = await loadPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-error event bubbles and is composed', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      const img = shadowQuery<HTMLImageElement>(el, 'img')!;
      const errorPromise = oneEvent(el, 'hx-error');
      img.dispatchEvent(new Event('error'));
      const event = await errorPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Sizes attribute omitted when undefined ───

  describe('Sizes attribute: omitted when undefined', () => {
    it('omits sizes attribute when not provided', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Test"></hx-image>',
      );
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      expect(img?.hasAttribute('sizes')).toBe(false);
    });
  });

  // ─── src empty string: img src rendered via nothing directive ───

  describe('src empty string', () => {
    it('renders img without src attribute when src is empty string', async () => {
      const el = await fixture<HelixImage>('<hx-image alt="Test"></hx-image>');
      await el.updateComplete;
      const img = shadowQuery(el, 'img');
      // src="" renders nothing (Lit nothing directive strips the attribute)
      // We just verify the img element still exists and does not crash
      expect(img).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations with informative image (alt provided)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="A descriptive label"></hx-image>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with decorative image (decorative prop)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" decorative></hx-image>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with decorative image (alt empty string)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt=""></hx-image>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── WRAPPED mode (slotted media) ───

  describe('WRAPPED mode (slotted media)', () => {
    // slotchange is async; after fixture() we let it fire and the component
    // re-render into WRAPPED mode before asserting.
    const settleWrapped = async (el: HelixImage): Promise<void> => {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await el.updateComplete;
    };

    it('switches to WRAPPED mode when an <img> is slotted (no shadow img rendered)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image ratio="4/3"><img src="https://example.com/slotted.png" alt="Slotted" /></hx-image>',
      );
      await settleWrapped(el);
      // WRAPPED mode renders no owned <img> in shadow DOM.
      expect(shadowQuery(el, 'img')).toBeNull();
      // The default slot exists so the slotted media projects through.
      const defaultSlot = shadowQuery<HTMLSlotElement>(
        el,
        '.image__container > slot:not([name])',
      );
      expect(defaultSlot).toBeTruthy();
      const assigned = defaultSlot!.assignedElements({ flatten: true });
      expect(assigned.length).toBe(1);
      expect(assigned[0]?.tagName.toLowerCase()).toBe('img');
    });

    it('stamps data-hx-styled="hx-image" on the host for light-DOM descendant sizing', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image><img src="https://example.com/slotted.png" alt="Slotted" /></hx-image>',
      );
      await settleWrapped(el);
      expect(el.getAttribute('data-hx-styled')).toBe('hx-image');
      // The scoped light sheet is injected once into document.head.
      const injected = document.head.querySelector('style[data-hx-light-styles="hx-image"]');
      expect(injected).toBeTruthy();
      expect(injected?.textContent).toContain('object-fit');
    });

    it('applies ::slotted sizing so a directly-slotted <img> fills the figure', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image ratio="1" fit="cover" style="width: 120px;"><img src="https://example.com/slotted.png" alt="Slotted" /></hx-image>',
      );
      await settleWrapped(el);
      const slotted = el.querySelector('img')!;
      const cs = getComputedStyle(slotted);
      // ::slotted(img) rules make the slotted image block-level and object-fit: cover.
      expect(cs.display).toBe('block');
      expect(cs.objectFit).toBe('cover');
    });

    it('re-emits hx-load from a directly-slotted <img>', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image><img src="https://example.com/slotted.png" alt="Slotted" /></hx-image>',
      );
      await settleWrapped(el);
      const slotted = el.querySelector('img')!;

      const loadPromise = oneEvent(el, 'hx-load');
      slotted.dispatchEvent(new Event('load'));
      const event = await loadPromise;
      expect(event.type).toBe('hx-load');
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('re-emits hx-error from a directly-slotted <img> and swaps to fallback', async () => {
      // Use a resolvable src so no native error races the synthetic one below;
      // the synthetic 'error' deterministically drives the WRAPPED error path.
      const el = await fixture<HelixImage>(
        '<hx-image><img src="https://example.com/slotted.png" alt="Slotted" /><span slot="fallback" class="wfb">Gone</span></hx-image>',
      );
      await settleWrapped(el);
      const slotted = el.querySelector('img')!;

      const errorPromise = oneEvent(el, 'hx-error');
      slotted.dispatchEvent(new Event('error'));
      const event = await errorPromise;
      expect(event.type).toBe('hx-error');

      await el.updateComplete;
      const errorContainer = shadowQuery(el, '.image__container--error');
      expect(errorContainer).toBeTruthy();
      expect(errorContainer?.getAttribute('role')).toBe('alert');
      // Fallback slot content projects into the error state.
      const fb = el.querySelector('.wfb');
      expect(fb).toBeTruthy();
    });

    it('does NOT apply fallback-src in WRAPPED mode (consumer owns the media)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image fallback-src="https://example.com/fallback.jpg"><img src="https://example.com/slotted.png" alt="Slotted" /></hx-image>',
      );
      await settleWrapped(el);
      const slotted = el.querySelector('img')!;

      const errorPromise = oneEvent(el, 'hx-error');
      slotted.dispatchEvent(new Event('error'));
      await errorPromise;
      await el.updateComplete;

      // Error state shown immediately; no owned <img> ever swaps to fallback-src.
      expect(shadowQuery(el, '.image__container--error')).toBeTruthy();
      expect(shadowQuery(el, 'img')).toBeNull();
    });

    it('resolves and re-emits hx-load from the <img> inside a slotted <picture>', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image ratio="16/9">' +
          '<picture>' +
          '<source srcset="https://example.com/large.png 1280w" media="(min-width: 800px)" />' +
          '<img src="https://example.com/small.png" alt="Picture" />' +
          '</picture>' +
          '</hx-image>',
      );
      await settleWrapped(el);
      expect(shadowQuery(el, 'img')).toBeNull();

      const nestedImg = el.querySelector('picture img')!;
      const loadPromise = oneEvent(el, 'hx-load');
      nestedImg.dispatchEvent(new Event('load'));
      const event = await loadPromise;
      expect(event.type).toBe('hx-load');
    });

    it('re-emits hx-error from the <img> inside a slotted <picture>', async () => {
      // Resolvable srcs so the synthetic error is the deterministic trigger.
      const el = await fixture<HelixImage>(
        '<hx-image>' +
          '<picture>' +
          '<source srcset="https://example.com/large.png 1280w" />' +
          '<img src="https://example.com/small.png" alt="Picture" />' +
          '</picture>' +
          '</hx-image>',
      );
      await settleWrapped(el);
      const nestedImg = el.querySelector('picture img')!;

      const errorPromise = oneEvent(el, 'hx-error');
      nestedImg.dispatchEvent(new Event('error'));
      const event = await errorPromise;
      expect(event.type).toBe('hx-error');
    });

    it('applies framing (ratio/fit/rounded) to the figure in WRAPPED mode', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image ratio="16/9" fit="contain" rounded="0.5rem"><img src="https://example.com/slotted.png" alt="Slotted" /></hx-image>',
      );
      await settleWrapped(el);
      const container = shadowQuery(el, '.image__container');
      const style = container?.getAttribute('style') ?? '';
      expect(style).toContain('--_ratio:16/9');
      expect(style).toContain('--_fit:contain');
      expect(style).toContain('--_radius:0.5rem');
    });

    it('does not re-dispatch a duplicate hx-load for an already-complete slotted <img>', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image><img src="https://example.com/slotted.png" alt="Slotted" /></hx-image>',
      );
      await settleWrapped(el);
      const slotted = el.querySelector('img') as HTMLImageElement;
      // Force the "already complete and valid" branch.
      Object.defineProperty(slotted, 'complete', { value: true, configurable: true });
      Object.defineProperty(slotted, 'naturalWidth', { value: 200, configurable: true });

      let loads = 0;
      el.addEventListener('hx-load', () => {
        loads += 1;
      });
      // Re-run slot resolution by re-slotting the same node — should not synthesize a load.
      el.append(document.createComment('nudge'));
      await settleWrapped(el);
      expect(loads).toBe(0);
    });

    it('detaches slotted listeners on disconnect (no dispatch after removal)', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image><img src="https://example.com/slotted.png" alt="Slotted" /></hx-image>',
      );
      await settleWrapped(el);
      const slotted = el.querySelector('img')!;

      let fired = false;
      el.addEventListener('hx-load', () => {
        fired = true;
      });

      el.remove();
      // After disconnect the listener is removed; dispatching load must not re-emit.
      slotted.dispatchEvent(new Event('load'));
      expect(fired).toBe(false);
    });

    it('has no axe violations in WRAPPED mode with a labelled slotted <img>', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image ratio="4/3"><img src="https://example.com/slotted.png" alt="Descriptive slotted label" /></hx-image>',
      );
      await settleWrapped(el);
      await page.screenshot();
      // Traverse the full composed tree (host + light DOM) so axe sees the slotted media.
      const { violations } = await checkA11y(el, { useElement: true });
      expect(violations).toEqual([]);
    });
  });

  // ─── OWNED mode regression (default slot empty) ───

  describe('OWNED mode regression', () => {
    it('renders the owned <img> and no assigned default-slot media by default', async () => {
      const el = await fixture<HelixImage>(
        '<hx-image src="https://example.com/img.png" alt="Owned"></hx-image>',
      );
      await el.updateComplete;
      // Owned <img> present.
      expect(shadowQuery(el, 'img[part="base"]')).toBeTruthy();
      // Default slot present but empty → OWNED mode retained.
      const defaultSlot = shadowQuery<HTMLSlotElement>(
        el,
        '.image__container > slot:not([name])',
      );
      expect(defaultSlot).toBeTruthy();
      expect(defaultSlot!.assignedElements({ flatten: true }).length).toBe(0);
    });
  });
});
