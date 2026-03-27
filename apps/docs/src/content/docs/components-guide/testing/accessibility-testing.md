---
title: Accessibility Testing
description: Run automated axe-core audits and assert ARIA attributes, focus management, and keyboard behavior in HELiX tests.
---

Every HELiX component ships with automated accessibility tests. This page documents the full testing strategy: axe-core audits via `checkA11y`, ARIA attribute assertions, focus management tests, and keyboard interaction coverage.

## `checkA11y()` — axe-core Audit

`checkA11y` from HELiX test-utils wraps axe-core and runs a WCAG 2.1 AA audit on the component's shadow root. It returns `violations` and `passes` arrays:

```typescript
import { fixture, checkA11y, cleanup } from '../../test-utils.js';
import { page } from '@vitest/browser/context';

afterEach(cleanup);

it('has no axe violations in default state', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click me</hx-button>');
  await page.screenshot(); // snapshot for debugging on failure
  const { violations } = await checkA11y(el);
  expect(violations).toEqual([]);
});
```

`page.screenshot()` before the audit captures the visual state at test time, making failures much easier to diagnose in CI.

### Multiple Variant Sweep

Loop over all variants to avoid regressions when adding new ones:

```typescript
it('has no axe violations across all variants', async () => {
  const variants = ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline'];
  for (const variant of variants) {
    const el = await fixture<HelixButton>(
      `<hx-button variant="${variant}">Click me</hx-button>`
    );
    await page.screenshot();
    const { violations } = await checkA11y(el);
    expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
    el.remove();
  }
});
```

### `checkA11y` Rule Options

Disable specific rules when you have a documented exception:

```typescript
it('icon-only button with aria-label has no violations', async () => {
  const el = await fixture<HelixButton>(
    '<hx-button aria-label="Close dialog" variant="ghost">' +
    '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    '</hx-button>'
  );
  const { violations } = await checkA11y(el);
  expect(violations).toEqual([]);
});
```

## ARIA Attribute Assertions

Test ARIA attributes that reflect component state:

```typescript
it('sets aria-busy="true" when loading', async () => {
  const el = await fixture<HelixButton>('<hx-button loading>Click</hx-button>');
  const btn = shadowQuery(el, 'button')!;
  expect(btn.getAttribute('aria-busy')).toBe('true');
});

it('sets aria-disabled="true" on anchor when disabled', async () => {
  const el = await fixture<HelixButton>(
    '<hx-button href="https://example.com" disabled>Link</hx-button>'
  );
  const anchor = shadowQuery(el, 'a')!;
  expect(anchor.getAttribute('aria-disabled')).toBe('true');
});

it('does NOT set aria-disabled on native button when disabled', async () => {
  // Native `disabled` attribute is sufficient — aria-disabled would be redundant
  const el = await fixture<HelixButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery(el, 'button')!;
  expect(btn.hasAttribute('aria-disabled')).toBe(false);
});
```

### ARIA Label Delegation

Verify that `aria-label` set on the host is forwarded to the inner interactive element:

```typescript
it('forwards aria-label to inner button', async () => {
  const el = await fixture<HelixButton>('<hx-button aria-label="Close dialog">X</hx-button>');
  const btn = shadowQuery(el, 'button')!;
  expect(btn.getAttribute('aria-label')).toBe('Close dialog');
});

it('forwards aria-label to inner anchor', async () => {
  const el = await fixture<HelixButton>(
    '<hx-button href="https://example.com" aria-label="Visit site">→</hx-button>'
  );
  const anchor = shadowQuery(el, 'a')!;
  expect(anchor.getAttribute('aria-label')).toBe('Visit site');
});
```

This pattern works because HELiX uses the `mixinDelegatesAria` mixin, which forwards aria attributes from the host to the inner element via `ElementInternals`.

## Focus Management Testing

```typescript
it('is focusable', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  el.focus();
  // delegatesFocus sends focus to the inner button
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  expect(document.activeElement === el || btn === el.shadowRoot!.activeElement).toBe(true);
});

it('is not focusable when disabled', async () => {
  const el = await fixture<HelixButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  expect(btn.disabled).toBe(true);
  // Native disabled prevents focus automatically
});
```

## Keyboard Interaction Testing

```typescript
import { userEvent } from '@vitest/browser/context';

it('Enter activates the button', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.focus();
  await userEvent.keyboard('{Enter}');
  const event = await eventPromise;
  expect(event).toBeTruthy();
});

it('Space activates the button', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.focus();
  await userEvent.keyboard(' ');
  const event = await eventPromise;
  expect(event).toBeTruthy();
});

it('Escape closes dialog', async () => {
  const el = await fixture<HelixDialog>('<hx-dialog open>Content</hx-dialog>');
  await userEvent.keyboard('{Escape}');
  await el.updateComplete;
  expect(el.open).toBe(false);
});
```

## Role Attribute Assertions

```typescript
it('exposes role="switch" on toggle', async () => {
  const el = await fixture<HelixSwitch>('<hx-switch></hx-switch>');
  const toggle = shadowQuery(el, '[role="switch"]');
  expect(toggle).toBeTruthy();
});

it('exposes role="dialog" on dialog', async () => {
  const el = await fixture<HelixDialog>('<hx-dialog open>Content</hx-dialog>');
  const dialog = shadowQuery(el, '[role="dialog"]');
  expect(dialog).toBeTruthy();
});
```

## Screen Reader Considerations

axe-core does not simulate screen reader output, but it catches the most common markup errors. For comprehensive testing:

- Ensure every interactive element has a computable accessible name (`aria-label`, `aria-labelledby`, visible text, or `title`).
- Test that dynamic regions use `aria-live` correctly (see [Screen Reader Support](/components-guide/accessibility/screen-readers/)).
- Manually verify with VoiceOver (macOS) and NVDA (Windows) for complex widgets like `hx-combobox`, `hx-dialog`, and `hx-menu`.

## Next Steps

- [WCAG Compliance](/components-guide/accessibility/wcag/) — the AA requirements HELiX targets
- [ARIA in Web Components](/components-guide/accessibility/aria/) — roles, properties, and state
- [Focus Management](/components-guide/accessibility/focus-management/) — `delegatesFocus` and focus traps
- [Component Fixtures and Test Utilities](/components-guide/testing/component-fixtures/) — full utility API reference
