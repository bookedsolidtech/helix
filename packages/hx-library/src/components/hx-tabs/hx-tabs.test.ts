import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup } from '../../test-utils.js';
import type { HelixTabs } from './hx-tabs.js';
import type { HelixTab } from './hx-tab.js';
import type { HelixTabPanel } from './hx-tab-panel.js';
import './index.js';

afterEach(cleanup);

// ─── Test Helpers ──────────────────────────────────────────────────────────────

/** Asserts an element is non-null and returns it typed, avoiding non-null assertions. */
function assertEl<T extends Element>(el: T | null | undefined, label: string): T {
  if (!el) throw new Error(`Expected element "${label}" to exist in DOM`);
  return el;
}

// ─── Fixture Helpers ───────────────────────────────────────────────────────────

const DEFAULT_TABS_HTML = `
  <hx-tabs>
    <hx-tab slot="tab" panel="alpha">Alpha</hx-tab>
    <hx-tab slot="tab" panel="beta">Beta</hx-tab>
    <hx-tab slot="tab" panel="gamma">Gamma</hx-tab>
    <hx-tab-panel name="alpha">Alpha content</hx-tab-panel>
    <hx-tab-panel name="beta">Beta content</hx-tab-panel>
    <hx-tab-panel name="gamma">Gamma content</hx-tab-panel>
  </hx-tabs>
`;

const TWO_TABS_HTML = `
  <hx-tabs>
    <hx-tab slot="tab" panel="one">One</hx-tab>
    <hx-tab slot="tab" panel="two">Two</hx-tab>
    <hx-tab-panel name="one">Panel One</hx-tab-panel>
    <hx-tab-panel name="two">Panel Two</hx-tab-panel>
  </hx-tabs>
`;

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('hx-tabs', () => {
  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a tablist with role="tablist"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tablist = shadowQuery(el, '[role="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('renders tablist with part="tablist"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tablist = shadowQuery(el, '[part="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('renders panels container with part="panels"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panels = shadowQuery(el, '[part="panels"]');
      expect(panels).toBeTruthy();
    });

    it('light-DOM hx-tab children have role="tab" via shadow button', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      for (const tab of tabs) {
        const btn = shadowQuery<HTMLButtonElement>(tab, 'button[role="tab"]');
        expect(btn).toBeTruthy();
      }
    });

    it('hx-tab-panel children have role="tabpanel"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panelEls = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      for (const panel of panelEls) {
        expect(panel.getAttribute('role')).toBe('tabpanel');
      }
    });

    it('first tab is selected by default', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
      expect(tabs[2].selected).toBe(false);
    });

    it('first panel is visible, others are hidden', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panelEls = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panelEls[0].hasAttribute('hidden')).toBe(false);
      expect(panelEls[1].hasAttribute('hidden')).toBe(true);
      expect(panelEls[2].hasAttribute('hidden')).toBe(true);
    });

    it('hx-tab exposes "tab" CSS part', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tab = el.querySelector('hx-tab') as HelixTab;
      const part = shadowQuery(tab, '[part="tab"]');
      expect(part).toBeTruthy();
    });

    it('hx-tab-panel exposes "panel" CSS part', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panel = el.querySelector('hx-tab-panel') as HelixTabPanel;
      const part = shadowQuery(panel, '[part="panel"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Tab Selection ────────────────────────────────────────────────────────────

  describe('Tab Selection', () => {
    it('clicking a tab activates it (aria-selected="true")', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnBeta = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnBeta, 'button').click();
      await el.updateComplete;
      const btnBetaAfter = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      expect(btnBetaAfter?.getAttribute('aria-selected')).toBe('true');
    });

    it('clicking a tab shows its panel', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      const btnBeta = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnBeta, 'button').click();
      await el.updateComplete;
      expect(panels[1].hasAttribute('hidden')).toBe(false);
    });

    it('clicking a tab hides all other panels', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      const btnBeta = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnBeta, 'button').click();
      await el.updateComplete;
      expect(panels[0].hasAttribute('hidden')).toBe(true);
      expect(panels[2].hasAttribute('hidden')).toBe(true);
    });

    it('dispatches hx-tab-change when tab is clicked', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tab-change');
      const btnBeta = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnBeta, 'button').click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-tab-change event bubbles and is composed', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tab-change');
      const btnBeta = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnBeta, 'button').click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-tab-change detail contains correct index', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent<{ tabId: string; index: number }>>(
        el,
        'hx-tab-change',
      );
      const btnBeta = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnBeta, 'button').click();
      const event = await eventPromise;
      expect(event.detail.index).toBe(1);
    });

    it('hx-tab-change detail contains the tab id', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent<{ tabId: string; index: number }>>(
        el,
        'hx-tab-change',
      );
      const btnGamma = shadowQuery<HTMLButtonElement>(tabs[2], 'button');
      assertEl(btnGamma, 'button').click();
      const event = await eventPromise;
      expect(event.detail.tabId).toBe(tabs[2].id);
    });

    it('does not dispatch hx-tab-change when clicking the already-active tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      let eventFired = false;
      el.addEventListener('hx-tab-change', () => {
        eventFired = true;
      });
      const btnAlpha = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnAlpha, 'button').click();
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });
  });

  // ─── Keyboard Navigation — Horizontal / Automatic (default) ──────────────────

  describe('Keyboard Navigation — Horizontal Automatic (default)', () => {
    it('ArrowRight moves focus to the next tab and activates it', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnAlpha = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnAlpha, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(tabs[1].selected).toBe(true);
    });

    it('ArrowLeft moves focus to the previous tab and activates it', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      // First activate beta so focus is on it
      const btnBeta = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnBeta, 'button').click();
      await el.updateComplete;
      assertEl(btnBeta, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(tabs[0].selected).toBe(true);
    });

    it('Home key moves focus to the first tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      // Activate last tab first
      const btnGamma = shadowQuery<HTMLButtonElement>(tabs[2], 'button');
      assertEl(btnGamma, 'button').click();
      await el.updateComplete;
      assertEl(btnGamma, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      expect(tabs[0].selected).toBe(true);
    });

    it('End key moves focus to the last tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnAlpha = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnAlpha, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      expect(tabs[2].selected).toBe(true);
    });

    it('ArrowRight wraps from last tab to first tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnGamma = shadowQuery<HTMLButtonElement>(tabs[2], 'button');
      assertEl(btnGamma, 'button').click();
      await el.updateComplete;
      assertEl(btnGamma, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(tabs[0].selected).toBe(true);
    });

    it('ArrowLeft wraps from first tab to last tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnAlpha = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnAlpha, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(tabs[2].selected).toBe(true);
    });
  });

  // ─── Keyboard Navigation — Manual Activation ─────────────────────────────────

  describe('Keyboard Navigation — Manual Activation', () => {
    it('ArrowRight moves focus but does NOT activate the tab', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnOne = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnOne, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // Tab 0 should still be selected since activation is manual
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
    });

    it('Space key activates focused tab in manual mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      // Navigate to tab two with ArrowRight (no activation)
      const btnOne = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnOne, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // Now the button for tab two should be focused — press Space
      const btnTwo = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnTwo, 'button').focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tab-change');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      await el.updateComplete;
      expect(event).toBeTruthy();
      expect(tabs[1].selected).toBe(true);
    });

    it('Enter key activates focused tab in manual mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnTwo = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnTwo, 'button').focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tab-change');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      await el.updateComplete;
      expect(event).toBeTruthy();
      expect(tabs[1].selected).toBe(true);
    });
  });

  // ─── Keyboard Navigation — Vertical Orientation ───────────────────────────────

  describe('Keyboard Navigation — Vertical Orientation', () => {
    it('ArrowDown navigates to the next tab in vertical mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnOne = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnOne, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(tabs[1].selected).toBe(true);
    });

    it('ArrowUp navigates to the previous tab in vertical mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnTwo = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnTwo, 'button').click();
      await el.updateComplete;
      assertEl(btnTwo, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(tabs[0].selected).toBe(true);
    });

    it('ArrowLeft does NOT navigate in vertical mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnTwo = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnTwo, 'button').click();
      await el.updateComplete;
      assertEl(btnTwo, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      // Tab two should still be active because ArrowLeft does not apply in vertical
      expect(tabs[1].selected).toBe(true);
    });

    it('ArrowRight does NOT navigate in vertical mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnOne = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnOne, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // Tab one should still be active because ArrowRight does not apply in vertical
      expect(tabs[0].selected).toBe(true);
    });
  });

  // ─── Disabled Tabs ────────────────────────────────────────────────────────────

  describe('Disabled Tabs', () => {
    it('disabled tab cannot be activated by clicking', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      let eventFired = false;
      el.addEventListener('hx-tab-change', () => {
        eventFired = true;
      });
      const btnTwo = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnTwo, 'button').click();
      await el.updateComplete;
      expect(eventFired).toBe(false);
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
    });

    it('disabled tab is skipped during ArrowRight keyboard navigation', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnOne = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      assertEl(btnOne, 'button').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // tab two is disabled so focus/activation jumps to tab three
      expect(tabs[2].selected).toBe(true);
    });

    it('disabled tab reflects disabled attribute', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one" disabled>One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].disabled).toBe(true);
      expect(tabs[0].hasAttribute('disabled')).toBe(true);
    });

    it('first enabled tab is activated by default when first tab is disabled', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one" disabled>One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].selected).toBe(false);
      expect(tabs[1].selected).toBe(true);
    });
  });

  // ─── ARIA ─────────────────────────────────────────────────────────────────────

  describe('ARIA', () => {
    it('tablist has aria-orientation="horizontal" by default', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tablist = shadowQuery(el, '[role="tablist"]');
      expect(tablist?.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('tablist has aria-orientation="vertical" when orientation is vertical', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      const tablist = shadowQuery(el, '[role="tablist"]');
      expect(tablist?.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('tab button has aria-selected="true" when selected', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btn = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      expect(btn?.getAttribute('aria-selected')).toBe('true');
    });

    it('tab button has aria-selected="false" when not selected', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btn = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      expect(btn?.getAttribute('aria-selected')).toBe('false');
    });

    it('tab button has aria-controls referencing its panel id', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      // aria-controls belongs on the button (role="tab"), not the host element
      const btn = shadowQuery<HTMLButtonElement>(tabs[0], 'button');
      const controlsAttr = btn?.getAttribute('aria-controls');
      expect(controlsAttr).toBeTruthy();
      expect(controlsAttr).toBe(panels[0].id);
    });

    it('panel has aria-labelledby referencing its tab id', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      const labelledBy = panels[0].getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(labelledBy).toBe(tabs[0].id);
    });

    it('panel has tabindex="0" for keyboard accessibility', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panels[0].getAttribute('tabindex')).toBe('0');
    });

    it('active tab has tabindex=0, inactive tabs have tabindex=-1', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].tabIndex).toBe(0);
      expect(tabs[1].tabIndex).toBe(-1);
      expect(tabs[2].tabIndex).toBe(-1);
    });

    it('tabindex updates on tabs when selection changes', async () => {
      const el = await fixture<HelixTabs>(TWO_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnTwo = shadowQuery<HTMLButtonElement>(tabs[1], 'button');
      assertEl(btnTwo, 'button').click();
      await el.updateComplete;
      expect(tabs[0].tabIndex).toBe(-1);
      expect(tabs[1].tabIndex).toBe(0);
    });
  });

  // ─── Properties ───────────────────────────────────────────────────────────────

  describe('Properties', () => {
    it('orientation defaults to "horizontal"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(el.orientation).toBe('horizontal');
    });

    it('orientation="vertical" is reflected as attribute', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('activation defaults to "automatic"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(el.activation).toBe('automatic');
    });

    it('activation="manual" is settable via attribute', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(el.activation).toBe('manual');
    });

    it('hx-tab selected property reflects as attribute', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].hasAttribute('selected')).toBe(true);
      expect(tabs[1].hasAttribute('selected')).toBe(false);
    });

    it('hx-tab panel property reflects as attribute', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].getAttribute('panel')).toBe('alpha');
      expect(tabs[1].getAttribute('panel')).toBe('beta');
    });

    it('hx-tab-panel name property reflects as attribute', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panels[0].getAttribute('name')).toBe('alpha');
      expect(panels[1].getAttribute('name')).toBe('beta');
    });
  });

  // ─── Dynamic Tab Add / Remove ─────────────────────────────────────────────────

  describe('Dynamic Tab Add / Remove', () => {
    it('adding a new tab and panel updates the tab list', async () => {
      const el = await fixture<HelixTabs>(TWO_TABS_HTML);
      const newTab = document.createElement('hx-tab') as HelixTab;
      newTab.setAttribute('slot', 'tab');
      newTab.setAttribute('panel', 'three');
      newTab.textContent = 'Three';
      const newPanel = document.createElement('hx-tab-panel') as HelixTabPanel;
      newPanel.setAttribute('name', 'three');
      newPanel.textContent = 'Panel Three';
      el.appendChild(newTab);
      el.appendChild(newPanel);
      // Wait for slot change to propagate
      await el.updateComplete;
      // Yield to event loop to allow slotchange/DOM mutation callbacks to run after tab insertion
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs).toHaveLength(3);
    });

    it('newly added tab can be clicked and activates its panel', async () => {
      const el = await fixture<HelixTabs>(TWO_TABS_HTML);
      const newTab = document.createElement('hx-tab') as HelixTab;
      newTab.setAttribute('slot', 'tab');
      newTab.setAttribute('panel', 'three');
      newTab.textContent = 'Three';
      const newPanel = document.createElement('hx-tab-panel') as HelixTabPanel;
      newPanel.setAttribute('name', 'three');
      newPanel.textContent = 'Panel Three';
      el.appendChild(newTab);
      el.appendChild(newPanel);
      await el.updateComplete;
      // Yield to event loop to allow slotchange/DOM mutation callbacks to run after tab insertion
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btn = shadowQuery<HTMLButtonElement>(tabs[2], 'button');
      assertEl(btn, 'button').click();
      await el.updateComplete;
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panels[2].hasAttribute('hidden')).toBe(false);
    });

    it('removing a tab updates the tab list', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      el.removeChild(tabs[2]);
      await el.updateComplete;
      // Yield to event loop to allow slotchange/DOM mutation callbacks to run after tab removal
      await new Promise((r) => setTimeout(r, 0));
      await el.updateComplete;
      const remainingTabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(remainingTabs).toHaveLength(2);
    });
  });

  // ─── Slots ────────────────────────────────────────────────────────────────────

  describe('Slots', () => {
    it('tab default slot renders label text content', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tab = el.querySelector('hx-tab') as HelixTab;
      expect(tab.textContent?.trim()).toBe('Alpha');
    });

    it('tab-panel default slot renders panel content', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panel = el.querySelector('hx-tab-panel') as HelixTabPanel;
      expect(panel.textContent?.trim()).toBe('Alpha content');
    });

    it('tab prefix slot is hidden when empty', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tab = el.querySelector('hx-tab') as HelixTab;
      const prefixSpan = shadowQuery(tab, '[part="prefix"]');
      expect(prefixSpan?.hasAttribute('hidden')).toBe(true);
    });

    it('tab suffix slot is hidden when empty', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tab = el.querySelector('hx-tab') as HelixTab;
      const suffixSpan = shadowQuery(tab, '[part="suffix"]');
      expect(suffixSpan?.hasAttribute('hidden')).toBe(true);
    });
  });
});
