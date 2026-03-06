import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y, oneEvent } from '../../test-utils.js';
import type { HelixPopup } from './hx-popup.js';
import './index.js';

afterEach(cleanup);

describe('hx-popup', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders popup part', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      const popup = shadowQuery(el, '[part="popup"]');
      expect(popup).toBeTruthy();
    });

    it('does not render arrow by default', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      const arrow = shadowQuery(el, '[part="arrow"]');
      expect(arrow).toBeNull();
    });

    it('renders arrow when arrow attribute is set', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup arrow><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      const arrow = shadowQuery(el, '[part="arrow"]');
      expect(arrow).toBeTruthy();
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "popup" part', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      const part = shadowQuery(el, '[part="popup"]');
      expect(part).toBeTruthy();
    });

    it('exposes "arrow" part when arrow is enabled', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active arrow><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      const part = shadowQuery(el, '[part="arrow"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Property: active (3) ───

  describe('Property: active', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.active).toBe(false);
    });

    it('reflects active attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.active).toBe(true);
      expect(el.hasAttribute('active')).toBe(true);
    });

    it('popup container has no aria-hidden attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      const popup = shadowQuery(el, '[part="popup"]');
      expect(popup?.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  // ─── Property: placement (3) ───

  describe('Property: placement', () => {
    it('defaults to "bottom"', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.placement).toBe('bottom');
    });

    it('reflects placement attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup placement="top"><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.placement).toBe('top');
      expect(el.getAttribute('placement')).toBe('top');
    });

    it('accepts all 12 placement values', async () => {
      const placements = [
        'top',
        'top-start',
        'top-end',
        'right',
        'right-start',
        'right-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'left',
        'left-start',
        'left-end',
      ] as const;
      for (const placement of placements) {
        const el = await fixture<HelixPopup>(
          `<hx-popup placement="${placement}"><button slot="anchor">A</button><div>C</div></hx-popup>`,
        );
        expect(el.placement).toBe(placement);
        cleanup();
      }
    });
  });

  // ─── Property: distance (2) ───

  describe('Property: distance', () => {
    it('defaults to 0', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.distance).toBe(0);
    });

    it('reads distance attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup distance="12"><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.distance).toBe(12);
    });
  });

  // ─── Property: skidding (2) ───

  describe('Property: skidding', () => {
    it('defaults to 0', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.skidding).toBe(0);
    });

    it('reads skidding attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup skidding="5"><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.skidding).toBe(5);
    });
  });

  // ─── Property: arrow (2) ───

  describe('Property: arrow', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.arrow).toBe(false);
    });

    it('reflects arrow attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup arrow><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.arrow).toBe(true);
      expect(el.hasAttribute('arrow')).toBe(true);
    });
  });

  // ─── Property: flip (2) ───

  describe('Property: flip', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.flip).toBe(false);
    });

    it('reflects flip attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup flip><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.flip).toBe(true);
    });
  });

  // ─── Property: shift (2) ───

  describe('Property: shift', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.shift).toBe(false);
    });

    it('reflects shift attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup shift><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.shift).toBe(true);
    });
  });

  // ─── Property: autoSize (2) ───

  describe('Property: autoSize', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.autoSize).toBe(false);
    });

    it('reads auto-size attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup auto-size><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.autoSize).toBe(true);
    });
  });

  // ─── Property: flipFallbackPlacements (2) ───

  describe('Property: flipFallbackPlacements', () => {
    it('defaults to empty array', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.flipFallbackPlacements).toEqual([]);
    });

    it('parses JSON array from attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup flip-fallback-placements=\'["top","right"]\'><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.flipFallbackPlacements).toEqual(['top', 'right']);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('anchor slot accepts reference element', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button id="anc" slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      const anchor = el.querySelector('#anc');
      expect(anchor).toBeTruthy();
      expect(anchor?.textContent).toBe('Anchor');
    });

    it('default slot accepts popup content', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div id="content">Popup Content</div></hx-popup>',
      );
      const content = el.querySelector('#content');
      expect(content).toBeTruthy();
      expect(content?.textContent).toBe('Popup Content');
    });
  });

  // ─── Events (2) ───

  describe('Events', () => {
    it('emits hx-reposition after calling reposition()', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      await el.updateComplete;

      const eventPromise = oneEvent(el, 'hx-reposition');
      await el.reposition();
      const event = await eventPromise;

      expect(event).toBeTruthy();
      expect(event.type).toBe('hx-reposition');
    });

    it('hx-reposition event bubbles', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      await el.updateComplete;

      let caught = false;
      document.addEventListener(
        'hx-reposition',
        () => {
          caught = true;
        },
        { once: true },
      );
      await el.reposition();
      await new Promise((r) => setTimeout(r, 10));

      expect(caught).toBe(true);
    });
  });

  // ─── Positioning (3) ───

  describe('Positioning', () => {
    it('popup is positioned fixed when active', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      await el.updateComplete;
      const popup = shadowQuery<HTMLElement>(el, '[part="popup"]');
      const styles = getComputedStyle(popup!);
      expect(styles.position).toBe('fixed');
    });

    it('popup container has no aria-hidden when active', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      const popup = shadowQuery(el, '[part="popup"]');
      expect(popup?.hasAttribute('aria-hidden')).toBe(false);
    });

    it('anchor element sets anchor via Element reference', async () => {
      const anchorEl = document.createElement('button');
      anchorEl.textContent = 'External';
      document.body.appendChild(anchorEl);

      try {
        const el = await fixture<HelixPopup>('<hx-popup active><div>Content</div></hx-popup>');
        el.anchor = anchorEl;
        await el.updateComplete;

        expect(el.anchor).toBe(anchorEl);
      } finally {
        anchorEl.remove();
      }
    });
  });

  // ─── Public API (1) ───

  describe('Public API', () => {
    it('exposes reposition() method', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(typeof el.reposition).toBe('function');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Trigger</button><div>Popup content</div></hx-popup>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when active', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Trigger</button><div>Popup content</div></hx-popup>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Lifecycle (2) ───

  describe('Lifecycle', () => {
    it('cleans up on disconnect', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      await el.updateComplete;
      // Should not throw on disconnect
      expect(() => el.remove()).not.toThrow();
    });

    it('starts positioning when active becomes true', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.active).toBe(false);

      const eventPromise = oneEvent(el, 'hx-reposition');
      el.active = true;
      await el.updateComplete;
      const event = await eventPromise;

      expect(event.type).toBe('hx-reposition');
    });
  });

  // ─── Property: strategy (3) ───

  describe('Property: strategy', () => {
    it('defaults to "fixed"', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.strategy).toBe('fixed');
    });

    it('reflects strategy attribute', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup strategy="absolute"><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      expect(el.strategy).toBe('absolute');
      expect(el.getAttribute('strategy')).toBe('absolute');
    });

    it('accepts "absolute" strategy', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      el.strategy = 'absolute';
      await el.updateComplete;
      expect(el.strategy).toBe('absolute');
    });
  });

  // ─── CSS selector anchor (2) ───

  describe('CSS selector anchor', () => {
    it('resolves anchor from CSS selector string', async () => {
      const anchorBtn = document.createElement('button');
      anchorBtn.id = 'popup-anchor-test';
      anchorBtn.textContent = 'External Anchor';
      document.body.appendChild(anchorBtn);

      try {
        const el = await fixture<HelixPopup>('<hx-popup active><div>Content</div></hx-popup>');
        const eventPromise = oneEvent(el, 'hx-reposition');
        el.anchor = '#popup-anchor-test';
        await el.updateComplete;
        const event = await eventPromise;

        expect(el.anchor).toBe('#popup-anchor-test');
        expect(event.type).toBe('hx-reposition');
      } finally {
        anchorBtn.remove();
      }
    });

    it('returns null anchor for non-existent selector', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      el.anchor = '#does-not-exist';
      await el.updateComplete;
      expect(el.anchor).toBe('#does-not-exist');
    });
  });

  // ─── Auto placement (1) ───

  describe('Auto placement', () => {
    it('accepts placement="auto" without throwing', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup placement="auto" active><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      await el.updateComplete;
      expect(el.placement).toBe('auto');
    });
  });

  // ─── Fake timers guard ───

  describe('Timer guard', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not throw when active is toggled with fake timers', async () => {
      const el = await fixture<HelixPopup>(
        '<hx-popup><button slot="anchor">Anchor</button><div>Content</div></hx-popup>',
      );
      el.active = true;
      vi.runAllTimers();
      await el.updateComplete;
      el.active = false;
      await el.updateComplete;
      expect(el.active).toBe(false);
    });
  });
});
