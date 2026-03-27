---
title: Keyboard Navigation
description: Implement correct tabindex values, arrow key navigation, and keyboard activation patterns in HELiX web components.
---

Keyboard accessibility means every action achievable with a mouse must also be achievable with a keyboard alone. This page covers the standard patterns used throughout HELiX components.

## `tabindex` on Custom Elements

By default, a custom element is not keyboard-focusable. To add it to the tab order:

```typescript
// Make the host element focusable
static override properties = {
  // ...
};

override connectedCallback() {
  super.connectedCallback();
  if (!this.hasAttribute('tabindex')) {
    this.setAttribute('tabindex', '0');
  }
}
```

Use `tabindex="0"` to place an element in the natural tab order (relative to its position in the DOM). Use `tabindex="-1"` to allow programmatic focus without adding the element to the tab order:

```typescript
// Programmatically focusable but not in tab sequence
this.setAttribute('tabindex', '-1');
this.focus(); // works — element receives focus
// user pressing Tab will skip this element
```

### Delegating Focus Inside Shadow DOM

When a custom element wraps a native focusable element (like `<button>` or `<input>`), attach the shadow root with `delegatesFocus: true`. This transfers focus from the host to the inner element automatically:

```typescript
// In the constructor
override createRenderRoot() {
  return this.attachShadow({ mode: 'open', delegatesFocus: true });
}
```

With `delegatesFocus`, you do not need `tabindex` on the host — the inner `<button>` or `<input>` handles it. This is the pattern used by `hx-button`, `hx-text-input`, `hx-checkbox`, and all other HELiX form controls.

## Standard Key Bindings by Widget Type

### Buttons and Links

| Key | Action |
|---|---|
| `Enter` | Activate |
| `Space` | Activate (button only; links use Enter) |
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |

### Checkboxes and Switches

| Key | Action |
|---|---|
| `Space` | Toggle checked state |

### Radio Groups

| Key | Action |
|---|---|
| `Arrow Up` / `Arrow Left` | Select previous option |
| `Arrow Down` / `Arrow Right` | Select next option |
| `Tab` | Move focus to next widget (not next radio) |

### Menus and Dropdowns

| Key | Action |
|---|---|
| `Enter` / `Space` | Open menu; activate focused item |
| `Arrow Down` | Open menu; move to next item |
| `Arrow Up` | Move to previous item |
| `Escape` | Close menu; return focus to trigger |
| `Home` | Move to first item |
| `End` | Move to last item |

### Dialogs and Drawers

| Key | Action |
|---|---|
| `Escape` | Close dialog; return focus to trigger |
| `Tab` | Move forward through focusable elements (trapped inside dialog) |
| `Shift+Tab` | Move backward through focusable elements (trapped inside dialog) |

## `keydown` Handler Pattern in Lit

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-menu-item')
export class HelixMenuItem extends LitElement {
  @property({ type: Boolean, reflect: true })
  disabled = false;

  override render() {
    return html`
      <li
        role="menuitem"
        tabindex=${this.disabled ? '-1' : '0'}
        aria-disabled=${this.disabled ? 'true' : nothing}
        @keydown=${this._handleKeydown}
        @click=${this._handleClick}
      >
        <slot></slot>
      </li>
    `;
  }

  private _handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._activate();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this._focusNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._focusPrev();
        break;
      case 'Escape':
        this.dispatchEvent(new CustomEvent('hx-close', { bubbles: true, composed: true }));
        break;
    }
  }

  private _handleClick() {
    if (!this.disabled) this._activate();
  }

  private _activate() {
    this.dispatchEvent(new CustomEvent('hx-select', { bubbles: true, composed: true }));
  }

  private _focusNext() { /* implementation */ }
  private _focusPrev() { /* implementation */ }
}
```

### `e.preventDefault()` on Arrow Keys

Always call `e.preventDefault()` when handling arrow keys inside a composite widget (menu, listbox, tabs). Without it, the browser will also scroll the page or move the caret, which is unexpected behavior for widget navigation.

## Testing Keyboard Behavior

Use `userEvent.keyboard()` from `@vitest/browser/context` to simulate key presses in tests:

```typescript
import { userEvent } from '@vitest/browser/context';

it('Enter activates the button', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent(el, 'hx-click');
  btn.focus();
  await userEvent.keyboard('{Enter}');
  const event = await eventPromise;
  expect(event).toBeTruthy();
});

it('Escape closes the dialog', async () => {
  const el = await fixture<HelixDialog>('<hx-dialog open>Content</hx-dialog>');
  await userEvent.keyboard('{Escape}');
  await el.updateComplete;
  expect(el.open).toBe(false);
});
```

## Roving `tabindex` for Composite Widgets

For widgets like toolbars, radio groups, and tab lists, use the roving `tabindex` technique. Only one item in the group is in the tab order at a time:

```typescript
private _items: HelixTab[] = [];
private _activeIndex = 0;

private _updateTabindices() {
  this._items.forEach((item, i) => {
    item.setAttribute('tabindex', i === this._activeIndex ? '0' : '-1');
  });
}

private _handleArrowKey(direction: 'next' | 'prev') {
  const count = this._items.length;
  this._activeIndex = direction === 'next'
    ? (this._activeIndex + 1) % count
    : (this._activeIndex - 1 + count) % count;
  this._updateTabindices();
  this._items[this._activeIndex].focus();
}
```

## Next Steps

- [Focus Management](/components-guide/accessibility/focus-management/) — focus traps, `delegatesFocus`, and focus restoration
- [ARIA in Web Components](/components-guide/accessibility/aria/) — `aria-expanded`, `aria-controls`, and composite widget roles
- [Accessibility Testing](/components-guide/testing/accessibility-testing/) — keyboard test patterns
