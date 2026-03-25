import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxClinicalStatus } from './hx-clinical-status.js';
import './index.js';

afterEach(cleanup);

describe('hx-clinical-status', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the container', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      const container = shadowQuery(el, '.clinical-status');
      expect(container).toBeTruthy();
    });

    it('renders the message text', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Patient vitals normal"></hx-clinical-status>',
      );
      const message = shadowQuery(el, '[part="message"]');
      expect(message?.textContent).toContain('Patient vitals normal');
    });
  });

  // ─── Property: severity (5) ───

  describe('Property: severity', () => {
    it('defaults to "info"', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      expect(el.severity).toBe('info');
    });

    it('reflects severity attribute to property', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="critical" message="Test"></hx-clinical-status>',
      );
      expect(el.severity).toBe('critical');
    });

    it('applies "warning" severity via attribute', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="warning" message="Test"></hx-clinical-status>',
      );
      expect(el.getAttribute('severity')).toBe('warning');
    });

    it('applies "critical" severity class', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="critical" message="Test"></hx-clinical-status>',
      );
      const container = shadowQuery(el, '.clinical-status');
      expect(container?.classList.contains('clinical-status--critical')).toBe(true);
    });

    it('applies "emergent" severity class', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="emergent" message="Test"></hx-clinical-status>',
      );
      const container = shadowQuery(el, '.clinical-status');
      expect(container?.classList.contains('clinical-status--emergent')).toBe(true);
    });
  });

  // ─── Property: message (2) ───

  describe('Property: message', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status></hx-clinical-status>',
      );
      expect(el.message).toBe('');
    });

    it('renders message content', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Blood pressure elevated"></hx-clinical-status>',
      );
      const message = shadowQuery(el, '[part="message"]');
      expect(message?.textContent).toContain('Blood pressure elevated');
    });
  });

  // ─── Property: dismissible (3) ───

  describe('Property: dismissible', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      expect(el.dismissible).toBe(false);
    });

    it('renders dismiss button when dismissible', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status dismissible message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery(el, '.clinical-status__dismiss-button');
      expect(btn).toBeTruthy();
    });

    it('does not render dismiss button when not dismissible', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery(el, '.clinical-status__dismiss-button');
      expect(btn).toBeNull();
    });
  });

  // ─── Property: compact (2) ───

  describe('Property: compact', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      expect(el.compact).toBe(false);
    });

    it('applies compact class when compact is true', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status compact message="Test"></hx-clinical-status>',
      );
      const container = shadowQuery(el, '.clinical-status');
      expect(container?.classList.contains('clinical-status--compact')).toBe(true);
    });
  });

  // ─── Property: persistent (2) ───

  describe('Property: persistent', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      expect(el.persistent).toBe(false);
    });

    it('reflects persistent attribute', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status persistent message="Test"></hx-clinical-status>',
      );
      expect(el.hasAttribute('persistent')).toBe(true);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-dismiss when dismiss button is clicked', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status dismissible message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '.clinical-status__dismiss-button');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-dismiss');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-dismiss bubbles and is composed', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status dismissible message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '.clinical-status__dismiss-button');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-dismiss');
      btn?.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-acknowledge for critical severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="critical" message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '.clinical-status__acknowledge-button');
      expect(btn).toBeTruthy();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-acknowledge');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.detail.severity).toBe('critical');
    });

    it('dispatches hx-acknowledge for emergent severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="emergent" message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '.clinical-status__acknowledge-button');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-acknowledge');
      btn?.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.detail.severity).toBe('emergent');
    });
  });

  // ─── Acknowledge Behavior (2) ───

  describe('Acknowledge behavior', () => {
    it('shows acknowledge button for critical severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="critical" message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery(el, '.clinical-status__acknowledge-button');
      expect(btn).toBeTruthy();
    });

    it('shows acknowledge button for emergent severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="emergent" message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery(el, '.clinical-status__acknowledge-button');
      expect(btn).toBeTruthy();
    });

    it('does not show acknowledge button for info severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="info" message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery(el, '.clinical-status__acknowledge-button');
      expect(btn).toBeNull();
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('renders default slot content', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Main">Additional details</hx-clinical-status>',
      );
      expect(el.textContent?.trim()).toContain('Additional details');
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "container" part', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      const part = shadowQuery(el, '[part="container"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" part', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('exposes "message" part', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      const part = shadowQuery(el, '[part="message"]');
      expect(part).toBeTruthy();
    });

    it('exposes "actions" part', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test"></hx-clinical-status>',
      );
      const part = shadowQuery(el, '[part="actions"]');
      expect(part).toBeTruthy();
    });

    it('exposes "dismiss-button" part when dismissible', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status dismissible message="Test"></hx-clinical-status>',
      );
      const part = shadowQuery(el, '[part="dismiss-button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "acknowledge-button" part when acknowledgeable', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="critical" message="Test"></hx-clinical-status>',
      );
      const part = shadowQuery(el, '[part="acknowledge-button"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility (6) ───

  describe('Accessibility', () => {
    it('uses role="status" for info severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="info" message="Info"></hx-clinical-status>',
      );
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="status" for warning severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="warning" message="Warning"></hx-clinical-status>',
      );
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="alert" for critical severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="critical" message="Critical"></hx-clinical-status>',
      );
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('uses role="alert" for emergent severity', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="emergent" message="Emergent"></hx-clinical-status>',
      );
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('updates host role when severity changes', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status severity="info" message="Test"></hx-clinical-status>',
      );
      expect(el.getAttribute('role')).toBe('status');
      el.severity = 'critical';
      await el.updateComplete;
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('dismiss button has aria-label', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status dismissible message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '.clinical-status__dismiss-button');
      expect(btn?.getAttribute('aria-label')).toBe('Dismiss clinical status');
    });
  });

  // ─── Dismiss Button Semantics (1) ───

  describe('Dismiss button semantics', () => {
    it('dismiss button is a <button> element', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status dismissible message="Test"></hx-clinical-status>',
      );
      const btn = shadowQuery(el, '.clinical-status__dismiss-button');
      expect(btn?.tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── Default Icons (1) ───

  describe('Default icons', () => {
    it('renders a default SVG icon per severity', async () => {
      const severities = ['info', 'warning', 'critical', 'emergent'] as const;
      for (const severity of severities) {
        const el = await fixture<HxClinicalStatus>(
          `<hx-clinical-status severity="${severity}" message="Test"></hx-clinical-status>`,
        );
        const iconContainer = shadowQuery(el, '[part="icon"]');
        const svg = iconContainer?.querySelector('svg');
        expect(svg, `severity="${severity}" should render an SVG icon`).toBeTruthy();
        el.remove();
      }
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status message="Test status"></hx-clinical-status>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all severities', async () => {
      for (const severity of ['info', 'warning', 'critical', 'emergent']) {
        const el = await fixture<HxClinicalStatus>(
          `<hx-clinical-status severity="${severity}" message="Status message"></hx-clinical-status>`,
        );
        const { violations } = await checkA11y(el);
        expect(violations, `severity="${severity}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when dismissible', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status dismissible message="Dismissible status"></hx-clinical-status>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in compact mode', async () => {
      const el = await fixture<HxClinicalStatus>(
        '<hx-clinical-status compact message="Compact status"></hx-clinical-status>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
