import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { WcFormatDate } from './hx-format-date.js';
import './index.js';

afterEach(cleanup);

// Fixed date for deterministic assertions
const ISO_DATE = '2024-06-15T14:30:00.000Z';
const EPOCH_MS = new Date(ISO_DATE).getTime();

describe('hx-format-date', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}"></hx-format-date>`,
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a <time> element', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time');
      expect(time).toBeInstanceOf(HTMLElement);
    });

    it('exposes "base" CSS part on the <time> element', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}"></hx-format-date>`,
      );
      const time = shadowQuery(el, '[part~="base"]');
      expect(time).toBeTruthy();
    });

    it('renders formatted text content', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" month="long" year="numeric" day="numeric"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      expect(time.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  // ─── datetime attribute (3) ───

  describe('datetime attribute', () => {
    it('sets the datetime attribute to the ISO 8601 string', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      expect(time.getAttribute('datetime')).toBe(new Date(ISO_DATE).toISOString());
    });

    it('sets datetime correctly for a Unix timestamp', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${EPOCH_MS}"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      expect(time.getAttribute('datetime')).toBe(new Date(EPOCH_MS).toISOString());
    });

    it('uses current time datetime when date is empty', async () => {
      const before = Date.now();
      const el = await fixture<WcFormatDate>(`<hx-format-date></hx-format-date>`);
      const after = Date.now();
      const time = shadowQuery(el, 'time')!;
      const dt = new Date(time.getAttribute('datetime')!).getTime();
      expect(dt).toBeGreaterThanOrEqual(before);
      expect(dt).toBeLessThanOrEqual(after);
    });
  });

  // ─── Date parsing (4) ───

  describe('Date parsing', () => {
    it('parses an ISO date string', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" month="numeric" year="numeric" day="numeric"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      expect(time.getAttribute('datetime')).toBe(new Date(ISO_DATE).toISOString());
    });

    it('parses a Unix timestamp (ms) string', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${EPOCH_MS}" lang="en-US" month="numeric" year="numeric" day="numeric"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      expect(time.getAttribute('datetime')).toBe(new Date(EPOCH_MS).toISOString());
    });

    it('accepts a Date object via property', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date lang="en-US" month="long" year="numeric" day="numeric"></hx-format-date>`,
      );
      const dateObj = new Date(ISO_DATE);
      el.date = dateObj;
      await el.updateComplete;
      const time = shadowQuery(el, 'time')!;
      expect(time.getAttribute('datetime')).toBe(dateObj.toISOString());
    });

    it('falls back to current date for invalid date strings', async () => {
      const before = Date.now();
      const el = await fixture<WcFormatDate>(`<hx-format-date date="not-a-date"></hx-format-date>`);
      const after = Date.now();
      const time = shadowQuery(el, 'time')!;
      const dt = new Date(time.getAttribute('datetime')!).getTime();
      expect(dt).toBeGreaterThanOrEqual(before);
      expect(dt).toBeLessThanOrEqual(after);
    });
  });

  // ─── Locale formatting (3) ───

  describe('Locale formatting', () => {
    it('formats in en-US locale', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" month="long" year="numeric" day="numeric"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // en-US long month for June 15, 2024 should contain "June"
      expect(time.textContent).toContain('June');
    });

    it('formats in de locale', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="de" month="long" year="numeric" day="numeric"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // German long month for June is "Juni"
      expect(time.textContent).toContain('Juni');
    });

    it('formats in ja locale', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="ja" month="long" year="numeric" day="numeric"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // Japanese month contains "月"
      expect(time.textContent).toContain('月');
    });
  });

  // ─── Format options (5) ───

  describe('Format options', () => {
    it('applies month format option', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" month="short"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      expect(time.textContent).toContain('Jun');
    });

    it('applies year format option', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" year="numeric"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      expect(time.textContent).toContain('2024');
    });

    it('applies weekday format option', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" weekday="long" month="long" year="numeric" day="numeric"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // June 15 2024 is a Saturday
      expect(time.textContent).toContain('Saturday');
    });

    it('applies 24-hour clock via hour-format="24"', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" hour="2-digit" minute="2-digit" hour-format="24"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // 14:30 UTC in 24-hour format — should NOT contain AM/PM
      expect(time.textContent).not.toMatch(/AM|PM/i);
    });

    it('applies 12-hour clock via hour-format="12"', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" hour="numeric" minute="2-digit" hour-format="12"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // 12-hour format should include AM or PM
      expect(time.textContent).toMatch(/AM|PM/i);
    });
  });

  // ─── Relative time (4) ───

  describe('Relative time', () => {
    it('renders relative time text when relative=true', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${twoHoursAgo}" lang="en-US" relative></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // Should contain "hours ago" or similar relative phrasing
      expect(time.textContent!.trim().length).toBeGreaterThan(0);
      expect(time.textContent).toMatch(/hours? ago/i);
    });

    it('renders "in X minutes" for a future date', async () => {
      const inFiveMinutes = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${inFiveMinutes}" lang="en-US" relative></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      expect(time.textContent).toMatch(/in \d+ minutes?/i);
    });

    it('uses numeric="always" when set', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${yesterday}" lang="en-US" relative numeric="always"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // "always" should render "1 day ago" not "yesterday"
      expect(time.textContent).toMatch(/\d+ day/i);
    });

    it('still sets datetime attribute with ISO string for relative mode', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${twoHoursAgo}" lang="en-US" relative></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      const dt = time.getAttribute('datetime')!;
      // Should be a valid ISO date string
      expect(new Date(dt).toISOString()).toBe(dt);
    });
  });

  // ─── Default formatting (2) ───

  describe('Default formatting', () => {
    it('renders year+month+day when no format options are set', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US"></hx-format-date>`,
      );
      const time = shadowQuery(el, 'time')!;
      // Default: year, long month, day — should contain "June" and "2024"
      expect(time.textContent).toContain('June');
      expect(time.textContent).toContain('2024');
    });

    it('produces a non-empty string in default mode', async () => {
      const el = await fixture<WcFormatDate>(`<hx-format-date></hx-format-date>`);
      const time = shadowQuery(el, 'time')!;
      expect(time.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  // ─── Accessibility (1) ───

  describe('Accessibility: axe-core', () => {
    it('has no axe violations', async () => {
      const el = await fixture<WcFormatDate>(
        `<hx-format-date date="${ISO_DATE}" lang="en-US" month="long" year="numeric" day="numeric"></hx-format-date>`,
      );
      const { violations } = await checkA11y(el);
      expect(violations).toHaveLength(0);
    });
  });
});
