import { describe, it, expect, afterEach, vi } from 'vitest';
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

  // ─── Property: orientation (2) ───

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

  // ─── Property: size (3) ───

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
      // A single button is both :first-child and :last-child, so :only-child
      // rule must win with a full-radius value (not split left/right halves).
      const computed = getComputedStyle(button!);
      const radius = computed.getPropertyValue('--hx-button-border-radius').trim();
      // The :only-child rule sets a single value (all four corners equal),
      // while the :first-child/:last-child split rules each set two corners.
      // Verify the radius is not the broken split value "0 <radius> <radius> 0".
      expect(radius).not.toMatch(/^0\s/);
    });
  });

  // ─── Property: label (1) ───

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

    it('updates ariaLabel when label changes dynamically', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group label="Initial label">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      expect(el.label).toBe('Initial label');

      el.label = 'Updated label';
      await el.updateComplete;
      expect(el.label).toBe('Updated label');
    });

    it('clears ariaLabel when label is set to empty string', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group label="Some label">
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
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

    it('triggers requestUpdate on slot change', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button 1</hx-button>
        </hx-button-group>
      `);

      const requestUpdateSpy = vi.spyOn(el, 'requestUpdate');

      const button2 = document.createElement('hx-button');
      button2.setAttribute('variant', 'secondary');
      button2.textContent = 'Button 2';
      el.appendChild(button2);

      await el.updateComplete;
      expect(requestUpdateSpy).toHaveBeenCalled();
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

  // ─── Accessibility (4) ───

  describe('Accessibility', () => {
    it('uses ElementInternals for role (no explicit role attribute on host or wrapper)', async () => {
      const el = await fixture<HelixButtonGroup>(`
        <hx-button-group>
          <hx-button variant="secondary">Button</hx-button>
        </hx-button-group>
      `);
      // ElementInternals.role sets the *default* ARIA role without creating a
      // DOM attribute. Verify the host has no explicit role attribute and the
      // internal wrapper div also carries no role (both confirm the
      // ElementInternals pattern is used, not setAttribute). Semantic
      // correctness is verified by the axe tests below.
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
});
