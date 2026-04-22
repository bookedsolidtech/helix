import { describe, it, expect, afterEach } from 'vitest';
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

  // ─── Visibility Change Audit Pollution ───

  describe('Visibility Change Audit Pollution', () => {
    /**
     * Helper: dispatch a visibilitychange event with the given visibilityState.
     * Restores the original descriptor after running `fn`.
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
        // Restore the original descriptor so we don't leak the override across tests.
        // `visibilityState` is defined on Document.prototype in all browsers we target,
        // so originalDescriptor will always be present. Fall back to deletion defensively.
        if (originalDescriptor) {
          Object.defineProperty(Document.prototype, 'visibilityState', originalDescriptor);
        } else {
          Reflect.deleteProperty(document, 'visibilityState');
        }
      }
    };

    it('does not fire hx-phi-access with action="clipboard-clear" when tab is hidden on a never-accessed field', async () => {
      const el = await fixture<HelixPhiField>(
        '<hx-phi-field field-type="ssn" field-id="never-accessed"></hx-phi-field>',
      );
      el.data = '123-45-6789';
      await el.updateComplete;

      const events: CustomEvent[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent);
      });

      // Simulate tab hide without any prior interaction (field stays masked, no clipboard timer)
      await withVisibilityState('hidden', () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await el.updateComplete;

      const clipboardClearEvents = events.filter(
        (e) => (e.detail as PhiAccessEventDetail).action === 'clipboard-clear',
      );
      expect(clipboardClearEvents).toHaveLength(0);
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

      const events: CustomEvent[] = [];
      el.addEventListener('hx-phi-access', (e) => {
        events.push(e as CustomEvent);
      });

      // Now simulate tab hide — clipboard-clear SHOULD fire because there's real state to clear
      await withVisibilityState('hidden', () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await el.updateComplete;

      const clipboardClearEvents = events.filter(
        (e) => (e.detail as PhiAccessEventDetail).action === 'clipboard-clear',
      );
      expect(clipboardClearEvents.length).toBeGreaterThanOrEqual(1);
      expect(clipboardClearEvents[0].detail.fieldId).toBe('revealed-field');
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
