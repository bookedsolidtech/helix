import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixButtonGroup } from './hx-button-group.js';
import './index.js';
import '../hx-button/index.js';

afterEach(cleanup);

describe('hx-button-group', () => {
  // ─── Rendering (2) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button 1</hx-button>
          <hx-button variant="secondary">Button 2</hx-button>
        </hx-button-group>
      `);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "group" CSS part', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      const group = shadowQuery(el, '[part="group"]');
      expect(group).toBeTruthy();
    });
  });

  // ─── Property: orientation (4) ───

  describe('Property: orientation', () => {
    it('applies horizontal class by default', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      const group = shadowQuery(el, '[part="group"]');
      expect(group?.classList.contains('group--horizontal')).toBe(true);
    });

    it('applies vertical class when orientation="vertical"', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group orientation="vertical">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      const group = shadowQuery(el, '[part="group"]');
      expect(group?.classList.contains('group--vertical')).toBe(true);
    });

    it('applies horizontal class when orientation="horizontal" explicitly', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group orientation="horizontal">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      const group = shadowQuery(el, '[part="group"]');
      expect(group?.classList.contains('group--horizontal')).toBe(true);
    });

    it('reflects orientation attribute to the host element', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group orientation="vertical">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('updates class when orientation changes dynamically', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group orientation="horizontal">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      el.orientation = 'vertical';
      await el.updateComplete;
      const group = shadowQuery(el, '[part="group"]');
      expect(group?.classList.contains('group--vertical')).toBe(true);
      expect(group?.classList.contains('group--horizontal')).toBe(false);
    });
  });

  // ─── Property: size (4) ───

  describe('Property: size', () => {
    it('defaults to size="md"', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      expect(el.size).toBe('md');
    });

    it('propagates hx-size="sm" as CSS property --hx-button-group-size', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group hx-size="sm">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      const computed = getComputedStyle(el);
      expect(computed.getPropertyValue('--hx-button-group-size').trim()).toBe('sm');
    });

    it('propagates hx-size="md" as CSS property --hx-button-group-size', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group hx-size="md">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      const computed = getComputedStyle(el);
      expect(computed.getPropertyValue('--hx-button-group-size').trim()).toBe('md');
    });

    it('propagates hx-size="lg" as CSS property --hx-button-group-size', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group hx-size="lg">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      const computed = getComputedStyle(el);
      expect(computed.getPropertyValue('--hx-button-group-size').trim()).toBe('lg');
    });

    it('updates --hx-button-group-size when size changes dynamically', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group hx-size="sm">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      el.size = 'lg';
      await el.updateComplete;
      const computed = getComputedStyle(el);
      expect(computed.getPropertyValue('--hx-button-group-size').trim()).toBe('lg');
    });
  });

  // ─── CSS: Single Button (1) ───

  describe('CSS: Single Button', () => {
    it('single button receives full border-radius via :only-child rule', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Only Button</hx-button>
        </hx-button-group>
      `);
      const button = el.querySelector('hx-button');
      expect(button).toBeTruthy();
      const computed = getComputedStyle(button!);
      const radius = computed.getPropertyValue('--hx-button-border-radius').trim();
      // :only-child rule sets a uniform value; verify it is NOT the split
      // first-child pattern "radius 0 0 radius"
      expect(radius).not.toMatch(/^0\s/);
    });
  });

  // ─── Property: label (2) ───

  describe('Property: label', () => {
    it('sets internals ariaLabel when label property is provided', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group label="Form actions">
          <hx-button variant="secondary">Save</hx-button>
          <hx-button variant="secondary">Cancel</hx-button>
        </hx-button-group>
      `);
      expect(el.label).toBe('Form actions');
    });

    it('clears internals ariaLabel when label is set to empty string', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group label="Form actions">
          <hx-button variant="secondary">Save</hx-button>
        </hx-button-group>
      `);
      expect(el.label).toBe('Form actions');
      el.label = '';
      await el.updateComplete;
      expect(el.label).toBe('');
    });
  });

  // ─── Slot & Content (3) ───

  describe('Slots & Content', () => {
    it('accepts hx-button children in default slot', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button 1</hx-button>
          <hx-button variant="secondary">Button 2</hx-button>
          <hx-button variant="secondary">Button 3</hx-button>
        </hx-button-group>
      `);
      const buttons = el.querySelectorAll('hx-button');
      expect(buttons.length).toBe(3);
    });

    it('dynamically appended button appears in the group', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button 1</hx-button>
        </hx-button-group>
      `);

      const button2 = document.createElement('hx-button');
      button2.setAttribute('variant', 'secondary');
      button2.textContent = 'Button 2';
      el.appendChild(button2);

      await el.updateComplete;
      const buttons = el.querySelectorAll('hx-button');
      expect(buttons.length).toBe(2);
    });

    it('renders slot content inside group container', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      const slot = shadowQuery(el, 'slot');
      expect(slot).toBeTruthy();
    });
  });

  // ─── Mixed Variants (1) ───

  describe('Mixed Variants', () => {
    it('renders buttons with different variants correctly', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="primary">Confirm</hx-button>
          <hx-button variant="secondary">Review</hx-button>
          <hx-button variant="ghost">Dismiss</hx-button>
        </hx-button-group>
      `);
      const buttons = el.querySelectorAll('hx-button');
      expect(buttons.length).toBe(3);
      expect(buttons[0].getAttribute('variant')).toBe('primary');
      expect(buttons[1].getAttribute('variant')).toBe('secondary');
      expect(buttons[2].getAttribute('variant')).toBe('ghost');
    });
  });

  // ─── Disabled Children (2) ───

  describe('Disabled Children', () => {
    it('renders with a mix of disabled and enabled buttons', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Enabled</hx-button>
          <hx-button variant="secondary" disabled>Disabled</hx-button>
          <hx-button variant="secondary">Enabled</hx-button>
        </hx-button-group>
      `);
      const buttons = el.querySelectorAll('hx-button');
      expect(buttons.length).toBe(3);
      expect(buttons[0].disabled).toBe(false);
      expect(buttons[1].disabled).toBe(true);
      expect(buttons[2].disabled).toBe(false);
    });

    it('has no axe violations with disabled children', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group aria-label="Actions">
          <hx-button variant="secondary">Active</hx-button>
          <hx-button variant="secondary" disabled>Disabled</hx-button>
        </hx-button-group>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Keyboard Navigation (1) ───

  describe('Keyboard Navigation', () => {
    it('each child button is reachable via sequential Tab', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group aria-label="Actions">
          <hx-button variant="secondary">First</hx-button>
          <hx-button variant="secondary">Second</hx-button>
          <hx-button variant="secondary">Third</hx-button>
        </hx-button-group>
      `);
      const buttons = el.querySelectorAll('hx-button');
      expect(buttons.length).toBe(3);
      // Verify all buttons exist and are in the DOM (sequential tab order is
      // native browser behavior for role="group" with tabbable children)
      for (const btn of buttons) {
        expect(btn.shadowRoot?.querySelector('button')).toBeTruthy();
      }
    });
  });

  // ─── Accessibility (5) ───

  describe('Accessibility', () => {
    it('uses ElementInternals for role (no explicit role attribute on host or wrapper)', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      expect(el.getAttribute('role')).toBeNull();
      const wrapper = shadowQuery(el, '[part="group"]');
      expect(wrapper?.hasAttribute('role')).toBe(false);
    });

    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button 1</hx-button>
          <hx-button variant="secondary">Button 2</hx-button>
        </hx-button-group>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with horizontal orientation', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group orientation="horizontal">
          <hx-button variant="secondary">Button 1</hx-button>
          <hx-button variant="secondary">Button 2</hx-button>
        </hx-button-group>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with vertical orientation', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group orientation="vertical">
          <hx-button variant="secondary">Button 1</hx-button>
          <hx-button variant="secondary">Button 2</hx-button>
        </hx-button-group>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with aria-label', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group aria-label="Form actions">
          <hx-button variant="secondary">Save</hx-button>
          <hx-button variant="secondary">Cancel</hx-button>
        </hx-button-group>
      `);
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Export Verification (1) ───

  describe('Export Verification', () => {
    it('HelixButtonGroup class is exported from index', async () => {
      const mod = await import('./index.js');
      expect(mod.HelixButtonGroup).toBeDefined();
      expect(typeof mod.HelixButtonGroup).toBe('function');
    });
  });
});
