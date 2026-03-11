import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixSteps } from './hx-steps.js';
import type { HelixStep } from './hx-step.js';
import './index.js';

afterEach(cleanup);

// ─── Fixture Helpers ───────────────────────────────────────────────────────────

const THREE_STEPS_HTML = `
  <hx-steps aria-label="Checkout progress">
    <hx-step label="Cart" status="complete" description="Items added"></hx-step>
    <hx-step label="Payment" status="active" description="Enter payment info"></hx-step>
    <hx-step label="Confirm" status="pending" description="Review order"></hx-step>
  </hx-steps>
`;

const ALL_STATUSES_HTML = `
  <hx-steps aria-label="All statuses">
    <hx-step label="Complete" status="complete"></hx-step>
    <hx-step label="Active" status="active"></hx-step>
    <hx-step label="Error" status="error"></hx-step>
    <hx-step label="Pending" status="pending"></hx-step>
  </hx-steps>
`;

// ─── hx-steps tests ────────────────────────────────────────────────────────────

describe('hx-steps', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('has role="list" on host', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      expect(el.getAttribute('role')).toBe('list');
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('renders default orientation=horizontal', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      expect(el.orientation).toBe('horizontal');
    });

    it('renders default size=md', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      expect(el.size).toBe('md');
    });
  });

  // ─── Property: orientation ───

  describe('Property: orientation', () => {
    it('reflects orientation attr to host', async () => {
      const el = await fixture<HelixSteps>(
        '<hx-steps orientation="vertical"><hx-step label="A" status="pending"></hx-step></hx-steps>',
      );
      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('propagates orientation to child hx-step elements', async () => {
      const el = await fixture<HelixSteps>(
        '<hx-steps orientation="vertical"><hx-step label="A" status="pending"></hx-step><hx-step label="B" status="pending"></hx-step></hx-steps>',
      );
      await el.updateComplete;
      const steps = el.querySelectorAll('hx-step');
      steps.forEach((step) => {
        expect((step as HelixStep).orientation).toBe('vertical');
      });
    });
  });

  // ─── Property: size ───

  describe('Property: size', () => {
    it('reflects size attr to host', async () => {
      const el = await fixture<HelixSteps>(
        '<hx-steps size="lg"><hx-step label="A" status="pending"></hx-step></hx-steps>',
      );
      expect(el.getAttribute('size')).toBe('lg');
    });

    it('propagates size to child hx-step elements', async () => {
      const el = await fixture<HelixSteps>(
        '<hx-steps size="sm"><hx-step label="A" status="pending"></hx-step><hx-step label="B" status="pending"></hx-step></hx-steps>',
      );
      await el.updateComplete;
      const steps = el.querySelectorAll('hx-step');
      steps.forEach((step) => {
        expect((step as HelixStep).size).toBe('sm');
      });
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-step-click when a step is clicked', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      await el.updateComplete;
      const steps = el.querySelectorAll('hx-step');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-step-click');
      const firstStep = steps[0] as HelixStep;
      firstStep.shadowRoot
        ?.querySelector('.step')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-step-click detail contains step and index', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      await el.updateComplete;
      const steps = el.querySelectorAll('hx-step');
      const eventPromise = oneEvent<CustomEvent<{ step: HelixStep; index: number }>>(
        el,
        'hx-step-click',
      );
      const firstStep = steps[0] as HelixStep;
      firstStep.shadowRoot
        ?.querySelector('.step')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event.detail.index).toBe(0);
      expect(event.detail.step).toBeInstanceOf(HTMLElement);
    });

    it('hx-step-click bubbles and is composed', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      await el.updateComplete;
      const steps = el.querySelectorAll('hx-step');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-step-click');
      const firstStep = steps[0] as HelixStep;
      firstStep.shadowRoot
        ?.querySelector('.step')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Child Indexing ───

  describe('Child Indexing', () => {
    it('sets sequential index on each hx-step', async () => {
      const el = await fixture<HelixSteps>(THREE_STEPS_HTML);
      await el.updateComplete;
      const steps = Array.from(el.querySelectorAll('hx-step')) as HelixStep[];
      steps.forEach((step, i) => {
        expect(step.index).toBe(i);
      });
    });
  });

  // ─── Dynamic Child Re-sync ───

  describe('Dynamic Child Re-sync (slot change)', () => {
    it('re-syncs index and orientation when a new hx-step is appended', async () => {
      const el = await fixture<HelixSteps>(
        '<hx-steps orientation="vertical" aria-label="Dynamic steps"><hx-step label="A" status="complete"></hx-step><hx-step label="B" status="active"></hx-step></hx-steps>',
      );
      await el.updateComplete;

      // Append a new step dynamically
      const newStep = document.createElement('hx-step') as HelixStep;
      newStep.label = 'C';
      newStep.status = 'pending';
      el.appendChild(newStep);

      // Wait for slotchange + re-render
      await el.updateComplete;
      await newStep.updateComplete;

      const steps = Array.from(el.querySelectorAll('hx-step')) as HelixStep[];
      expect(steps).toHaveLength(3);
      expect(steps[2].index).toBe(2);
      expect(steps[2].orientation).toBe('vertical');
    });
  });
});

// ─── hx-step tests ─────────────────────────────────────────────────────────────

describe('hx-step', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('has role="listitem" on host', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      expect(el.getAttribute('role')).toBe('listitem');
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      expect(shadowQuery(el, '[part~="base"]')).toBeTruthy();
    });

    it('exposes "indicator" CSS part', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      expect(shadowQuery(el, '[part~="indicator"]')).toBeTruthy();
    });

    it('exposes "connector" CSS part', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      expect(shadowQuery(el, '[part~="connector"]')).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      expect(shadowQuery(el, '[part~="label"]')).toBeTruthy();
    });

    it('exposes "description" CSS part', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step label="Test" status="pending" description="Desc"></hx-step>',
      );
      expect(shadowQuery(el, '[part~="description"]')).toBeTruthy();
    });

    it('connector has aria-hidden="true"', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      const connector = shadowQuery(el, '[part~="connector"]');
      expect(connector?.getAttribute('aria-hidden')).toBe('true');
    });

    it('displays step number (index + 1) when pending', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      el.index = 2;
      await el.updateComplete;
      const indicator = shadowQuery(el, '[part~="indicator"]');
      expect(indicator?.textContent?.trim()).toContain('3');
    });
  });

  // ─── Property: status ───

  describe('Property: status', () => {
    it('reflects status attr to host', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="active"></hx-step>');
      expect(el.getAttribute('status')).toBe('active');
    });

    it('sets aria-current="step" on host when active', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="active"></hx-step>');
      await el.updateComplete;
      expect(el.getAttribute('aria-current')).toBe('step');
    });

    it('does not set aria-current when pending', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      await el.updateComplete;
      expect(el.hasAttribute('aria-current')).toBe(false);
    });

    it('does not set aria-current when complete', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="complete"></hx-step>');
      await el.updateComplete;
      expect(el.hasAttribute('aria-current')).toBe(false);
    });

    it('does not set aria-current when error', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="error"></hx-step>');
      await el.updateComplete;
      expect(el.hasAttribute('aria-current')).toBe(false);
    });

    it('renders checkmark SVG when complete', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="complete"></hx-step>');
      const indicator = shadowQuery(el, '[part~="indicator"]');
      const svg = indicator?.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders X SVG when error', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="error"></hx-step>');
      const indicator = shadowQuery(el, '[part~="indicator"]');
      const svg = indicator?.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders sr-only "Complete" text when complete', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="complete"></hx-step>');
      const indicator = shadowQuery(el, '[part~="indicator"]');
      const srOnly = indicator?.querySelector('.sr-only');
      expect(srOnly?.textContent).toBe('Complete');
    });

    it('renders sr-only "Error" text when error', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="error"></hx-step>');
      const indicator = shadowQuery(el, '[part~="indicator"]');
      const srOnly = indicator?.querySelector('.sr-only');
      expect(srOnly?.textContent).toBe('Error');
    });
  });

  // ─── Property: label ───

  describe('Property: label', () => {
    it('reflects label attr to host', async () => {
      const el = await fixture<HelixStep>('<hx-step label="My Step" status="pending"></hx-step>');
      expect(el.getAttribute('label')).toBe('My Step');
    });

    it('renders label text via property in shadow DOM', async () => {
      const el = await fixture<HelixStep>('<hx-step label="My Step" status="pending"></hx-step>');
      const labelEl = shadowQuery(el, '[part~="label"]');
      expect(labelEl?.textContent?.trim()).toContain('My Step');
    });
  });

  // ─── Property: description ───

  describe('Property: description', () => {
    it('reflects description attr to host', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step label="Test" status="pending" description="Some desc"></hx-step>',
      );
      expect(el.getAttribute('description')).toBe('Some desc');
    });

    it('renders description text in shadow DOM', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step label="Test" status="pending" description="Some desc"></hx-step>',
      );
      const descEl = shadowQuery(el, '[part~="description"]');
      expect(descEl?.textContent?.trim()).toContain('Some desc');
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('label slot renders custom content', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step status="pending"><span slot="label">Custom Label</span></hx-step>',
      );
      const slottedLabel = el.querySelector('[slot="label"]');
      expect(slottedLabel).toBeTruthy();
      expect(slottedLabel?.textContent).toBe('Custom Label');
    });

    it('description slot renders custom content', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step status="pending"><span slot="description">Custom desc</span></hx-step>',
      );
      const slottedDesc = el.querySelector('[slot="description"]');
      expect(slottedDesc).toBeTruthy();
    });

    it('icon slot renders custom icon when pending', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step status="pending"><svg slot="icon" aria-hidden="true"><path/></svg></hx-step>',
      );
      const icon = el.querySelector('[slot="icon"]');
      expect(icon).toBeTruthy();
    });
  });

  // ─── Property: disabled ───

  describe('Property: disabled', () => {
    it('reflects disabled attr to host', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step label="Test" status="pending" disabled></hx-step>',
      );
      expect(el.getAttribute('disabled')).not.toBeNull();
    });

    it('sets aria-disabled="true" when disabled', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step label="Test" status="pending" disabled></hx-step>',
      );
      await el.updateComplete;
      expect(el.getAttribute('aria-disabled')).toBe('true');
    });

    it('sets tabindex="-1" when disabled', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step label="Test" status="pending" disabled></hx-step>',
      );
      await el.updateComplete;
      expect(el.getAttribute('tabindex')).toBe('-1');
    });

    it('does not fire hx-step-click-internal when disabled', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step label="Test" status="pending" disabled></hx-step>',
      );
      let fired = false;
      el.addEventListener('hx-step-click-internal', () => {
        fired = true;
      });
      el.shadowRoot
        ?.querySelector('.step')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect(fired).toBe(false);
    });

    it('removes aria-disabled when re-enabled', async () => {
      const el = await fixture<HelixStep>(
        '<hx-step label="Test" status="pending" disabled></hx-step>',
      );
      await el.updateComplete;
      expect(el.getAttribute('aria-disabled')).toBe('true');
      el.disabled = false;
      await el.updateComplete;
      expect(el.hasAttribute('aria-disabled')).toBe(false);
      expect(el.getAttribute('tabindex')).toBe('0');
    });
  });

  // ─── Keyboard Navigation ───

  describe('Keyboard Navigation', () => {
    it('has tabindex="0" by default', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      expect(el.getAttribute('tabindex')).toBe('0');
    });

    it('fires hx-step-click-internal on Enter key', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      let fired = false;
      el.addEventListener('hx-step-click-internal', () => {
        fired = true;
      });
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(fired).toBe(true);
    });

    it('fires hx-step-click-internal on Space key', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      let fired = false;
      el.addEventListener('hx-step-click-internal', () => {
        fired = true;
      });
      el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(fired).toBe(true);
    });

    it('does not fire on other keys', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      let fired = false;
      el.addEventListener('hx-step-click-internal', () => {
        fired = true;
      });
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      expect(fired).toBe(false);
    });
  });

  // ─── aria-current ───

  describe('aria-current on host', () => {
    it('sets aria-current="step" on host when active', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="active"></hx-step>');
      await el.updateComplete;
      expect(el.getAttribute('aria-current')).toBe('step');
    });

    it('removes aria-current from host when not active', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="pending"></hx-step>');
      await el.updateComplete;
      expect(el.hasAttribute('aria-current')).toBe(false);
    });

    it('removes aria-current when status changes from active to complete', async () => {
      const el = await fixture<HelixStep>('<hx-step label="Test" status="active"></hx-step>');
      await el.updateComplete;
      expect(el.getAttribute('aria-current')).toBe('step');
      el.status = 'complete';
      await el.updateComplete;
      expect(el.hasAttribute('aria-current')).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('hx-steps with steps has no axe violations', async () => {
      const el = await fixture<HelixSteps>(
        `<hx-steps aria-label="Progress steps">
          <hx-step label="Step one" status="complete"></hx-step>
          <hx-step label="Step two" status="active"></hx-step>
          <hx-step label="Step three" status="pending"></hx-step>
        </hx-steps>`,
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('hx-steps vertical has no axe violations', async () => {
      const el = await fixture<HelixSteps>(
        `<hx-steps aria-label="Vertical progress" orientation="vertical">
          <hx-step label="Step one" status="complete"></hx-step>
          <hx-step label="Step two" status="active"></hx-step>
          <hx-step label="Step three" status="pending"></hx-step>
        </hx-steps>`,
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('hx-steps with all statuses has no axe violations', async () => {
      const el = await fixture<HelixSteps>(ALL_STATUSES_HTML);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('hx-step standalone has no axe violations', async () => {
      const el = await fixture<HelixStep>(
        '<ul><hx-step label="A step" status="pending" description="With description"></hx-step></ul>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
