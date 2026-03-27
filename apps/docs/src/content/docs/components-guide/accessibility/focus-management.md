---
title: Focus Management
description: Delegate focus through shadow DOM, implement focus traps in dialogs, and restore focus correctly when overlays close.
---

Focus management is one of the most complex accessibility requirements for web component-based design systems. Shadow DOM boundaries, dialog patterns, and programmatic navigation all require careful handling.

## `delegatesFocus` — Routing Focus Through Shadow DOM

When `delegatesFocus: true` is set on a shadow root, clicking or programmatically focusing the host element transfers focus to the first focusable element inside the shadow root:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  override createRenderRoot() {
    return this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  override render() {
    return html`<input type="text" />`;
  }
}
```

With `delegatesFocus`:
- `el.focus()` focuses the inner `<input>` automatically.
- Clicking anywhere on the custom element focuses the inner `<input>`.
- `:focus` pseudo-class on the host applies when the inner element is focused.
- No `tabindex` is needed on the host.

This is the pattern used by all HELiX form controls: `hx-text-input`, `hx-checkbox`, `hx-radio`, `hx-select`, `hx-switch`, and `hx-button`.

## `focus()` and `blur()` Delegation

For components that manage focus programmatically (dialogs, tooltips), delegate `focus()` to the inner element:

```typescript
@customElement('hx-dialog')
export class HelixDialog extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  // Focus the first focusable element when the dialog opens
  protected override updated(changed: PropertyValues) {
    if (changed.has('open') && this.open) {
      this._focusFirstElement();
    }
  }

  private _focusFirstElement() {
    const focusable = this.shadowRoot!.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }
}
```

## `firstUpdated()` for Initial Focus

Use `firstUpdated()` to set focus after the component's first render — for example, when a dialog opens immediately on page load:

```typescript
protected override firstUpdated() {
  if (this.open) {
    this._focusFirstElement();
  }
}
```

## Focus Trap in Dialogs

A focus trap ensures keyboard users cannot move focus outside a dialog while it is open. Implement it by intercepting Tab and Shift+Tab and cycling through the dialog's focusable elements:

```typescript
private _getFocusableElements(): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  return Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>(selector));
}

private _handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    this.open = false;
    return;
  }

  if (e.key !== 'Tab') return;

  const focusable = this._getFocusableElements();
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = this.shadowRoot!.activeElement as HTMLElement;

  if (e.shiftKey) {
    // Shift+Tab: wrap from first to last
    if (active === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    // Tab: wrap from last to first
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
```

Connect this handler to the dialog's shadow root:

```typescript
override render() {
  return html`
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="title"
      @keydown=${this._handleKeydown}
    >
      <slot></slot>
    </div>
  `;
}
```

## Returning Focus After Dialog Close

When a dialog closes, return focus to the element that triggered it. Store a reference to the trigger before opening:

```typescript
private _triggerElement: HTMLElement | null = null;

// Called by the trigger (e.g., a button click)
public open(trigger: HTMLElement) {
  this._triggerElement = trigger;
  this._open = true;
  this.requestUpdate();
}

// Called when dialog closes
private _handleClose() {
  this._open = false;
  this.requestUpdate();
  // Return focus to the trigger
  Promise.resolve().then(() => {
    this._triggerElement?.focus();
    this._triggerElement = null;
  });
}
```

The `Promise.resolve().then()` defers focus restoration to after the DOM update, avoiding race conditions with Lit's microtask rendering cycle.

## `FocusMixin` Pattern

HELiX exposes focus-related functionality via mixins so it can be composed onto any component:

```typescript
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

// Mixin provides: _focusFirstElement(), _trapFocus(), _returnFocus()
const FocusMixin = (Base: typeof LitElement) =>
  class extends Base {
    protected _focusFirstElement() { /* ... */ }
    protected _trapFocus(e: KeyboardEvent) { /* ... */ }
    protected _returnFocusTo: HTMLElement | null = null;
  };

@customElement('hx-drawer')
export class HelixDrawer extends FocusMixin(LitElement) {
  // inherits focus management methods
}
```

## Testing Focus Management

```typescript
import { userEvent } from '@vitest/browser/context';

it('focuses first interactive element when dialog opens', async () => {
  const el = await fixture<HelixDialog>(
    '<hx-dialog open><hx-button>Close</hx-button></hx-dialog>'
  );
  await el.updateComplete;
  const btn = el.querySelector('hx-button') as HelixButton;
  // With delegatesFocus, shadowRoot.activeElement points to inner button
  expect(document.activeElement === el || el.contains(document.activeElement)).toBe(true);
});

it('returns focus to trigger on close', async () => {
  const trigger = await fixture<HelixButton>('<hx-button id="trigger">Open</hx-button>');
  const dialog = await fixture<HelixDialog>('<hx-dialog>Content</hx-dialog>');

  dialog.open = true;
  await dialog.updateComplete;

  await userEvent.keyboard('{Escape}');
  await dialog.updateComplete;

  expect(dialog.open).toBe(false);
});
```

## Next Steps

- [Keyboard Navigation](/components-guide/accessibility/keyboard/) — tab order, roving tabindex, and key bindings
- [ARIA in Web Components](/components-guide/accessibility/aria/) — `aria-modal`, `aria-labelledby` for dialogs
- [Screen Reader Support](/components-guide/accessibility/screen-readers/) — how AT handles focus movement
