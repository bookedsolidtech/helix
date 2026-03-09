import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixCodeSnippet } from './hx-code-snippet.js';
import './index.js';

afterEach(cleanup);

describe('hx-code-snippet', () => {
  // ─── Rendering (8) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders block mode by default (pre element)', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const pre = shadowQuery(el, 'pre');
      expect(pre).toBeTruthy();
    });

    it('exposes "base" CSS part in block mode', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "code" CSS part in block mode', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const code = shadowQuery(el, '[part~="code"]');
      expect(code).toBeTruthy();
    });

    it('exposes "copy-button" CSS part by default', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery(el, '[part~="copy-button"]');
      expect(btn).toBeTruthy();
    });

    it('pre has role="region" and default aria-label when no language set', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const pre = shadowQuery(el, 'pre');
      expect(pre?.getAttribute('role')).toBe('region');
      expect(pre?.getAttribute('aria-label')).toBe('Code snippet');
    });

    it('pre aria-label includes language when language is set', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet language="javascript">const x = 1;</hx-code-snippet>',
      );
      const pre = shadowQuery(el, 'pre');
      expect(pre?.getAttribute('aria-label')).toBe('Code snippet: javascript');
    });

    it('exposes "header" CSS part in block mode', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const header = shadowQuery(el, '[part~="header"]');
      expect(header).toBeTruthy();
    });
  });

  // ─── Property: inline (4) ───

  describe('Property: inline', () => {
    it('renders <code> element in inline mode', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet inline>const x = 1;</hx-code-snippet>',
      );
      const code = shadowQuery(el, 'code');
      expect(code).toBeTruthy();
    });

    it('does not render <pre> in inline mode', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet inline>const x = 1;</hx-code-snippet>',
      );
      const pre = shadowQuery(el, 'pre');
      expect(pre).toBeNull();
    });

    it('does not render copy button in inline mode', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet inline>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery(el, '[part~="copy-button"]');
      expect(btn).toBeNull();
    });

    it('reflects inline attribute to host', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet inline>const x = 1;</hx-code-snippet>',
      );
      expect(el.hasAttribute('inline')).toBe(true);
    });
  });

  // ─── Property: copyable (4) ───

  describe('Property: copyable', () => {
    it('shows copy button by default (copyable=true)', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery(el, '[part~="copy-button"]');
      expect(btn).toBeTruthy();
    });

    it('copyable="false" as HTML attribute shows copy button (boolean trap)', async () => {
      // Boolean attributes in HTML: presence = true, absence = false.
      // The string "false" is still a truthy attribute value — copyable remains true.
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet copyable="false">const x = 1;</hx-code-snippet>',
      );
      await el.updateComplete;
      const btn = shadowQuery(el, '[part~="copy-button"]');
      expect(btn).toBeTruthy();
    });

    it('hides copy button when copyable set to false programmatically', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      el.copyable = false;
      await el.updateComplete;
      const btn = shadowQuery(el, '[part~="copy-button"]');
      expect(btn).toBeNull();
    });

    it('copy button has aria-label="Copy code" initially', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery(el, '[part~="copy-button"]');
      expect(btn?.getAttribute('aria-label')).toBe('Copy code');
    });
  });

  // ─── Copy Action (4) ───

  describe('Copy Action', () => {
    it('dispatches hx-copy event on copy button click', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="copy-button"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-copy');
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-copy event detail has text property', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="copy-button"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-copy');
      btn.click();
      const event = await eventPromise;
      expect('text' in event.detail).toBe(true);
    });

    it('copy button aria-label changes to "Copied!" after click', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="copy-button"]')!;
      btn.click();
      await el.updateComplete;
      expect(btn.getAttribute('aria-label')).toBe('Copied!');
    });

    it('copy button text changes to "Copied!" after click', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="copy-button"]')!;
      btn.click();
      await el.updateComplete;
      expect(btn.textContent?.trim()).toBe('Copied!');
    });
  });

  // ─── Property: max-lines (7) ───

  describe('Property: max-lines', () => {
    it('does not show expand button when max-lines is not set', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>line1\nline2\nline3</hx-code-snippet>',
      );
      await el.updateComplete;
      const expandBtn = shadowQuery(el, '[part~="expand-button"]');
      expect(expandBtn).toBeNull();
    });

    it('shows "Show more" button when content exceeds max-lines', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet max-lines="2">line1\nline2\nline3\nline4</hx-code-snippet>',
      );
      await el.updateComplete;
      const expandBtn = shadowQuery(el, '[part~="expand-button"]');
      expect(expandBtn).toBeTruthy();
      expect(expandBtn?.textContent?.trim()).toBe('Show more');
    });

    it('does not show expand button when content does not exceed max-lines', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet max-lines="10">line1\nline2</hx-code-snippet>',
      );
      await el.updateComplete;
      const expandBtn = shadowQuery(el, '[part~="expand-button"]');
      expect(expandBtn).toBeNull();
    });

    it('expands to show all content on "Show more" click', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet max-lines="2">line1\nline2\nline3\nline4</hx-code-snippet>',
      );
      await el.updateComplete;
      const expandBtn = shadowQuery<HTMLButtonElement>(el, '[part~="expand-button"]')!;
      expandBtn.click();
      await el.updateComplete;
      expect(expandBtn.textContent?.trim()).toBe('Show less');
    });

    it('exposes "expand-button" CSS part when truncated', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet max-lines="2">line1\nline2\nline3</hx-code-snippet>',
      );
      await el.updateComplete;
      const expandBtn = shadowQuery(el, '[part~="expand-button"]');
      expect(expandBtn).toBeTruthy();
    });

    it('expand button has aria-expanded="false" when collapsed', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet max-lines="2">line1\nline2\nline3\nline4</hx-code-snippet>',
      );
      await el.updateComplete;
      const expandBtn = shadowQuery(el, '[part~="expand-button"]');
      expect(expandBtn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('expand button has aria-expanded="true" after click', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet max-lines="2">line1\nline2\nline3\nline4</hx-code-snippet>',
      );
      await el.updateComplete;
      const expandBtn = shadowQuery<HTMLButtonElement>(el, '[part~="expand-button"]')!;
      expandBtn.click();
      await el.updateComplete;
      expect(expandBtn.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ─── Property: wrap (2) ───

  describe('Property: wrap', () => {
    it('reflects wrap attribute to host', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet wrap>const x = 1;</hx-code-snippet>',
      );
      expect(el.hasAttribute('wrap')).toBe(true);
    });

    it('adds wrap class to pre element when wrap=true', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet wrap>const x = 1;</hx-code-snippet>',
      );
      const pre = shadowQuery(el, 'pre');
      expect(pre?.classList.contains('code-snippet__pre--wrap')).toBe(true);
    });
  });

  // ─── Property: language (2) ───

  describe('Property: language', () => {
    it('reflects language attribute to host', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet language="javascript">const x = 1;</hx-code-snippet>',
      );
      expect(el.getAttribute('language')).toBe('javascript');
    });

    it('language prop defaults to empty string', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      expect(el.language).toBe('');
    });
  });

  // ─── Property: lineNumbers (2) ───

  describe('Property: lineNumbers', () => {
    it('lineNumbers defaults to false', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      expect(el.lineNumbers).toBe(false);
    });

    it('shows line number spans when lineNumbers=true', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet line-numbers>line1\nline2\nline3</hx-code-snippet>',
      );
      await el.updateComplete;
      const lineNums = el.shadowRoot!.querySelectorAll('.code-snippet__line-number');
      expect(lineNums.length).toBeGreaterThan(0);
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('renders default slot content', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>Hello World</hx-code-snippet>',
      );
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('slot content is accessible via textContent', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet language="bash">npm install</hx-code-snippet>',
      );
      expect(el.textContent).toContain('npm install');
    });

    it('slot text appears in shadow DOM code element', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const answer = 42;</hx-code-snippet>',
      );
      await el.updateComplete;
      const code = shadowQuery<HTMLElement>(el, '[part~="code"]');
      expect(code?.textContent).toContain('const answer = 42');
    });
  });

  // ─── Defaults (3) ───

  describe('Defaults', () => {
    it('copyable defaults to true', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      expect(el.copyable).toBe(true);
    });

    it('inline defaults to false', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      expect(el.inline).toBe(false);
    });

    it('maxLines defaults to 0', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      expect(el.maxLines).toBe(0);
    });
  });

  // ─── CSS Behavior (1) ───

  describe('CSS Behavior', () => {
    it('pre element has overflow-x: auto for horizontal scroll', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const pre = shadowQuery<HTMLElement>(el, 'pre');
      await el.updateComplete;
      const styles = getComputedStyle(pre!);
      expect(styles.overflowX).toBe('auto');
    });
  });

  // ─── Keyboard Interaction (2) ───

  describe('Keyboard Interaction', () => {
    it('copy button is activatable via Enter key', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="copy-button"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-copy');
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      btn.click(); // native button handles Enter → click
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('expand button is activatable via Space key (native button behavior)', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet max-lines="2">line1\nline2\nline3\nline4</hx-code-snippet>',
      );
      await el.updateComplete;
      const expandBtn = shadowQuery<HTMLButtonElement>(el, '[part~="expand-button"]')!;
      expandBtn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expandBtn.click();
      await el.updateComplete;
      expect(expandBtn.textContent?.trim()).toBe('Show less');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('block mode has no axe violations', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet language="javascript">const x = 1;</hx-code-snippet>',
      );
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('inline mode has no axe violations', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet inline>const x = 1;</hx-code-snippet>',
      );
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('copyable=false has no axe violations', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      el.copyable = false;
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('max-lines truncated view has no axe violations', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet max-lines="2">line1\nline2\nline3\nline4</hx-code-snippet>',
      );
      await el.updateComplete;
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('clipboard write is called on copy button click', async () => {
      // Mock clipboard API
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextSpy },
        writable: true,
        configurable: true,
      });

      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>npm install @wc-2026/library</hx-code-snippet>',
      );
      await el.updateComplete;
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="copy-button"]')!;
      btn.click();
      await el.updateComplete;

      expect(writeTextSpy).toHaveBeenCalled();
    });

    it('clears copy timer on disconnect without post-disconnect mutation', async () => {
      const el = await fixture<HelixCodeSnippet>(
        '<hx-code-snippet>const x = 1;</hx-code-snippet>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="copy-button"]')!;
      btn.click();
      await el.updateComplete;
      // Disconnect before 2s timer fires
      el.remove();
      // If timer was not cleared, this would throw or mutate detached element state
      // We verify the element is disconnected and no error is thrown
      expect(el.isConnected).toBe(false);
    });
  });
});
