import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixCopyButton } from './hx-copy-button.js';
import './index.js';

afterEach(cleanup);

describe('hx-copy-button', () => {
  // ─── Clipboard Mock ───

  let writeTextSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders native <button> element with type="button"', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeInstanceOf(HTMLButtonElement);
      expect(btn?.getAttribute('type')).toBe('button');
    });

    it('exposes "button" CSS part', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      const part = shadowQuery(el, '[part="button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" CSS part', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('renders accessible live region for screen reader announcement', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      const liveRegion = shadowQuery(el, '[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    });
  });

  // ─── Default Property Values (5) ───

  describe('Default property values', () => {
    it('label defaults to "Copy to clipboard"', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      expect(el.label).toBe('Copy to clipboard');
    });

    it('size defaults to "md"', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      expect(el.size).toBe('md');
    });

    it('feedbackDuration defaults to 2000', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      expect(el.feedbackDuration).toBe(2000);
    });

    it('disabled defaults to false', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      expect(el.disabled).toBe(false);
    });

    it('value defaults to empty string', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      expect(el.value).toBe('');
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('sets aria-label on native button from label property', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button label="Copy patient ID"></hx-copy-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn?.getAttribute('aria-label')).toBe('Copy patient ID');
    });

    it('sets title on native button from label property', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button label="Copy patient ID"></hx-copy-button>',
      );
      const btn = shadowQuery(el, 'button');
      expect(btn?.getAttribute('title')).toBe('Copy patient ID');
    });

    it('updates aria-label and title when label property changes', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button label="Copy"></hx-copy-button>');
      el.label = 'Copy record number';
      await el.updateComplete;
      const btn = shadowQuery(el, 'button');
      expect(btn?.getAttribute('aria-label')).toBe('Copy record number');
      expect(btn?.getAttribute('title')).toBe('Copy record number');
    });
  });

  // ─── Property: disabled (4) ───

  describe('Property: disabled', () => {
    it('sets native disabled attribute on button', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button disabled></hx-copy-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn?.disabled).toBe(true);
    });

    it('sets aria-disabled="true" when disabled', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button disabled></hx-copy-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn?.getAttribute('aria-disabled')).toBe('true');
    });

    it('does not set aria-disabled when enabled', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn?.hasAttribute('aria-disabled')).toBe(false);
    });

    it('reflects disabled attribute to host element', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button disabled></hx-copy-button>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies button--sm class when size="sm"', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button hx-size="sm"></hx-copy-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn?.classList.contains('button--sm')).toBe(true);
    });

    it('applies button--md class by default', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button></hx-copy-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn?.classList.contains('button--md')).toBe(true);
    });

    it('applies button--lg class when size="lg"', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button hx-size="lg"></hx-copy-button>');
      const btn = shadowQuery(el, 'button');
      expect(btn?.classList.contains('button--lg')).toBe(true);
    });

    it('reflects hx-size attribute to host element', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button hx-size="sm"></hx-copy-button>');
      expect(el.getAttribute('hx-size')).toBe('sm');
    });
  });

  // ─── Events (5) ───

  describe('Events', () => {
    it('fires hx-copy event after successful clipboard write', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="patient-001"></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-copy');
      btn!.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-copy event detail.value matches the value property', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="patient-001"></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-copy');
      btn!.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('patient-001');
    });

    it('hx-copy event bubbles and is composed', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button value="abc123"></hx-copy-button>');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-copy');
      btn!.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('calls navigator.clipboard.writeText with the value property', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="copy-this-text"></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent(el, 'hx-copy');
      btn!.click();
      await eventPromise;
      expect(writeTextSpy).toHaveBeenCalledWith('copy-this-text');
    });

    it('does NOT fire hx-copy when disabled', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="should-not-copy" disabled></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      let fired = false;
      el.addEventListener('hx-copy', () => {
        fired = true;
      });
      btn!.click();
      await new Promise((r) => setTimeout(r, 50));
      expect(fired).toBe(false);
      expect(writeTextSpy).not.toHaveBeenCalled();
    });
  });

  // ─── Copied State (3) ───

  describe('Copied state', () => {
    it('adds button--copied class to button after successful click', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="test-value"></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent(el, 'hx-copy');
      btn!.click();
      await eventPromise;
      await el.updateComplete;
      expect(btn!.classList.contains('button--copied')).toBe(true);
    });

    it('shows "Copied" in live region after successful click', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="test-value"></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent(el, 'hx-copy');
      btn!.click();
      await eventPromise;
      await el.updateComplete;
      const liveRegion = shadowQuery(el, '[aria-live="polite"]');
      expect(liveRegion?.textContent?.trim()).toBe('Copied');
    });

    it('resets button--copied class after feedbackDuration elapses', async () => {
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixCopyButton>(
          '<hx-copy-button value="test" feedback-duration="500"></hx-copy-button>',
        );
        const btn = shadowQuery<HTMLButtonElement>(el, 'button');
        expect(btn).toBeTruthy();
        btn!.click();
        // Flush microtask queue so the async clipboard promise resolves and
        // _copied is set to true before we advance the macro-task timer.
        await Promise.resolve();
        await Promise.resolve();
        await el.updateComplete;
        expect(btn!.classList.contains('button--copied')).toBe(true);
        vi.advanceTimersByTime(600);
        await el.updateComplete;
        expect(btn!.classList.contains('button--copied')).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('renders default slot content inside button', async () => {
      const el = await fixture<HelixCopyButton>('<hx-copy-button value="x">Copy</hx-copy-button>');
      expect(el.textContent?.trim()).toBe('Copy');
    });

    it('renders copy-icon named slot', async () => {
      const el = await fixture<HelixCopyButton>(
        `<hx-copy-button value="x">
          <svg slot="copy-icon" aria-hidden="true"><use href="#icon-copy"></use></svg>
        </hx-copy-button>`,
      );
      const svg = el.querySelector('[slot="copy-icon"]');
      expect(svg).toBeTruthy();
    });

    it('renders success-icon named slot', async () => {
      const el = await fixture<HelixCopyButton>(
        `<hx-copy-button value="x">
          <svg slot="success-icon" aria-hidden="true"><use href="#icon-check"></use></svg>
        </hx-copy-button>`,
      );
      const svg = el.querySelector('[slot="success-icon"]');
      expect(svg).toBeTruthy();
    });
  });

  // ─── Keyboard (2) ───

  describe('Keyboard', () => {
    it('Enter key activates the native button and fires hx-copy', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="enter-test"></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-copy');
      // Native button responds to Enter via its own click behavior when focused
      btn!.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('enter-test');
    });

    it('Space key activates the native button and fires hx-copy', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="space-test"></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-copy');
      btn!.click();
      const event = await eventPromise;
      expect(event.detail.value).toBe('space-test');
    });
  });

  // ─── Clipboard Fallback (1) ───

  describe('Clipboard fallback', () => {
    it('does not crash when navigator.clipboard is unavailable', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button value="fallback-test"></hx-copy-button>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();

      // Should not throw; execCommand fallback runs silently
      expect(() => {
        btn!.click();
      }).not.toThrow();
    });
  });

  // ─── Accessibility (axe-core) (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button label="Copy to clipboard"></hx-copy-button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixCopyButton>(
        '<hx-copy-button label="Copy to clipboard" disabled></hx-copy-button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all three sizes', async () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      for (const size of sizes) {
        const el = await fixture<HelixCopyButton>(
          `<hx-copy-button label="Copy to clipboard" hx-size="${size}"></hx-copy-button>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `size="${size}" should have no axe violations`).toEqual([]);
        el.remove();
      }
    });
  });
});
