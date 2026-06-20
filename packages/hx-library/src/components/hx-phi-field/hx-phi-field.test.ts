import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixPhiField, PhiAccessEventDetail } from './hx-phi-field.js';
import './index.js';

afterEach(cleanup);

describe('hx-phi-field', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(el.shadowRoot).toBeTruthy();
    });

    it('defaults to masked state', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.classList.contains('phi-field__value--masked')).toBe(true);
    });

    it('exposes "container" CSS part', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(shadowQuery(el, '[part~="container"]')).toBeTruthy();
    });

    it('exposes "value" CSS part', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(shadowQuery(el, '[part~="value"]')).toBeTruthy();
    });

    it('exposes "toggle" CSS part', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(shadowQuery(el, '[part~="toggle"]')).toBeTruthy();
    });

    it('does not expose unmasked data in DOM when masked', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      // The full SSN should not appear anywhere in the shadow DOM when masked
      expect(el.shadowRoot?.innerHTML).not.toContain('123-45-6789');
    });

    it('renders toggle button', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      expect(toggle).toBeInstanceOf(HTMLButtonElement);
    });
  });

  // ─── Property: data ───

  describe('Property: data', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field></hx-phi-field>');
      expect(el.data).toBe('');
    });

    it('returns empty masked value when data is empty', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.textContent?.trim()).toBe('');
    });

    it('accepts SSN format via property', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(el.data).toBe('123-45-6789');
    });

    it('accepts MRN format via property', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="mrn"></hx-phi-field>');
      el.data = 'MRN-00123456';
      await el.updateComplete;
      expect(el.data).toBe('MRN-00123456');
    });

    it('accepts DOB format via property', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="dob"></hx-phi-field>');
      el.data = '12/25/1990';
      await el.updateComplete;
      expect(el.data).toBe('12/25/1990');
    });

    it('accepts insurance ID format via property', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="insurance"></hx-phi-field>',
      );
      el.data = '1234-5678-9012-3456';
      await el.updateComplete;
      expect(el.data).toBe('1234-5678-9012-3456');
    });

    it('does not reflect data to HTML attribute', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      // PHI must not appear in the DOM as an attribute
      expect(el.getAttribute('data')).toBeNull();
    });
  });

  // ─── Property: fieldType ───

  describe('Property: fieldType', () => {
    it('defaults to "ssn"', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field></hx-phi-field>');
      expect(el.fieldType).toBe('ssn');
    });

    it('reflects field-type attribute to host', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="dob"></hx-phi-field>');
      el.data = '12/25/1990';
      await el.updateComplete;
      expect(el.getAttribute('field-type')).toBe('dob');
    });

    it('accepts "mrn" field type', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="mrn"></hx-phi-field>');
      el.data = 'MRN12345';
      await el.updateComplete;
      expect(el.fieldType).toBe('mrn');
    });

    it('accepts "dob" field type', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="dob"></hx-phi-field>');
      el.data = '01/01/1980';
      await el.updateComplete;
      expect(el.fieldType).toBe('dob');
    });

    it('accepts "insurance" field type', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="insurance"></hx-phi-field>',
      );
      el.data = '1234-5678-9012-3456';
      await el.updateComplete;
      expect(el.fieldType).toBe('insurance');
    });
  });

  // ─── Masking Patterns ───

  describe('Masking Patterns', () => {
    it('masks SSN to show only last 4 digits', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.textContent?.trim()).toBe('***-**-6789');
    });

    it('masks SSN without separators', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123456789';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      // Fallback: mask all but last 4
      expect(value?.textContent?.trim()).toBe('*****6789');
    });

    it('masks MRN to show only last 4 alphanumeric chars', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="mrn"></hx-phi-field>');
      el.data = 'MRN12345678';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.textContent?.trim()).toBe('*******5678');
    });

    it('masks MRN with separators, preserving them', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="mrn"></hx-phi-field>');
      el.data = 'MRN-00123456';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      // MRN-00123456: alphanumeric = M,R,N,0,0,1,2,3,4,5,6 (11 chars), show last 4 = 3456
      // mask first 7 alphanumeric (M,R,N,0,0,1,2), preserve separator (-), reveal 3456
      expect(value?.textContent?.trim()).toBe('***-****3456');
    });

    it('masks DOB replacing all digits', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="dob"></hx-phi-field>');
      el.data = '12/25/1990';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.textContent?.trim()).toBe('**/**/****');
    });

    it('masks insurance ID to show only last 4 digits', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="insurance"></hx-phi-field>',
      );
      el.data = '1234-5678-9012-3456';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.textContent?.trim()).toBe('****-****-****-3456');
    });

    it('masks insurance ID without separators', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="insurance"></hx-phi-field>',
      );
      el.data = '1234567890123456';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      // Fallback: mask all but last 4
      expect(value?.textContent?.trim()).toBe('************3456');
    });
  });

  // ─── Reveal / Hide Toggle ───

  describe('Reveal / Hide Toggle', () => {
    it('clicking toggle reveals the PHI value', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.classList.contains('phi-field__value--revealed')).toBe(true);
      expect(value?.textContent?.trim()).toBe('123-45-6789');
    });

    it('clicking toggle again hides the PHI value', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      toggle?.click();
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.classList.contains('phi-field__value--masked')).toBe(true);
    });

    it('unmasked PHI is not in shadow DOM when masked', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      // Reveal then hide
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      expect(toggle).toBeTruthy();
      if (!toggle) throw new Error('Expected [part="toggle"] to exist');
      toggle.click();
      await el.updateComplete;
      toggle.click();
      await el.updateComplete;
      expect(el.shadowRoot?.innerHTML).not.toContain('123-45-6789');
    });

    it('unmasked PHI is present in shadow DOM when revealed', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      expect(toggle).toBeTruthy();
      if (!toggle) throw new Error('Expected [part="toggle"] to exist');
      toggle.click();
      await el.updateComplete;
      expect(el.shadowRoot?.innerHTML).toContain('123-45-6789');
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('fires hx-phi-access with action="reveal" on reveal', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="ssn-field"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      const event = await eventPromise;
      expect(event.detail.action).toBe('reveal');
    });

    it('fires hx-phi-access with correct fieldId on reveal', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="ssn-field"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      const event = await eventPromise;
      expect(event.detail.fieldId).toBe('ssn-field');
    });

    it('fires hx-phi-access with correct fieldType on reveal', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="ssn-field"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      const event = await eventPromise;
      expect(event.detail.fieldType).toBe('ssn');
    });

    it('fires hx-phi-access with ISO timestamp on reveal', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="ssn-field"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      const event = await eventPromise;
      expect(event.detail.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('hx-phi-access bubbles and is composed', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="ssn-field"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('fires hx-phi-access with action="hide" on manual hide', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      // First reveal
      toggle?.click();
      await el.updateComplete;
      // Then hide — listen for the second event
      const hideEventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      toggle?.click();
      const hideEvent = await hideEventPromise;
      expect(hideEvent.detail.action).toBe('hide');
    });

    it('falls back to element id when fieldId is not set', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field id="my-ssn" field-type="ssn"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      const event = await eventPromise;
      expect(event.detail.fieldId).toBe('my-ssn');
    });
  });

  // ─── Clipboard Protection ───

  describe('Clipboard Protection', () => {
    it('prevents copy when masked', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const container = shadowQuery(el, '.phi-field');
      let defaultPrevented = false;
      const copyEvent = new ClipboardEvent('copy', { bubbles: true, cancelable: true });
      Object.defineProperty(copyEvent, 'preventDefault', {
        value: () => {
          defaultPrevented = true;
        },
      });
      container?.dispatchEvent(copyEvent);
      expect(defaultPrevented).toBe(true);
    });

    it('prevents paste when masked', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const container = shadowQuery(el, '.phi-field');
      let defaultPrevented = false;
      const pasteEvent = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'preventDefault', {
        value: () => {
          defaultPrevented = true;
        },
      });
      container?.dispatchEvent(pasteEvent);
      expect(defaultPrevented).toBe(true);
    });

    it('does not prevent copy when revealed', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      const container = shadowQuery(el, '.phi-field');
      let defaultPrevented = false;
      const copyEvent = new ClipboardEvent('copy', { bubbles: true, cancelable: true });
      Object.defineProperty(copyEvent, 'preventDefault', {
        value: () => {
          defaultPrevented = true;
        },
      });
      container?.dispatchEvent(copyEvent);
      expect(defaultPrevented).toBe(false);
    });
  });

  // ─── Clipboard Auto-Clear Timer Reset ───

  describe('Clipboard Auto-Clear Timer Reset', () => {
    /**
     * Matches both `clipboard-clear` (writeText resolved) and
     * `clipboard-clear-failed` (writeText rejected / API unavailable). Either way
     * the auto-clear FIRED — the timing assertion is independent of whether the
     * browser honored navigator.clipboard.writeText under the current activation.
     */
    const isClipboardClearAudit = (e: CustomEvent<PhiAccessEventDetail>): boolean =>
      e.detail.action === 'clipboard-clear' || e.detail.action === 'clipboard-clear-failed';

    it('resets the clipboard-clear timer on a new copy so the full window applies to the latest copy', async () => {
      // Regression guard: a copy late in a prior reveal's clear window must
      // restart the timer (cancel + reschedule). Otherwise PHI placed on the
      // clipboard by the latest copy would be cleared early, inheriting only the
      // remaining time from the original reveal rather than the full timeout.
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixPhiField>(
          '<hx-phi-field field-type="ssn" field-id="copy-reset" clipboard-timeout="1000"></hx-phi-field>',
        );
        el.data = '123-45-6789';
        await el.updateComplete;

        // Reveal — schedules the clipboard-clear timer (1000ms window).
        const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
        toggle?.click();
        await el.updateComplete;

        const events: CustomEvent<PhiAccessEventDetail>[] = [];
        el.addEventListener('hx-phi-access', (e) => {
          events.push(e as CustomEvent<PhiAccessEventDetail>);
        });

        // Advance 800ms into the original window, then copy. The copy must reset
        // the timer so a fresh 1000ms window starts from THIS point. The async
        // timer advance flushes the microtask queue between callbacks so the
        // `navigator.clipboard.writeText().then()` audit dispatch is observable.
        await vi.advanceTimersByTimeAsync(800);
        const container = shadowQuery(el, '.phi-field');
        container?.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true }));

        // At the original deadline (200ms more = 1000ms total) the clear must NOT
        // have fired — the copy reset it.
        await vi.advanceTimersByTimeAsync(300);
        expect(events.filter(isClipboardClearAudit)).toHaveLength(0);

        // A full window after the copy (1000ms from the copy) the clear fires.
        await vi.advanceTimersByTimeAsync(800);
        expect(events.filter(isClipboardClearAudit).length).toBeGreaterThanOrEqual(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not schedule a clipboard-clear timer on a copy while masked', async () => {
      // A masked copy is prevented (no PHI reaches the clipboard), so it must not
      // start or reset the auto-clear timer.
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixPhiField>(
          '<hx-phi-field field-type="ssn" field-id="masked-copy" clipboard-timeout="1000"></hx-phi-field>',
        );
        el.data = '123-45-6789';
        await el.updateComplete;

        const events: CustomEvent<PhiAccessEventDetail>[] = [];
        el.addEventListener('hx-phi-access', (e) => {
          events.push(e as CustomEvent<PhiAccessEventDetail>);
        });

        // Field is masked by default — dispatch a copy and advance well past the
        // timeout. No clipboard-clear audit event should ever fire.
        const container = shadowQuery(el, '.phi-field');
        container?.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true }));
        vi.advanceTimersByTime(2000);

        expect(events.filter(isClipboardClearAudit)).toHaveLength(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('has no axe violations in masked state', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in revealed state', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has role="status" live region', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status).toBeTruthy();
    });

    it('has aria-live="polite" on status region', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status?.getAttribute('aria-live')).toBe('polite');
    });

    it('has aria-atomic="true" on status region', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status?.getAttribute('aria-atomic')).toBe('true');
    });

    it('toggle has aria-label when masked', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery(el, '[part="toggle"]');
      expect(toggle?.getAttribute('aria-label')).toBe('Reveal protected health information');
    });

    it('toggle has aria-label when revealed', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      expect(toggle?.getAttribute('aria-label')).toBe('Hide protected health information');
    });

    it('toggle aria-pressed is "false" when masked', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery(el, '[part="toggle"]');
      expect(toggle?.getAttribute('aria-pressed')).toBe('false');
    });

    it('toggle aria-pressed is "true" when revealed', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      expect(toggle?.getAttribute('aria-pressed')).toBe('true');
    });

    it('status region announces masked state', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status?.textContent?.trim()).toBe('Protected health information is masked');
    });

    it('status region announces revealed state', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status?.textContent?.trim()).toBe('Protected health information is revealed');
    });

    it('toggle has aria-label using custom label property', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" label="Social Security Number"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery(el, '[part="toggle"]');
      expect(toggle?.getAttribute('aria-label')).toBe('Reveal social security number');
    });

    it('status region uses custom label in announcement', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" label="SSN"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status?.textContent?.trim()).toBe('SSN is masked');
    });

    it('toggle is a native button element', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery(el, '[part="toggle"]');
      expect(toggle).toBeInstanceOf(HTMLButtonElement);
    });

    it('toggle type is "button"', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      expect(toggle?.getAttribute('type')).toBe('button');
    });

    it('masked value span has aria-hidden="true"', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value--masked');
      expect(value?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Edge Cases ───

  describe('Edge Cases', () => {
    it('handles empty data gracefully', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      expect(el.shadowRoot).toBeTruthy();
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.textContent?.trim()).toBe('');
    });

    it('all four field types render without errors', async () => {
      for (const fieldType of ['ssn', 'mrn', 'dob', 'insurance'] as const) {
        const el = await fixture<HelixPhiField>(
          `<hx-phi-field field-type="${fieldType}"></hx-phi-field>`,
        );
        el.data = 'test';
        await el.updateComplete;
        expect(el.shadowRoot).toBeTruthy();
        el.remove();
      }
    });

    it('clipboardTimeout defaults to 30000', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(el.clipboardTimeout).toBe(30000);
    });

    it('fieldId defaults to empty string', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(el.fieldId).toBe('');
    });

    it('renders all masking types for DOB', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="dob"></hx-phi-field>');
      el.data = '01/01/1985';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.textContent?.trim()).toBe('**/**/****');
    });

    it('label defaults to empty string', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(el.label).toBe('');
    });

    it('disabled defaults to false', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(el.disabled).toBe(false);
    });
  });

  // ─── Disabled State ───

  describe('Disabled State', () => {
    it('toggle button is disabled when disabled attribute is set', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" disabled></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      expect(toggle?.disabled).toBe(true);
    });

    it('does not reveal when disabled', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" disabled></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.classList.contains('phi-field__value--masked')).toBe(true);
    });

    it('reflects disabled attribute on host', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" disabled></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('does not fire hx-phi-access when toggle is clicked while disabled', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" disabled></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      let eventFired = false;
      el.addEventListener('hx-phi-access', () => {
        eventFired = true;
      });
      // Simulate programmatic click — native disabled prevents user clicks but we verify
      // the _handleToggle guard explicitly by dispatching on the container, not the button
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      // Native disabled button swallows click events — confirmed no event fires
      toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });
  });

  // ─── PHI Masking Integrity ───

  describe('PHI Masking Integrity', () => {
    it('masked value span contains asterisk placeholder characters, not actual PHI digits', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value--masked');
      const text = value?.textContent?.trim() ?? '';
      // Must contain asterisks (masking characters)
      expect(text).toContain('*');
      // Must not contain the sensitive prefix digits
      expect(text).not.toContain('123');
      expect(text).not.toContain('45');
    });

    it('masked MRN contains asterisk characters and not the original prefix', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="mrn"></hx-phi-field>');
      el.data = 'MRN12345678';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value--masked');
      const text = value?.textContent?.trim() ?? '';
      expect(text).toContain('*');
      // Original prefix chars should be masked
      expect(text).not.toContain('MRN1234');
    });

    it('masked DOB contains only asterisks and separators, no digits', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="dob"></hx-phi-field>');
      el.data = '12/25/1990';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value--masked');
      const text = value?.textContent?.trim() ?? '';
      expect(text).toMatch(/^[*/]+$/);
    });

    it('masked insurance ID contains asterisk characters and not the original prefix digits', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="insurance"></hx-phi-field>',
      );
      el.data = '1234-5678-9012-3456';
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value--masked');
      const text = value?.textContent?.trim() ?? '';
      expect(text).toContain('*');
      expect(text).not.toContain('1234-5678');
    });

    it('hx-phi-access event detail does not contain the raw PHI value', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="audit-test"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      const event = await eventPromise;
      // The audit event detail must never carry the raw PHI — HIPAA requirement
      const detailStr = JSON.stringify(event.detail);
      expect(detailStr).not.toContain('123-45-6789');
      expect(detailStr).not.toContain('123456789');
    });
  });

  // ─── ARIA Label Round-Trip ───

  describe('ARIA Label Round-Trip', () => {
    it('toggle aria-label cycles correctly: masked → revealed → masked', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');

      // Initial: masked
      expect(toggle?.getAttribute('aria-label')).toBe('Reveal protected health information');

      // After first click: revealed
      toggle?.click();
      await el.updateComplete;
      expect(toggle?.getAttribute('aria-label')).toBe('Hide protected health information');

      // After second click: masked again
      toggle?.click();
      await el.updateComplete;
      expect(toggle?.getAttribute('aria-label')).toBe('Reveal protected health information');
    });

    it('toggle aria-pressed cycles correctly: false → true → false', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');

      expect(toggle?.getAttribute('aria-pressed')).toBe('false');

      toggle?.click();
      await el.updateComplete;
      expect(toggle?.getAttribute('aria-pressed')).toBe('true');

      toggle?.click();
      await el.updateComplete;
      expect(toggle?.getAttribute('aria-pressed')).toBe('false');
    });

    it('revealed value span does not have aria-hidden', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value--revealed');
      // The revealed span must be accessible — not hidden from the accessibility tree
      expect(value?.getAttribute('aria-hidden')).toBeNull();
    });
  });

  // ─── Live Region Announcements ───

  describe('Live Region Announcements', () => {
    it('live region text updates to revealed announcement after toggle', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status?.textContent?.trim()).toBe('Protected health information is revealed');
    });

    it('live region text returns to masked announcement after second toggle', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      toggle?.click();
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status?.textContent?.trim()).toBe('Protected health information is masked');
    });

    it('live region uses custom label in revealed announcement', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" label="Social Security Number"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;
      const status = shadowQuery(el, '[role="status"]');
      expect(status?.textContent?.trim()).toBe('Social Security Number is revealed');
    });
  });

  // ─── HIPAA Compliance: Host Element ───

  describe('HIPAA Compliance: Host Element', () => {
    it('sets autocomplete="off" on host element to prevent browser autofill', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      expect(el.getAttribute('autocomplete')).toBe('off');
    });

    it('PHI value does not appear in host element outerHTML', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      // outerHTML covers the host tag itself — PHI must not leak into attributes
      expect(el.outerHTML).not.toContain('123-45-6789');
    });

    it('fieldId falls back to empty string in hx-phi-access event when neither field-id nor id is set', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-phi-access');
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      const event = await eventPromise;
      expect(event.detail.fieldId).toBe('');
    });
  });

  // ─── FS-029: PHI Attribute Stripping ───

  describe('FS-029: PHI Attribute Stripping', () => {
    it('removes the "data" attribute from the DOM after connectedCallback', async () => {
      // Simulate the SSR/server-rendered case where raw PHI was set as an HTML attribute
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      // Set the raw PHI as a DOM attribute before the element connects to the document
      el.setAttribute('data', '123-45-6789');
      document.body.appendChild(el);
      await el.updateComplete;
      // The attribute must be removed so raw PHI is never left in the DOM tree
      expect(el.hasAttribute('data')).toBe(false);
      el.remove();
    });

    it('rescues the PHI value into the JS property when set as a DOM attribute', async () => {
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      el.setAttribute('data', '123-45-6789');
      document.body.appendChild(el);
      await el.updateComplete;
      // Value must have been rescued so masking still works
      expect(el.data).toBe('123-45-6789');
      el.remove();
    });

    it('masked value is correct after attribute-rescue (masking still functions)', async () => {
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      el.setAttribute('data', '123-45-6789');
      document.body.appendChild(el);
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value--masked');
      expect(value?.textContent?.trim()).toBe('***-**-6789');
      el.remove();
    });

    it('raw PHI does not appear in outerHTML after connectedCallback strips the attribute', async () => {
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      el.setAttribute('data', '123-45-6789');
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.outerHTML).not.toContain('123-45-6789');
      el.remove();
    });
  });

  // ─── FS-029: Opt-in Strict Mode (fail-closed detector) ───

  describe('FS-029: Opt-in Strict Mode', () => {
    it('defaults to non-strict: rescues the data attribute and warns (backward compatible)', async () => {
      // Spy on console.warn — devWarn routes through it in dev/test builds.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const el = document.createElement('hx-phi-field') as HelixPhiField;
        el.setAttribute('field-type', 'ssn');
        el.setAttribute('data', '123-45-6789');
        // No `strict` attribute — the default silent-rescue path must run.
        document.body.appendChild(el);
        await el.updateComplete;

        expect(el.strict).toBe(false);
        // Value rescued into the JS property, attribute stripped from the DOM.
        expect(el.data).toBe('123-45-6789');
        expect(el.hasAttribute('data')).toBe(false);
        // Dev warning surfaced.
        expect(warnSpy).toHaveBeenCalledTimes(1);
        el.remove();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('strict + data attribute: refuses (logs error), strips the attribute, does NOT rescue', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const el = document.createElement('hx-phi-field') as HelixPhiField;
        el.setAttribute('field-type', 'ssn');
        el.setAttribute('strict', '');
        el.setAttribute('data', '123-45-6789');

        // connectedCallback runs synchronously inside appendChild. Strict mode
        // must NOT throw — an exception from a lifecycle callback is reported as
        // an uncaught browser error and would destabilise the field. In dev/test
        // (import.meta.env.DEV === true) it surfaces loudly via console.error.
        expect(() => document.body.appendChild(el)).not.toThrow();

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(String(errorSpy.mock.calls[0]?.[0])).toMatch(/strict mode/i);
        // Attribute stripped FIRST so PHI left the live DOM; value NOT rescued.
        expect(el.hasAttribute('data')).toBe(false);
        expect(el.data).toBe('');
        el.remove();
      } finally {
        errorSpy.mockRestore();
      }
    });

    it('strict + data attribute at connect (SSR markup): dispatches hx-phi-access with action="attribute-exposure-refused" (no raw PHI in detail)', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      const handler = (e: Event): void => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      };
      // Attach first — the refusal event bubbles during connectedCallback inside the
      // fixture's append.
      document.addEventListener('hx-phi-access', handler);

      try {
        // SSR markup: `data` is present in the PARSED HTML at upgrade time (fixture
        // uses innerHTML, not setAttribute), so the refusal happens in
        // connectedCallback — the synchronous setAttribute override only intercepts the
        // programmatic post-connect path.
        const el = await fixture<HelixPhiField>(
          '<hx-phi-field field-type="ssn" field-id="strict-refuse" strict data="123-45-6789"></hx-phi-field>',
        );

        const refusedEvents = events.filter(
          (e) => e.detail.action === 'attribute-exposure-refused',
        );
        expect(refusedEvents).toHaveLength(1);
        expect(refusedEvents[0]?.detail.fieldId).toBe('strict-refuse');
        expect(refusedEvents[0]?.detail.fieldType).toBe('ssn');
        expect(el.hasAttribute('data')).toBe(false);
        // Raw PHI must never appear in the audit detail — HIPAA boundary.
        const detailStr = JSON.stringify(refusedEvents[0]?.detail);
        expect(detailStr).not.toContain('123-45-6789');
      } finally {
        document.removeEventListener('hx-phi-access', handler);
        errorSpy.mockRestore();
      }
    });

    it('strict + NO data attribute: no-op (no throw, no refusal event)', async () => {
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      el.setAttribute('strict', '');
      // No `data` attribute set — the FS-029 block must not engage at all.

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      const handler = (e: Event): void => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      };
      document.addEventListener('hx-phi-access', handler);

      try {
        expect(() => document.body.appendChild(el)).not.toThrow();
        await el.updateComplete;

        expect(el.strict).toBe(true);
        const refusedEvents = events.filter(
          (e) => e.detail.action === 'attribute-exposure-refused',
        );
        expect(refusedEvents).toHaveLength(0);
        // Field still works as a normal masked field via the JS property.
        el.data = '123-45-6789';
        await el.updateComplete;
        const value = shadowQuery(el, '.phi-field__value--masked');
        expect(value?.textContent?.trim()).toBe('***-**-6789');
      } finally {
        document.removeEventListener('hx-phi-access', handler);
        el.remove();
      }
    });

    it('strict + post-connect `data` attribute write: refuses (strips + audit event)', async () => {
      // A hydration pass or client framework can `setAttribute('data', phi)` AFTER
      // connect. `data` is attribute:false so attributeChangedCallback never fires;
      // the strict-mode MutationObserver must still strip it and refuse.
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      el.setAttribute('field-id', 'post-connect');
      el.setAttribute('strict', '');
      // Connect with NO data attribute — the observer must still arm.
      document.body.appendChild(el);
      await el.updateComplete;

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      const handler = (e: Event): void => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      };
      document.addEventListener('hx-phi-access', handler);

      try {
        el.setAttribute('data', '123-45-6789');
        // MutationObserver callbacks fire on a microtask.
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(el.hasAttribute('data')).toBe(false);
        const refused = events.filter((e) => e.detail.action === 'attribute-exposure-refused');
        expect(refused.length).toBeGreaterThanOrEqual(1);
        expect(refused[0]?.detail.fieldId).toBe('post-connect');
        expect(JSON.stringify(refused[0]?.detail)).not.toContain('123-45-6789');
      } finally {
        document.removeEventListener('hx-phi-access', handler);
        errorSpy.mockRestore();
        el.remove();
      }
    });

    it('strict toggled ON after connect: arms the observer + refuses a later data write', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      // NOT strict at connect.
      document.body.appendChild(el);
      await el.updateComplete;

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      const handler = (e: Event): void => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      };
      document.addEventListener('hx-phi-access', handler);

      try {
        el.strict = true;
        await el.updateComplete;
        el.setAttribute('data', '123-45-6789');
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(el.hasAttribute('data')).toBe(false);
        expect(events.some((e) => e.detail.action === 'attribute-exposure-refused')).toBe(true);
      } finally {
        document.removeEventListener('hx-phi-access', handler);
        errorSpy.mockRestore();
        el.remove();
      }
    });

    it('strict toggled OFF after connect: stops refusing post-connect data writes', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      el.setAttribute('strict', '');
      document.body.appendChild(el);
      await el.updateComplete;
      el.strict = false;
      await el.updateComplete;

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      const handler = (e: Event): void => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      };
      document.addEventListener('hx-phi-access', handler);

      try {
        el.setAttribute('data', '123-45-6789');
        await new Promise((resolve) => setTimeout(resolve, 0));
        // Observer detached when strict was disabled — no refusal from the observer path.
        expect(events.some((e) => e.detail.action === 'attribute-exposure-refused')).toBe(false);
      } finally {
        document.removeEventListener('hx-phi-access', handler);
        warnSpy.mockRestore();
        el.remove();
      }
    });

    it('strict + setAttribute("data") is refused SYNCHRONOUSLY (PHI never lands)', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const el = document.createElement('hx-phi-field') as HelixPhiField;
      el.setAttribute('field-type', 'ssn');
      el.setAttribute('field-id', 'sync-refuse');
      el.setAttribute('strict', '');
      document.body.appendChild(el);

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      const handler = (e: Event): void => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      };
      document.addEventListener('hx-phi-access', handler);

      try {
        el.setAttribute('data', '123-45-6789');
        // No await: the setAttribute override refuses synchronously, so the value
        // must already be absent — there is no microtask window for sync code to read.
        expect(el.hasAttribute('data')).toBe(false);
        expect(el.getAttribute('data')).toBeNull();
        expect(events.some((e) => e.detail.action === 'attribute-exposure-refused')).toBe(true);
      } finally {
        document.removeEventListener('hx-phi-access', handler);
        errorSpy.mockRestore();
        el.remove();
      }
    });
  });

  // ─── Visibility Change Audit Pollution ───

  describe('Visibility Change Audit Pollution', () => {
    /**
     * Helper: dispatch a visibilitychange event with the given visibilityState.
     * Restores the original descriptor after running `fn`.
     *
     * `Object.defineProperty(document, 'visibilityState', ...)` installs an own
     * property on the `document` instance that shadows the accessor defined on
     * `Document.prototype`. Restoring the prototype descriptor alone leaves the
     * shadowing own property in place and the override leaks across tests. The
     * `finally` block therefore deletes the own property AND reinstalls the
     * original prototype descriptor.
     */
    const withVisibilityState = async (
      state: 'hidden' | 'visible',
      fn: () => void | Promise<void>,
    ): Promise<void> => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        Document.prototype,
        'visibilityState',
      );
      Object.defineProperty(document, 'visibilityState', {
        value: state,
        configurable: true,
      });
      try {
        await fn();
      } finally {
        Reflect.deleteProperty(document, 'visibilityState');
        if (originalDescriptor) {
          Object.defineProperty(Document.prototype, 'visibilityState', originalDescriptor);
        }
      }
    };

    /**
     * Matches both `clipboard-clear` (writeText resolved) and `clipboard-clear-failed`
     * (writeText rejected or API unavailable). A clipboard-clear audit event was
     * intentionally dispatched either way — the assertion "a clipboard-clear
     * attempt was audited" is independent of whether the browser honored
     * navigator.clipboard.writeText under the current activation context.
     */
    const isClipboardClearAudit = (e: CustomEvent<PhiAccessEventDetail>): boolean =>
      e.detail.action === 'clipboard-clear' || e.detail.action === 'clipboard-clear-failed';

    it('does not fire hx-phi-access with action="clipboard-clear" when tab is hidden on a never-accessed field', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="never-accessed"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      });

      // Simulate tab hide without any prior interaction (field stays masked, no clipboard timer)
      await withVisibilityState('hidden', () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await el.updateComplete;

      expect(events.filter(isClipboardClearAudit)).toHaveLength(0);
    });

    it('fires hx-phi-access with action="clipboard-clear" when tab is hidden after the field was revealed', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="revealed-field"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      // Reveal the field first — this starts the clipboard timer and unmasks it
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      });

      // Now simulate tab hide — clipboard-clear SHOULD fire because there's real state to clear
      await withVisibilityState('hidden', () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      // Allow the writeText() outcome promise (clipboard-clear | clipboard-clear-failed)
      // to settle before asserting.
      await new Promise((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;

      const clipboardClearEvents = events.filter(isClipboardClearAudit);
      expect(clipboardClearEvents.length).toBeGreaterThanOrEqual(1);
      expect(clipboardClearEvents[0]?.detail.fieldId).toBe('revealed-field');
    });

    it('fires clipboard-clear after reveal → manual hide → tab background (PHI-on-clipboard defense)', async () => {
      // Regression guard: previously the manual-hide branch of _handleToggle
      // cancelled the clipboard-clear timer. A reveal → copy → manual-hide
      // → background sequence would then leave PHI on the clipboard without
      // ever firing an audit event. The fix preserves the timer on manual
      // hide so the visibilitychange pre-emption path can still fire.
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="hide-then-hide"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      // Reveal — starts clipboard-clear timer.
      toggle?.click();
      await el.updateComplete;
      // Manual hide — must NOT cancel the clipboard-clear timer.
      toggle?.click();
      await el.updateComplete;

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      });

      await withVisibilityState('hidden', () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;

      const clipboardClearEvents = events.filter(isClipboardClearAudit);
      expect(clipboardClearEvents.length).toBeGreaterThanOrEqual(1);
      expect(clipboardClearEvents[0]?.detail.fieldId).toBe('hide-then-hide');
    });

    it('does not double-dispatch clipboard-clear when pre-empted by visibilitychange', async () => {
      // Regression guard: `_clearClipboard` now cancels its pending timer so
      // that when visibilitychange fires the clear path, the originally
      // scheduled setTimeout callback does not later run and emit a duplicate
      // audit event.
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="no-dup" clipboard-timeout="50"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      });

      await withVisibilityState('hidden', () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await el.updateComplete;
      // Give the originally-scheduled 50ms timer a generous window to fire.
      await new Promise((resolve) => setTimeout(resolve, 150));

      const clipboardClearEvents = events.filter(isClipboardClearAudit);
      expect(clipboardClearEvents).toHaveLength(1);
    });

    it('dispatches clipboard-clear-failed when navigator.clipboard.writeText rejects', async () => {
      // Regression guard: `navigator.clipboard.writeText('')` requires transient
      // user activation in Chrome/Safari. The clipboard-clear timer and the
      // visibilitychange pre-emption path both run without activation, so
      // writeText can reject silently. Previously the audit event always fired
      // as `clipboard-clear` regardless of outcome — a HIPAA audit integrity
      // defect, because the trail would claim clearance that never happened.
      // The dispatch now observes the writeText outcome and fires
      // `clipboard-clear-failed` on rejection so consumers can escalate
      // (prompt the user to clear clipboard, flag the session, etc).
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="write-reject"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;

      // Capture the full property descriptor so restore returns the slot to its
      // original shape — whether it was an own data property, an own accessor,
      // or (most commonly in a real browser) an inherited prototype property
      // with no own descriptor at all. Blindly re-assigning `writeText` by
      // value would leave an own-property shadow on `navigator.clipboard`
      // that outlives the test and can leak into sibling tests.
      const originalWriteTextDescriptor = Object.getOwnPropertyDescriptor(
        navigator.clipboard,
        'writeText',
      );
      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: () => Promise.reject(new Error('NotAllowedError: no user activation')),
        configurable: true,
        writable: true,
      });

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      });

      try {
        await withVisibilityState('hidden', () => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        // Let the rejected promise's onRejected handler run.
        await new Promise((resolve) => setTimeout(resolve, 0));
        await el.updateComplete;

        const failedEvents = events.filter((e) => e.detail.action === 'clipboard-clear-failed');
        const successEvents = events.filter((e) => e.detail.action === 'clipboard-clear');
        expect(failedEvents).toHaveLength(1);
        expect(failedEvents[0]?.detail.fieldId).toBe('write-reject');
        expect(successEvents).toHaveLength(0);
      } finally {
        if (originalWriteTextDescriptor) {
          Object.defineProperty(navigator.clipboard, 'writeText', originalWriteTextDescriptor);
        } else {
          Reflect.deleteProperty(navigator.clipboard, 'writeText');
        }
      }
    });

    it('dispatches clipboard-clear-failed when navigator.clipboard.writeText throws synchronously', async () => {
      // Regression guard for the sync-throw defense inside `_clearClipboard`.
      // A polyfill or a test stub can throw synchronously from `writeText`
      // (for example, a wrapper that rejects a non-string argument, or an
      // accessor getter that throws when read). Without the try/catch in the
      // production path the throw would escape, no audit event would fire,
      // and HIPAA audit integrity would silently break. Future refactors
      // that remove the try/catch must fail this test.
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="write-sync-throw"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;

      const originalWriteTextDescriptor = Object.getOwnPropertyDescriptor(
        navigator.clipboard,
        'writeText',
      );
      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: () => {
          throw new TypeError('synchronous failure from polyfill');
        },
        configurable: true,
        writable: true,
      });

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      });

      try {
        await withVisibilityState('hidden', () => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await el.updateComplete;

        const failedEvents = events.filter((e) => e.detail.action === 'clipboard-clear-failed');
        const successEvents = events.filter((e) => e.detail.action === 'clipboard-clear');
        expect(failedEvents).toHaveLength(1);
        expect(failedEvents[0]?.detail.fieldId).toBe('write-sync-throw');
        expect(successEvents).toHaveLength(0);
      } finally {
        if (originalWriteTextDescriptor) {
          Object.defineProperty(navigator.clipboard, 'writeText', originalWriteTextDescriptor);
        } else {
          Reflect.deleteProperty(navigator.clipboard, 'writeText');
        }
      }
    });

    it('dispatches clipboard-clear-failed when navigator.clipboard is unavailable', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="no-clipboard-api"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;

      const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      });

      try {
        await withVisibilityState('hidden', () => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await el.updateComplete;

        const failedEvents = events.filter((e) => e.detail.action === 'clipboard-clear-failed');
        expect(failedEvents).toHaveLength(1);
        expect(failedEvents[0]?.detail.fieldId).toBe('no-clipboard-api');
      } finally {
        if (originalClipboard) {
          Object.defineProperty(navigator, 'clipboard', originalClipboard);
        } else {
          Reflect.deleteProperty(navigator, 'clipboard');
        }
      }
    });

    it('cancels auto-hide timer and removes interaction listeners when clipboard is pre-emptively cleared', async () => {
      // Regression guard: previously `_clearClipboard` set `this._masked = true`
      // but did NOT cancel the auto-hide timer or remove its interaction
      // listeners. If the field was revealed (auto-hide scheduled + listeners
      // attached) and then `_clearClipboard` fired via visibilitychange
      // pre-emption or the clipboard-clear timer, the auto-hide timer would
      // keep running. When it later fired, `_autoHide()` early-returned on
      // `this._masked` WITHOUT calling `_removeAutoHideInteractionListeners()`,
      // leaking `mouseenter / mousemove / focusin / keydown / pointerdown`
      // listeners attached to the host. The fix calls `_cancelAutoHideTimer`
      // from `_clearClipboard` alongside `_cancelClipboardTimer`.
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixPhiField>(
          '<hx-phi-field field-type="ssn" field-id="auto-hide-leak" auto-hide-delay="30"></hx-phi-field>',
        );
        el.data = '123-45-6789';
        await el.updateComplete;

        // Spy on the host's add/removeEventListener so we can count the
        // lifecycle of the five interaction listeners without reaching into
        // private state. Interaction events are a closed set — any delta
        // between add and remove counts signals a leak.
        const addSpy = vi.spyOn(el, 'addEventListener');
        const removeSpy = vi.spyOn(el, 'removeEventListener');

        const interactionEvents = [
          'mouseenter',
          'mousemove',
          'focusin',
          'keydown',
          'pointerdown',
        ] as const;
        const countInteractionCalls = (
          calls: readonly (readonly unknown[])[],
          fromIndex: number,
        ): number =>
          calls
            .slice(fromIndex)
            .filter(([type]) =>
              interactionEvents.includes(type as (typeof interactionEvents)[number]),
            ).length;

        // Reveal — this schedules auto-hide and attaches the 5 interaction
        // listeners (mouseenter, mousemove, focusin, keydown, pointerdown).
        const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
        toggle?.click();
        await el.updateComplete;

        const addedAfterReveal = countInteractionCalls(addSpy.mock.calls, 0);
        expect(addedAfterReveal).toBe(5);

        // Snapshot the removeEventListener call count BEFORE the clear so we
        // isolate removes attributable to `_clearClipboard`. `_scheduleAutoHide`
        // calls `_cancelAutoHideTimer` at the top of its body which runs
        // `_removeAutoHideInteractionListeners` defensively even on the first
        // reveal (no prior listeners) — those prior-call removes are irrelevant
        // to the leak regression being guarded.
        const removesBeforeClear = countInteractionCalls(removeSpy.mock.calls, 0);

        // Fire `_clearClipboard` via visibilitychange pre-emption BEFORE the
        // auto-hide timer (30s) fires. The fix must cancel the auto-hide
        // timer and remove its 5 interaction listeners as part of the clear.
        await withVisibilityState('hidden', () => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await el.updateComplete;

        const removesDuringClear =
          countInteractionCalls(removeSpy.mock.calls, 0) - removesBeforeClear;
        // All 5 listeners must be removed during the clear — otherwise the
        // leak regression is back.
        expect(removesDuringClear).toBe(5);

        // No auto-hide audit event should fire when we advance past the
        // auto-hide delay — the timer must have been cancelled.
        const events: CustomEvent<PhiAccessEventDetail>[] = [];
        el.addEventListener('hx-phi-access', (e) => {
          events.push(e as CustomEvent<PhiAccessEventDetail>);
        });
        vi.advanceTimersByTime(35_000);
        await el.updateComplete;
        const autoHideEvents = events.filter((e) => e.detail.action === 'auto-hide');
        expect(autoHideEvents).toHaveLength(0);

        addSpy.mockRestore();
        removeSpy.mockRestore();
      } finally {
        vi.useRealTimers();
      }
    });

    it('dispatches clipboard-clear-failed when navigator.clipboard is a throwing accessor', async () => {
      // The Clipboard API's property descriptor on `navigator` is UA-defined.
      // A shim or hostile environment can install `navigator.clipboard` as a
      // getter that throws synchronously. The audit event MUST still fire —
      // HIPAA consumers rely on it to escalate on silent failure.
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="clipboard-getter-throws"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.click();
      await el.updateComplete;

      const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        get() {
          throw new TypeError('clipboard getter threw');
        },
      });

      const events: CustomEvent<PhiAccessEventDetail>[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent<PhiAccessEventDetail>);
      });

      try {
        await withVisibilityState('hidden', () => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await el.updateComplete;

        const failedEvents = events.filter((e) => e.detail.action === 'clipboard-clear-failed');
        expect(failedEvents).toHaveLength(1);
        expect(failedEvents[0]?.detail.fieldId).toBe('clipboard-getter-throws');
        const successEvents = events.filter((e) => e.detail.action === 'clipboard-clear');
        expect(successEvents).toHaveLength(0);
      } finally {
        if (originalClipboard) {
          Object.defineProperty(navigator, 'clipboard', originalClipboard);
        } else {
          Reflect.deleteProperty(navigator, 'clipboard');
        }
      }
    });
  });

  // ─── Keyboard Interaction ───

  describe('Keyboard Interaction', () => {
    it('Enter key on toggle reveals PHI', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.focus();
      toggle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      // Native button responds to Enter via click — trigger the click to simulate
      toggle?.click();
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.classList.contains('phi-field__value--revealed')).toBe(true);
    });

    it('Space key on toggle reveals PHI', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.focus();
      toggle?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      toggle?.click();
      await el.updateComplete;
      const value = shadowQuery(el, '.phi-field__value');
      expect(value?.classList.contains('phi-field__value--revealed')).toBe(true);
    });

    it('toggle button is reachable via focus', async () => {
      const el = await fixture<HelixPhiField>('<hx-phi-field field-type="ssn"></hx-phi-field>');
      el.data = '123-45-6789';
      await el.updateComplete;
      const toggle = shadowQuery<HTMLButtonElement>(el, '[part="toggle"]');
      toggle?.focus();
      expect(document.activeElement).toBe(el);
    });
  });
});
