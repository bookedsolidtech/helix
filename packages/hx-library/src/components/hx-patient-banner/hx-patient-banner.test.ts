import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup, shadowQuery, shadowQueryAll, oneEvent, checkA11y } from '../../test-utils.js';
import type { HelixPatientBanner } from './hx-patient-banner.js';
import './hx-patient-banner.js';

afterEach(cleanup);

describe('hx-patient-banner', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders host element', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(el).toBeInstanceOf(HTMLElement);
      expect(el.tagName.toLowerCase()).toBe('hx-patient-banner');
    });

    it('has a shadow root', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('has role="banner" on host', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(el.getAttribute('role')).toBe('banner');
    });

    it('exposes "banner" CSS part', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, '[part~="banner"]')).toBeTruthy();
    });

    it('exposes "photo-area" CSS part', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, '[part~="photo-area"]')).toBeTruthy();
    });

    it('exposes "fields" CSS part', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, '[part~="fields"]')).toBeTruthy();
    });

    it('exposes "field" CSS parts for all field containers', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const fields = shadowQueryAll(el, '[part~="field"]');
      expect(fields.length).toBeGreaterThanOrEqual(5);
    });

    it('exposes "field-label" CSS parts', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const labels = shadowQueryAll(el, '[part~="field-label"]');
      expect(labels.length).toBeGreaterThanOrEqual(5);
    });

    it('exposes "field-value" CSS parts', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const values = shadowQueryAll(el, '[part~="field-value"]');
      expect(values.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── Accessibility: ARIA attributes ───

  describe('Accessibility: ARIA', () => {
    it('has default aria-label of "Patient identification"', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(el.getAttribute('aria-label')).toBe('Patient identification');
    });

    it('updates aria-label when label-patient attribute is set', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner label-patient="John Doe banner"></hx-patient-banner>',
      );
      expect(el.getAttribute('aria-label')).toBe('John Doe banner');
    });

    it('updates aria-label reactively when labelPatient property changes', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      el.labelPatient = 'Updated patient label';
      await el.updateComplete;
      expect(el.getAttribute('aria-label')).toBe('Updated patient label');
    });
  });

  // ─── Slots: presence ───

  describe('Slots', () => {
    it('has a "name" slot in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, 'slot[name="name"]')).toBeTruthy();
    });

    it('has an "mrn" slot in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, 'slot[name="mrn"]')).toBeTruthy();
    });

    it('has a "dob" slot in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, 'slot[name="dob"]')).toBeTruthy();
    });

    it('has an "allergies" slot in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, 'slot[name="allergies"]')).toBeTruthy();
    });

    it('has a "code-status" slot in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, 'slot[name="code-status"]')).toBeTruthy();
    });

    it('has a "photo" slot in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(shadowQuery(el, 'slot[name="photo"]')).toBeTruthy();
    });
  });

  // ─── Slots: content projection ───

  describe('Slotted Content', () => {
    it('projects content into the "name" slot', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="name">Jane Doe</span></hx-patient-banner>',
      );
      const slotted = el.querySelector('[slot="name"]') as HTMLElement;
      expect(slotted).toBeTruthy();
      expect(slotted.textContent).toBe('Jane Doe');
    });

    it('projects content into the "mrn" slot', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="mrn">MRN-001</span></hx-patient-banner>',
      );
      const slotted = el.querySelector('[slot="mrn"]') as HTMLElement;
      expect(slotted).toBeTruthy();
      expect(slotted.textContent).toBe('MRN-001');
    });

    it('projects content into the "dob" slot', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="dob">01/01/1980</span></hx-patient-banner>',
      );
      const slotted = el.querySelector('[slot="dob"]') as HTMLElement;
      expect(slotted).toBeTruthy();
      expect(slotted.textContent).toBe('01/01/1980');
    });

    it('projects content into the "allergies" slot', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="allergies">NKDA</span></hx-patient-banner>',
      );
      const slotted = el.querySelector('[slot="allergies"]') as HTMLElement;
      expect(slotted).toBeTruthy();
      expect(slotted.textContent).toBe('NKDA');
    });

    it('projects content into the "code-status" slot', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="code-status">Full Code</span></hx-patient-banner>',
      );
      const slotted = el.querySelector('[slot="code-status"]') as HTMLElement;
      expect(slotted).toBeTruthy();
      expect(slotted.textContent).toBe('Full Code');
    });

    it('projects content into the "photo" slot', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><img slot="photo" src="photo.jpg" alt="Patient" /></hx-patient-banner>',
      );
      const slotted = el.querySelector('[slot="photo"]') as HTMLImageElement;
      expect(slotted).toBeTruthy();
      expect(slotted.tagName.toLowerCase()).toBe('img');
    });
  });

  // ─── Two-identifier rule: violation ───

  describe('Two-Identifier Rule: violation', () => {
    it('fires hx-identifier-rule-violation when no identifier slots are populated', async () => {
      const eventPromise = oneEvent<CustomEvent>(document, 'hx-identifier-rule-violation');
      await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-identifier-rule-violation detail has populatedIdentifiers=0 for empty banner', async () => {
      const eventPromise = oneEvent<CustomEvent>(document, 'hx-identifier-rule-violation');
      await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const event = await eventPromise;
      expect(event.detail.populatedIdentifiers).toBe(0);
    });

    it('hx-identifier-rule-violation detail has requiredIdentifiers=2', async () => {
      const eventPromise = oneEvent<CustomEvent>(document, 'hx-identifier-rule-violation');
      await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const event = await eventPromise;
      expect(event.detail.requiredIdentifiers).toBe(2);
    });

    it('hx-identifier-rule-violation detail includes patientId when set', async () => {
      const eventPromise = oneEvent<CustomEvent>(document, 'hx-identifier-rule-violation');
      await fixture<HelixPatientBanner>(
        '<hx-patient-banner patient-id="P12345"></hx-patient-banner>',
      );
      const event = await eventPromise;
      expect(event.detail.patientId).toBe('P12345');
    });

    it('hx-identifier-rule-violation bubbles', async () => {
      const eventPromise = oneEvent<CustomEvent>(document, 'hx-identifier-rule-violation');
      await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
    });

    it('hx-identifier-rule-violation is composed', async () => {
      const eventPromise = oneEvent<CustomEvent>(document, 'hx-identifier-rule-violation');
      await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const event = await eventPromise;
      expect(event.composed).toBe(true);
    });

    it('fires hx-identifier-rule-violation when only 1 identifier is populated', async () => {
      // Listen on document since it bubbles and is composed
      let fired = false;
      const handler = () => {
        fired = true;
      };
      document.addEventListener('hx-identifier-rule-violation', handler, { once: true });
      await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="name">Jane Doe</span></hx-patient-banner>',
      );
      // slotchange fires synchronously once the slot is assigned; allow microtasks to flush
      await Promise.resolve();
      document.removeEventListener('hx-identifier-rule-violation', handler);
      expect(fired).toBe(true);
    });

    it('sets aria-invalid="true" on host when identifier rule is violated', async () => {
      // Empty banner fires the violation immediately on slotchange (zero identifiers)
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      // The slotchange fires after first render; wait one microtask cycle
      await Promise.resolve();
      expect(el.getAttribute('aria-invalid')).toBe('true');
    });
  });

  // ─── Two-identifier rule: satisfied ───

  describe('Two-Identifier Rule: satisfied', () => {
    it('does NOT fire hx-identifier-rule-violation when 2 identifier slots are populated', async () => {
      let fired = false;
      const handler = () => {
        fired = true;
      };
      document.addEventListener('hx-identifier-rule-violation', handler);
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="name">Jane Doe</span><span slot="mrn">MRN-001</span></hx-patient-banner>',
      );
      await el.updateComplete;
      await Promise.resolve();
      document.removeEventListener('hx-identifier-rule-violation', handler);
      expect(fired).toBe(false);
    });

    it('does NOT fire hx-identifier-rule-violation when all 3 identifier slots are populated', async () => {
      let fired = false;
      const handler = () => {
        fired = true;
      };
      document.addEventListener('hx-identifier-rule-violation', handler);
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="name">Jane Doe</span><span slot="mrn">MRN-001</span><span slot="dob">01/01/1980</span></hx-patient-banner>',
      );
      await el.updateComplete;
      await Promise.resolve();
      document.removeEventListener('hx-identifier-rule-violation', handler);
      expect(fired).toBe(false);
    });

    it('removes aria-invalid when 2 identifier slots are populated', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="name">Jane Doe</span><span slot="mrn">MRN-001</span></hx-patient-banner>',
      );
      await el.updateComplete;
      await Promise.resolve();
      expect(el.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ─── Two-identifier rule: disabled ───

  describe('Two-Identifier Rule: disabled', () => {
    it('does NOT fire hx-identifier-rule-violation when enforce-identifier-rule is false and only 1 identifier is populated', async () => {
      let fired = false;
      const handler = () => {
        fired = true;
      };
      document.addEventListener('hx-identifier-rule-violation', handler);
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner enforce-identifier-rule="false"><span slot="name">Jane Doe</span></hx-patient-banner>',
      );
      await el.updateComplete;
      await Promise.resolve();
      document.removeEventListener('hx-identifier-rule-violation', handler);
      expect(fired).toBe(false);
    });

    it('does NOT fire hx-identifier-rule-violation when enforce-identifier-rule is false and no identifiers are populated', async () => {
      let fired = false;
      const handler = () => {
        fired = true;
      };
      document.addEventListener('hx-identifier-rule-violation', handler);
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner enforce-identifier-rule="false"></hx-patient-banner>',
      );
      await el.updateComplete;
      await Promise.resolve();
      document.removeEventListener('hx-identifier-rule-violation', handler);
      expect(fired).toBe(false);
    });

    it('does NOT set aria-invalid when enforce-identifier-rule is false', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner enforce-identifier-rule="false"></hx-patient-banner>',
      );
      await el.updateComplete;
      await Promise.resolve();
      expect(el.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ─── Custom field labels ───

  describe('Custom Field Labels', () => {
    it('renders default "Patient name" label for name field', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const nameLabel = Array.from(labels).find((l) => l.textContent?.trim() === 'Patient name');
      expect(nameLabel).toBeTruthy();
    });

    it('renders custom label-name in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner label-name="Full Name"></hx-patient-banner>',
      );
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const nameLabel = Array.from(labels).find((l) => l.textContent?.trim() === 'Full Name');
      expect(nameLabel).toBeTruthy();
    });

    it('renders default "MRN" label for mrn field', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const mrnLabel = Array.from(labels).find((l) => l.textContent?.trim() === 'MRN');
      expect(mrnLabel).toBeTruthy();
    });

    it('renders custom label-mrn in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner label-mrn="Medical Record #"></hx-patient-banner>',
      );
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const mrnLabel = Array.from(labels).find(
        (l) => l.textContent?.trim() === 'Medical Record #',
      );
      expect(mrnLabel).toBeTruthy();
    });

    it('renders default "Date of birth" label for dob field', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const dobLabel = Array.from(labels).find((l) => l.textContent?.trim() === 'Date of birth');
      expect(dobLabel).toBeTruthy();
    });

    it('renders custom label-dob in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner label-dob="Birth Date"></hx-patient-banner>',
      );
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const dobLabel = Array.from(labels).find((l) => l.textContent?.trim() === 'Birth Date');
      expect(dobLabel).toBeTruthy();
    });

    it('renders default "Allergies" label for allergies field', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const allergiesLabel = Array.from(labels).find(
        (l) => l.textContent?.trim() === 'Allergies',
      );
      expect(allergiesLabel).toBeTruthy();
    });

    it('renders custom label-allergies in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner label-allergies="Known Allergies"></hx-patient-banner>',
      );
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const allergiesLabel = Array.from(labels).find(
        (l) => l.textContent?.trim() === 'Known Allergies',
      );
      expect(allergiesLabel).toBeTruthy();
    });

    it('renders default "Code status" label for code-status field', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const codeStatusLabel = Array.from(labels).find(
        (l) => l.textContent?.trim() === 'Code status',
      );
      expect(codeStatusLabel).toBeTruthy();
    });

    it('renders custom label-code-status in shadow DOM', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner label-code-status="Resuscitation Status"></hx-patient-banner>',
      );
      const labels = shadowQueryAll<HTMLElement>(el, '[part~="field-label"]');
      const codeStatusLabel = Array.from(labels).find(
        (l) => l.textContent?.trim() === 'Resuscitation Status',
      );
      expect(codeStatusLabel).toBeTruthy();
    });
  });

  // ─── Property: patient-id ───

  describe('Property: patient-id', () => {
    it('defaults patientId to empty string', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(el.patientId).toBe('');
    });

    it('reads back patient-id attribute as patientId property', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner patient-id="P98765"></hx-patient-banner>',
      );
      expect(el.patientId).toBe('P98765');
    });

    it('allows setting patientId property directly', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      el.patientId = 'P00042';
      await el.updateComplete;
      expect(el.patientId).toBe('P00042');
    });
  });

  // ─── Property: enforceIdentifierRule ───

  describe('Property: enforceIdentifierRule', () => {
    it('defaults enforceIdentifierRule to true', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      expect(el.enforceIdentifierRule).toBe(true);
    });

    it('reflects enforce-identifier-rule attribute as false when set to false', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner enforce-identifier-rule="false"></hx-patient-banner>',
      );
      expect(el.enforceIdentifierRule).toBe(false);
    });
  });

  // ─── Accessibility: WCAG audit ───

  describe('Accessibility: WCAG audit', () => {
    it('has no accessibility violations when identifier rule is satisfied', async () => {
      const el = await fixture<HelixPatientBanner>(
        '<hx-patient-banner><span slot="name">Jane Doe</span><span slot="mrn">MRN-001</span></hx-patient-banner>',
      );
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no accessibility violations in error state (aria-invalid)', async () => {
      const el = await fixture<HelixPatientBanner>('<hx-patient-banner></hx-patient-banner>');
      await Promise.resolve();
      expect(el.getAttribute('aria-invalid')).toBe('true');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
