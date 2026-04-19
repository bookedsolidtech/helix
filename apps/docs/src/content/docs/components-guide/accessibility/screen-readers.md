---
title: Screen Reader Support
description: How screen readers interact with web components, live regions, and shadow DOM in HELiX.
---

Screen readers translate visual interfaces into audio or braille output. Web components with shadow DOM present unique challenges, but modern browser-AT combinations have excellent support. This page covers what works, what requires explicit authoring, and how to test it.

## How Screen Readers Encounter Web Components

Modern screen readers (VoiceOver, NVDA, JAWS, Narrator) interact with the browser's accessibility tree, not the DOM directly. The accessibility tree is built from:

1. Native HTML semantics (`<button>`, `<input>`, `<nav>`, etc.)
2. ARIA attributes (`role`, `aria-label`, `aria-expanded`, etc.)
3. `ElementInternals` AOM properties

Shadow DOM is fully transparent to the accessibility tree in Chrome, Safari, Firefox, and Edge as of 2024. A screen reader reading `<hx-button>Save</hx-button>` hears "Save, button" — the same as it would for a native `<button>Save</button>`.

## Accessible Names

Every interactive element needs a computable accessible name. The name algorithm checks (in order):

1. `aria-labelledby` — references another element's text
2. `aria-label` — inline string
3. Native label (for form controls): `<label for="id">` or wrapped `<label>`
4. Contents of the element (for buttons, links)
5. `title` attribute (last resort, not announced by all AT)

```typescript
// Computable name from contents
html`<button><slot></slot></button>`
// Accessible name = slot text: "Save document"

// accessible-label on host — forwarded as aria-label onto the inner button
html`<button aria-label=${ifDefined(this.ariaLabel ?? undefined)}><slot></slot></button>`
// Consumer sets: <hx-button accessible-label="Close dialog">X</hx-button>
// Accessible name = "Close dialog" (overrides slot text)
```

## Live Regions

Live regions allow content updates to be announced without moving focus. Use them for:

- Toast notifications
- Status messages (form saved, error occurred)
- Progress updates
- Search result counts

```typescript
html`
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    aria-relevant="additions text"
  >
    ${this.message}
  </div>
`
```

### `aria-live` Values

| Value | Behavior |
|---|---|
| `off` | Changes are not announced (default) |
| `polite` | Announced when the user is idle; does not interrupt |
| `assertive` | Interrupts current speech immediately; use sparingly |

### `aria-atomic`

`aria-atomic="true"` makes the screen reader read the entire region when any part changes. Without it, only the changed text node is announced, which can be confusing for multi-word messages.

### Live Region Injection Pattern

For toast components, inject the message into a pre-existing live region rather than creating and destroying elements. Screen readers often miss newly created live regions:

```typescript
@customElement('hx-toast-region')
export class HelixToastRegion extends LitElement {
  @state()
  private _messages: string[] = [];

  // Called externally to add a toast
  addMessage(text: string) {
    this._messages = [...this._messages, text];
    // Remove after 5 seconds
    setTimeout(() => {
      this._messages = this._messages.filter(m => m !== text);
    }, 5000);
  }

  override render() {
    return html`
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        ${this._messages.map(m => html`<p>${m}</p>`)}
      </div>
    `;
  }
}
```

## `aria-atomic` and `aria-relevant`

`aria-relevant` controls which types of changes trigger announcements:

- `additions` — new nodes added
- `removals` — nodes removed
- `text` — text content changes
- `all` — all changes

Most cases need only `additions text` (the default when `aria-live` is set).

## Announcing Role and State

For custom interactive elements, the screen reader announces the role followed by the label, then the state:

- "Save, button" — from `<button>Save</button>`
- "Dark mode, switch, off" — from `<button role="switch" aria-checked="false">Dark mode</button>`
- "Email, edit, required" — from `<input type="email" aria-required="true">`
- "Loading, busy" — from `<button aria-busy="true">Loading...</button>`

Ensure your component's role, label, and state are all set correctly and update in sync.

## Testing with VoiceOver (macOS)

1. Enable VoiceOver: `Command+F5`
2. Navigate with `Control+Option+Arrow` keys or `Tab`/`Shift+Tab`
3. Interact with components using `Control+Option+Space`
4. Listen for announced role, name, and state

Key things to verify:
- Every interactive element has an announced role
- Labels are meaningful (not just "button" with no name)
- State changes (checked, expanded, busy) are announced
- Dialog opens move focus and trap it correctly
- Dialog closes return focus to the trigger

## Testing with NVDA (Windows)

1. Install NVDA (free, open source)
2. Launch with browser mode (`NVDA+Space` to switch)
3. Navigate with `Tab`, arrow keys, and NVDA commands
4. Press `Insert+T` to read the window title
5. Press `Insert+B` to read a focused element fully

## Known Shadow DOM Nuances

| Scenario | Status |
|---|---|
| AT reads shadow root content | Fully supported in Chrome, Firefox, Safari, Edge |
| `aria-labelledby` across shadow boundaries | Limited — ID references cannot cross shadow roots |
| `aria-controls` across shadow boundaries | Limited — same ID scoping restriction |
| `ElementInternals` ARIA | Fully supported in modern browsers |
| Slotted content accessible name | Works — slotted text is part of the element's accessible name |

For cross-shadow-boundary label associations, use `aria-label` or `ElementInternals.ariaLabel` on the element itself rather than referencing IDs from another shadow root.

## Next Steps

- [ARIA in Web Components](/components-guide/accessibility/aria/) — live regions, states, and properties
- [Focus Management](/components-guide/accessibility/focus-management/) — focus traps and restoration
- [WCAG Compliance](/components-guide/accessibility/wcag/) — the requirements driving these patterns
