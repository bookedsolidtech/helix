import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixStatusIndicator } from './hx-status-indicator.js';
import './index.js';

afterEach(cleanup);

describe('hx-status-indicator', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "pulse-ring" CSS part', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      const ring = shadowQuery(el, '[part~="pulse-ring"]');
      expect(ring).toBeTruthy();
    });
  });

  // ─── Property: status ───

  describe('Property: status', () => {
    it('defaults to status="unknown"', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      expect(el.status).toBe('unknown');
    });

    it('reflects status attr to host', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="online"></hx-status-indicator>',
      );
      expect(el.getAttribute('status')).toBe('online');
    });

    it('accepts "online" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="online"></hx-status-indicator>',
      );
      expect(el.status).toBe('online');
    });

    it('accepts "offline" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="offline"></hx-status-indicator>',
      );
      expect(el.status).toBe('offline');
    });

    it('accepts "away" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="away"></hx-status-indicator>',
      );
      expect(el.status).toBe('away');
    });

    it('accepts "busy" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="busy"></hx-status-indicator>',
      );
      expect(el.status).toBe('busy');
    });
  });

  // ─── Property: size ───

  describe('Property: size', () => {
    it('defaults to size="md"', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      expect(el.size).toBe('md');
    });

    it('reflects size attr to host', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator size="sm"></hx-status-indicator>',
      );
      expect(el.getAttribute('size')).toBe('sm');
    });

    it('accepts "sm" size', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator size="sm"></hx-status-indicator>',
      );
      expect(el.size).toBe('sm');
    });

    it('accepts "lg" size', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator size="lg"></hx-status-indicator>',
      );
      expect(el.size).toBe('lg');
    });
  });

  // ─── Property: pulse ───

  describe('Property: pulse', () => {
    it('defaults to pulse=false', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      expect(el.pulse).toBe(false);
    });

    it('reflects pulse attr to host when true', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator pulse></hx-status-indicator>',
      );
      expect(el.hasAttribute('pulse')).toBe(true);
    });

    it('accepts pulse=true', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator pulse></hx-status-indicator>',
      );
      expect(el.pulse).toBe(true);
    });
  });

  // ─── ARIA ───

  describe('ARIA', () => {
    it('has role="img" on the host element', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      expect(el.getAttribute('role')).toBe('img');
    });

    it('has default aria-label "Status: Unknown"', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      expect(el.getAttribute('aria-label')).toBe('Status: Unknown');
    });

    it('generates correct aria-label for "online" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="online"></hx-status-indicator>',
      );
      expect(el.getAttribute('aria-label')).toBe('Status: Online');
    });

    it('uses custom label when provided', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator label="System is healthy"></hx-status-indicator>',
      );
      expect(el.getAttribute('aria-label')).toBe('System is healthy');
    });

    it('generates correct aria-label for "offline" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="offline"></hx-status-indicator>',
      );
      expect(el.getAttribute('aria-label')).toBe('Status: Offline');
    });

    it('generates correct aria-label for "away" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="away"></hx-status-indicator>',
      );
      expect(el.getAttribute('aria-label')).toBe('Status: Away');
    });

    it('generates correct aria-label for "busy" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="busy"></hx-status-indicator>',
      );
      expect(el.getAttribute('aria-label')).toBe('Status: Busy');
    });

    it('generates correct aria-label for "unknown" status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="unknown"></hx-status-indicator>',
      );
      expect(el.getAttribute('aria-label')).toBe('Status: Unknown');
    });

    it('falls back to generated label when custom label is cleared', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="online" label="Custom label"></hx-status-indicator>',
      );
      el.label = '';
      await el.updateComplete;
      expect(el.getAttribute('aria-label')).toBe('Status: Online');
    });
  });

  // ─── Dynamic Updates ───

  describe('Dynamic Updates', () => {
    it('updates aria-label when status changes dynamically', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="online"></hx-status-indicator>',
      );
      el.status = 'offline';
      await el.updateComplete;
      expect(el.getAttribute('aria-label')).toBe('Status: Offline');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixStatusIndicator>('<hx-status-indicator></hx-status-indicator>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for online status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="online"></hx-status-indicator>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for offline status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="offline"></hx-status-indicator>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for away status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="away"></hx-status-indicator>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for busy status', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="busy"></hx-status-indicator>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with pulse enabled', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator status="online" pulse></hx-status-indicator>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with custom label', async () => {
      const el = await fixture<HelixStatusIndicator>(
        '<hx-status-indicator label="Server is online"></hx-status-indicator>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
