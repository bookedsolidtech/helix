import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { WcContainer } from './hx-container.js';
import './index.js';

afterEach(cleanup);

describe('hx-container', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "inner" CSS part', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      const inner = shadowQuery(el, '[part="inner"]');
      expect(inner).toBeTruthy();
    });

    it('renders .container__inner div', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      const inner = shadowQuery(el, 'div.container__inner');
      expect(inner).toBeTruthy();
    });
  });

  // ─── Property: width (7) ───

  describe('Property: width', () => {
    it('defaults to "content" width class', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      expect(inner.classList.contains('container__inner--content')).toBe(true);
    });

    it('width="full" applies full class', async () => {
      const el = await fixture<WcContainer>('<hx-container width="full">Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      expect(inner.classList.contains('container__inner--full')).toBe(true);
    });

    it('width="narrow" applies narrow class', async () => {
      const el = await fixture<WcContainer>('<hx-container width="narrow">Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      expect(inner.classList.contains('container__inner--narrow')).toBe(true);
    });

    it('width="sm" applies sm class', async () => {
      const el = await fixture<WcContainer>('<hx-container width="sm">Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      expect(inner.classList.contains('container__inner--sm')).toBe(true);
    });

    it('width="md" applies md class', async () => {
      const el = await fixture<WcContainer>('<hx-container width="md">Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      expect(inner.classList.contains('container__inner--md')).toBe(true);
    });

    it('width="lg" applies lg class', async () => {
      const el = await fixture<WcContainer>('<hx-container width="lg">Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      expect(inner.classList.contains('container__inner--lg')).toBe(true);
    });

    it('width="xl" applies xl class', async () => {
      const el = await fixture<WcContainer>('<hx-container width="xl">Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      expect(inner.classList.contains('container__inner--xl')).toBe(true);
    });
  });

  // ─── Property: padding (6) ───

  describe('Property: padding', () => {
    it('defaults to "none" padding attribute', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      expect(el.getAttribute('padding')).toBe('none');
    });

    it('padding="sm" reflected as attribute', async () => {
      const el = await fixture<WcContainer>('<hx-container padding="sm">Content</hx-container>');
      expect(el.getAttribute('padding')).toBe('sm');
    });

    it('padding="md" reflected as attribute', async () => {
      const el = await fixture<WcContainer>('<hx-container padding="md">Content</hx-container>');
      expect(el.getAttribute('padding')).toBe('md');
    });

    it('padding="lg" reflected as attribute', async () => {
      const el = await fixture<WcContainer>('<hx-container padding="lg">Content</hx-container>');
      expect(el.getAttribute('padding')).toBe('lg');
    });

    it('padding="xl" reflected as attribute', async () => {
      const el = await fixture<WcContainer>('<hx-container padding="xl">Content</hx-container>');
      expect(el.getAttribute('padding')).toBe('xl');
    });

    it('padding="2xl" reflected as attribute', async () => {
      const el = await fixture<WcContainer>('<hx-container padding="2xl">Content</hx-container>');
      expect(el.getAttribute('padding')).toBe('2xl');
    });
  });

  // ─── Attribute Reflection (2) ───

  describe('Attribute Reflection', () => {
    it('width attribute reflects to property', async () => {
      const el = await fixture<WcContainer>('<hx-container width="narrow">Content</hx-container>');
      expect(el.width).toBe('narrow');
    });

    it('padding attribute reflects to property', async () => {
      const el = await fixture<WcContainer>('<hx-container padding="lg">Content</hx-container>');
      expect(el.padding).toBe('lg');
    });
  });

  // ─── Slot: default (2) ───

  describe('Slot: default', () => {
    it('slotted content renders', async () => {
      const el = await fixture<WcContainer>('<hx-container><p>Hello World</p></hx-container>');
      const slotted = el.querySelector('p');
      expect(slotted).toBeTruthy();
      expect(slotted?.textContent).toBe('Hello World');
    });

    it('multiple children render', async () => {
      const el = await fixture<WcContainer>(
        '<hx-container><p>First</p><p>Second</p><p>Third</p></hx-container>',
      );
      const children = el.querySelectorAll('p');
      expect(children.length).toBe(3);
    });
  });

  // ─── CSS Parts (1) ───

  describe('CSS Parts', () => {
    it('inner part is exposed on .container__inner', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      const inner = shadowQuery(el, '[part="inner"]');
      expect(inner).toBeTruthy();
      expect(inner?.classList.contains('container__inner')).toBe(true);
    });
  });

  // ─── CSS Custom Properties (3) ───

  describe('CSS Custom Properties', () => {
    it('--hx-container-bg applies background color to :host', async () => {
      const el = await fixture<WcContainer>(
        '<hx-container style="--hx-container-bg: rgb(255, 0, 0);">Content</hx-container>',
      );
      const styles = getComputedStyle(el);
      expect(styles.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('--hx-container-gutter applies horizontal padding on inner', async () => {
      const el = await fixture<WcContainer>(
        '<hx-container style="--hx-container-gutter: 40px;">Content</hx-container>',
      );
      const inner = shadowQuery(el, '.container__inner')!;
      const styles = getComputedStyle(inner);
      expect(styles.paddingLeft).toBe('40px');
      expect(styles.paddingRight).toBe('40px');
    });

    it('--hx-container-max-width overrides max-width on inner', async () => {
      const el = await fixture<WcContainer>(
        '<hx-container style="--hx-container-max-width: 500px;">Content</hx-container>',
      );
      const inner = shadowQuery(el, '.container__inner')!;
      const styles = getComputedStyle(inner);
      expect(styles.maxWidth).toBe('500px');
    });
  });

  // ─── Layout Behavior (3) ───

  describe('Layout Behavior', () => {
    it(':host has display: block', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      const styles = getComputedStyle(el);
      expect(styles.display).toBe('block');
    });

    it('.container__inner has auto horizontal margins for centering', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      const styles = getComputedStyle(inner);
      expect(styles.marginLeft).toBe('0px');
      expect(styles.marginRight).toBe('0px');
    });

    it('width="full" inner has no max-width constraint', async () => {
      const el = await fixture<WcContainer>('<hx-container width="full">Content</hx-container>');
      const inner = shadowQuery(el, '.container__inner')!;
      const styles = getComputedStyle(inner);
      expect(styles.maxWidth).toBe('none');
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with rich content', async () => {
      const el = await fixture<WcContainer>(
        '<hx-container><h2>Section Title</h2><p>Paragraph content here.</p></hx-container>',
      );
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('does not add any ARIA roles (structural element)', async () => {
      const el = await fixture<WcContainer>('<hx-container>Content</hx-container>');
      expect(el.hasAttribute('role')).toBe(false);
      const inner = shadowQuery(el, '.container__inner')!;
      expect(inner.hasAttribute('role')).toBe(false);
    });
  });
});
