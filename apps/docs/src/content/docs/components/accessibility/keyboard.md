---
title: Keyboard Navigation
description: Comprehensive guide to keyboard accessibility patterns in HELiX components
sidebar:
  order: 3
---

Keyboard accessibility is a cornerstone of inclusive web design. Users navigate interfaces without a mouse for many reasons: motor disabilities, vision impairments paired with screen readers, repetitive strain injuries, or personal preference. In healthcare enterprise environments, keyboard-first workflows are often faster and more accurate than mouse-based interactions.

This guide covers the keyboard navigation patterns implemented across HELiX components, based on [W3C WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/).

## Prerequisites

Before reading this guide, review:

- [WCAG Compliance](/components/accessibility/wcag) — Understand WCAG 2.1 AA requirements

## Fundamental Principles

### 1. All Functionality Must Be Keyboard Accessible

Every interactive element in HELiX components can be operated using only a keyboard. This satisfies [WCAG 2.1 Success Criterion 2.1.1 (Keyboard)](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html).

**Non-negotiable requirements:**

- All interactive elements must be focusable (native elements or `tabindex`)
- All actions triggered by mouse clicks must have keyboard equivalents
- Focus order must follow a logical sequence
- Focus must always be visible during keyboard navigation

### 2. No Keyboard Traps

Users must be able to navigate to and away from all components using standard keyboard navigation techniques. If focus can enter a component, it must be possible to exit using only the keyboard. This satisfies [WCAG 2.1 Success Criterion 2.1.2 (No Keyboard Trap)](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html).

**Exception:** Modal dialogs and certain composite widgets intentionally trap focus within their boundaries, but they must provide a clear keyboard method to exit (typically `Escape` key).

### 3. Timing Must Be Adjustable

If keyboard interactions involve time limits, users must be able to turn off, adjust, or extend the time limit before it expires. This satisfies [WCAG 2.1 Success Criterion 2.2.1 (Timing Adjustable)](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html).

HELiX components avoid timing-dependent keyboard interactions except where essential (e.g., session timeouts), and these provide clear warnings and extension mechanisms.

## Tab Order Management

Tab order determines the sequence in which elements receive focus when users press `Tab` or `Shift+Tab`. Proper tab order is essential for intuitive keyboard navigation.

### Natural Tab Order

The best tab order is the natural DOM order. HELiX components are structured so that source order matches the intended focus order, requiring no explicit `tabindex` manipulation in most cases.

```html
<!-- Natural tab order: Button 1 → Button 2 → Button 3 -->
<hx-button>Button 1</hx-button>
<hx-button>Button 2</hx-button>
<hx-button>Button 3</hx-button>
```

### Tabindex Values

HELiX uses `tabindex` strategically:

| Value    | Behavior                                                         | Usage                                             |
| -------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| `0`      | Element is focusable and included in natural tab order           | Default for interactive elements                  |
| `-1`     | Element is programmatically focusable but removed from tab order | Used in roving tabindex patterns, disabled states |
| Positive | Element is focused before natural tab order (anti-pattern)       | **Never used** in HELiX                         |

**Why we avoid positive tabindex values:**

Positive `tabindex` values (1, 2, 3, etc.) disrupt the natural tab order, creating a confusing experience. They force elements out of their visual sequence, making keyboard navigation unpredictable. HELiX prohibits positive `tabindex` values.

### Shadow DOM and Tab Order

Web components using Shadow DOM participate in tab order based on the `delegatesFocus` property:

```typescript
// hx-button implementation
export class HxButton extends LitElement {
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true, // Focus moves to first focusable element in shadow DOM
  };
}
```

**Key points:**

- `delegatesFocus: true` automatically forwards focus to the first focusable element inside the shadow root when the host element receives focus
- This allows custom elements to behave like native form controls
- Users tab to the custom element, and focus is delegated to the internal `<button>` or `<input>`

## Focus Management Patterns

Focus management is the process of programmatically controlling which element receives keyboard focus. Proper focus management ensures users always know where they are and can navigate efficiently.

### Setting Focus Programmatically

HELiX components expose a `focus()` method for programmatic focus management:

```typescript
// Set focus to a button
const button = document.querySelector('hx-button');
button.focus();

// Set focus to a text input
const input = document.querySelector('hx-text-input');
input.focus();
```

Internally, components delegate to their focusable elements:

```typescript
// Inside hx-text-input
focus() {
  this.inputElement?.focus();
}
```

### Focus on Component Load

Some components need to capture focus when they appear. Modal dialogs are the most common example:

```typescript
// Focus management in hx-modal (future component)
async firstUpdated() {
  await this.updateComplete;
  if (this.open) {
    this.focusFirstElement();
  }
}

private focusFirstElement() {
  const focusableElement = this.renderRoot.querySelector('[autofocus]') ||
                           this.renderRoot.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  (focusableElement as HTMLElement)?.focus();
}
```

### Restoring Focus

When a component closes or a temporary state ends, focus should return to the element that triggered the action:

```typescript
// Focus restoration pattern (hx-modal example)
private previousFocus: HTMLElement | null = null;

open() {
  this.previousFocus = document.activeElement as HTMLElement;
  this.showModal();
}

close() {
  this.hideModal();
  this.previousFocus?.focus();
  this.previousFocus = null;
}
```

This pattern is essential for modal dialogs, dropdown menus, and context menus.

### Managing Focus in Shadow DOM

Focus management across shadow boundaries requires explicit methods:

```typescript
// hx-text-input exposes a public focus() method
export class WcTextInput extends LitElement {
  @query('input') private inputElement!: HTMLInputElement;

  focus(options?: FocusOptions) {
    this.inputElement?.focus(options);
  }

  blur() {
    this.inputElement?.blur();
  }
}
```

Consumers can now focus the component as if it were a native element:

```typescript
document.querySelector('hx-text-input').focus();
```

## Roving Tabindex Pattern

The roving tabindex pattern is used for composite widgets where only one child element is in the tab order at a time, but all children are navigable using arrow keys. This satisfies the [WAI-ARIA pattern for managing focus within components](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).

### When to Use Roving Tabindex

Roving tabindex is appropriate for:

- **Toolbars** — Groups of buttons or controls
- **Radio groups** — Sets of radio buttons
- **Tab lists** — Horizontal or vertical tabs
- **Grids and tree views** — Two-dimensional navigation
- **Menus and menu bars** — Hierarchical navigation

### How Roving Tabindex Works

1. One child element has `tabindex="0"` (in the tab order)
2. All other children have `tabindex="-1"` (focusable but not in tab order)
3. Arrow keys move focus between children
4. When focus moves to a new child:
   - The previously focused element gets `tabindex="-1"`
   - The newly focused element gets `tabindex="0"`
5. `Tab` key exits the component and moves to the next focusable element

### Example: wc-radio-group

```typescript
// Simplified wc-radio-group roving tabindex implementation
export class WcRadioGroup extends LitElement {
  @queryAssignedElements({ selector: 'hx-radio' })
  private radios!: Array<WcRadio>;

  private handleKeyDown(e: KeyboardEvent) {
    const currentIndex = this.radios.findIndex((r) => r === e.target);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % this.radios.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex === 0 ? this.radios.length - 1 : currentIndex - 1;
        break;
    }

    if (nextIndex !== currentIndex) {
      this.updateTabindex(nextIndex);
      this.radios[nextIndex].focus();
    }
  }

  private updateTabindex(activeIndex: number) {
    this.radios.forEach((radio, index) => {
      radio.tabIndex = index === activeIndex ? 0 : -1;
    });
  }
}
```

### Arrow Key Conventions

HELiX follows W3C WAI-ARIA arrow key conventions:

| Layout     | Key          | Action                      |
| ---------- | ------------ | --------------------------- |
| Horizontal | `ArrowRight` | Move focus to next item     |
| Horizontal | `ArrowLeft`  | Move focus to previous item |
| Vertical   | `ArrowDown`  | Move focus to next item     |
| Vertical   | `ArrowUp`    | Move focus to previous item |
| Grid       | `ArrowRight` | Move focus right            |
| Grid       | `ArrowLeft`  | Move focus left             |
| Grid       | `ArrowDown`  | Move focus down             |
| Grid       | `ArrowUp`    | Move focus up               |

**Wrapping behavior:**

- Arrow keys typically wrap (moving past the last item focuses the first item)
- `Home` key moves to the first item
- `End` key moves to the last item

## Keyboard Shortcut Patterns

Keyboard shortcuts accelerate workflows for power users. HELiX components implement shortcuts following platform conventions and WAI-ARIA guidelines.

### Standard Keyboard Shortcuts

| Key                     | Context                         | Action                           |
| ----------------------- | ------------------------------- | -------------------------------- |
| `Enter`                 | Button, link                    | Activate                         |
| `Space`                 | Button, checkbox, radio, switch | Activate/toggle                  |
| `Escape`                | Modal, dropdown, popover        | Close/cancel                     |
| `Tab`                   | Any                             | Move focus to next element       |
| `Shift+Tab`             | Any                             | Move focus to previous element   |
| `ArrowUp` / `ArrowDown` | Select, listbox, menu           | Navigate options                 |
| `Home`                  | List, grid, text input          | Move to first item/start of text |
| `End`                   | List, grid, text input          | Move to last item/end of text    |
| `PageUp` / `PageDown`   | Scrollable regions, large lists | Scroll up/down                   |

### Component-Specific Shortcuts

#### hx-button

```typescript
@keydown=${(e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    this.click();
  }
}}
```

Native `<button>` elements handle `Enter` and `Space` automatically, but custom buttons must implement this explicitly.

#### hx-text-input

```typescript
@keydown=${(e: KeyboardEvent) => {
  if (e.key === 'Escape' && this.clearable && this.value) {
    e.preventDefault();
    this.clear();
  }
}}
```

`Escape` clears the input if the `clearable` property is set.

#### hx-select (future component)

```typescript
@keydown=${(e: KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      this.open ? this.selectFocusedOption() : this.openDropdown();
      break;
    case 'Escape':
      e.preventDefault();
      this.closeDropdown();
      break;
    case 'ArrowDown':
      e.preventDefault();
      this.open ? this.focusNextOption() : this.openDropdown();
      break;
    case 'ArrowUp':
      e.preventDefault();
      this.open ? this.focusPreviousOption() : this.openDropdown();
      break;
    case 'Home':
      e.preventDefault();
      this.focusFirstOption();
      break;
    case 'End':
      e.preventDefault();
      this.focusLastOption();
      break;
  }
}}
```

### Avoiding Conflicts with Browser Shortcuts

HELiX avoids keyboard shortcuts that conflict with browser or operating system shortcuts:

**Avoided shortcuts:**

- `Ctrl+[Key]` or `Cmd+[Key]` — Reserved for browser actions (save, print, refresh, etc.)
- `Alt+[Key]` — Reserved for browser menus and extensions
- `F1`-`F12` — Browser and OS functions (refresh, DevTools, etc.)

**Safe shortcuts:**

- Arrow keys (in focused components)
- `Enter`, `Space`, `Escape`
- `Home`, `End`, `PageUp`, `PageDown`
- Single letter keys (typeahead in lists)

### Typeahead/Type-Ahead Search

Composite widgets like select dropdowns and listboxes support typeahead: users type one or more characters, and focus moves to the first matching option.

```typescript
// Simplified typeahead implementation
private typeaheadBuffer = '';
private typeaheadTimeout: number | null = null;

private handleTypeahead(e: KeyboardEvent) {
  // Clear buffer after 500ms of inactivity
  if (this.typeaheadTimeout) {
    clearTimeout(this.typeaheadTimeout);
  }

  this.typeaheadBuffer += e.key.toLowerCase();
  this.typeaheadTimeout = window.setTimeout(() => {
    this.typeaheadBuffer = '';
  }, 500);

  // Find first option matching buffer
  const matchingOption = this.options.find(opt =>
    opt.textContent?.toLowerCase().startsWith(this.typeaheadBuffer)
  );

  if (matchingOption) {
    this.focusOption(matchingOption);
  }
}
```

Typeahead improves efficiency in long lists, allowing users to jump directly to options without repeated arrow key presses.

## :focus-visible Pseudo-Class

Not all focus requires a visible focus indicator. Mouse users clicking a button don't expect a focus ring to persist. Keyboard users navigating with `Tab` need clear focus indicators.

### The Problem with :focus

The CSS `:focus` pseudo-class applies whenever an element receives focus, regardless of input method:

```css
/* Focus ring appears on click (not ideal) */
button:focus {
  outline: 2px solid blue;
}
```

This creates a poor experience for mouse users: clicking a button shows a focus ring that persists until focus moves elsewhere.

### The Solution: :focus-visible

The `:focus-visible` pseudo-class only matches when the browser determines that focus should be visibly indicated — typically during keyboard navigation:

```css
/* Focus ring only appears during keyboard navigation */
button:focus-visible {
  outline: 2px solid blue;
}
```

### HELiX Focus Visible Implementation

All HELiX components use `:focus-visible` for focus indicators:

```css
/* hx-button focus styles */
:host(:focus-visible) {
  outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, var(--hx-color-primary));
  outline-offset: var(--hx-focus-ring-offset, 2px);
}
```

**Design tokens for focus indicators:**

- `--hx-focus-ring-width` — Thickness of focus ring (default: `2px`)
- `--hx-focus-ring-color` — Color of focus ring (default: `--hx-color-primary`)
- `--hx-focus-ring-offset` — Spacing between element and focus ring (default: `2px`)

### Focus Visible Polyfill

Modern browsers support `:focus-visible`, but older browsers may not. HELiX includes a polyfill in the Storybook environment:

```html
<script src="https://unpkg.com/focus-visible@5.2.0/dist/focus-visible.min.js"></script>
```

This polyfill adds a `.focus-visible` class to focused elements when keyboard focus is detected, enabling fallback styles:

```css
/* Fallback for browsers without :focus-visible */
button:focus:not(:focus-visible) {
  outline: none;
}

button.focus-visible {
  outline: 2px solid blue;
}
```

HELiX's production bundle does not include the polyfill (to minimize bundle size), but consumers can add it if they need to support older browsers.

## Focus Trap Patterns

A focus trap confines keyboard focus within a container, preventing users from tabbing outside the container. Focus traps are essential for modal dialogs, where focus must remain within the modal until it's explicitly dismissed.

### When to Use Focus Traps

Focus traps are appropriate for:

- **Modal dialogs** — Full-screen or centered overlays
- **Popover menus** — Context menus, dropdown menus
- **Alerts** — Critical messages requiring user acknowledgment
- **Lightboxes** — Image or media viewers

Focus traps are **not** appropriate for:

- Non-modal elements (sidebars, tooltips, notifications)
- Inline editing interfaces
- Expandable sections (accordions, details/summary)

### How Focus Traps Work

1. When the trap activates, store the currently focused element
2. Move focus into the trap container
3. Listen for `Tab` and `Shift+Tab` keydown events
4. When focus reaches the last element and user presses `Tab`, move focus to the first element
5. When focus reaches the first element and user presses `Shift+Tab`, move focus to the last element
6. When the trap deactivates, restore focus to the stored element

### Example: hx-modal (Future Component)

```typescript
export class WcModal extends LitElement {
  @property({ type: Boolean }) open = false;

  private previousFocus: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this.activateFocusTrap();
      } else {
        this.deactivateFocusTrap();
      }
    }
  }

  private activateFocusTrap() {
    // Store current focus
    this.previousFocus = document.activeElement as HTMLElement;

    // Find all focusable elements within modal
    this.focusableElements = Array.from(
      this.renderRoot.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );

    // Focus first element
    this.focusableElements[0]?.focus();

    // Listen for Tab key
    document.addEventListener('keydown', this.handleFocusTrap);
  }

  private deactivateFocusTrap() {
    // Remove listener
    document.removeEventListener('keydown', this.handleFocusTrap);

    // Restore focus
    this.previousFocus?.focus();
    this.previousFocus = null;
  }

  private handleFocusTrap = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift+Tab on first element → focus last element
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab on last element → focus first element
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
}
```

### Escape Key to Exit

Focus traps must provide a keyboard method to exit. The `Escape` key is the universal convention:

```typescript
private handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && this.open) {
    e.preventDefault();
    this.close();
  }
};
```

This ensures compliance with WCAG 2.1 SC 2.1.2 (No Keyboard Trap).

### Accessible Focus Trap Libraries

For complex focus trap scenarios, HELiX may integrate a library like [focus-trap](https://github.com/focus-trap/focus-trap):

```typescript
import { createFocusTrap } from 'focus-trap';

connectedCallback() {
  super.connectedCallback();
  this.focusTrap = createFocusTrap(this.renderRoot as any, {
    escapeDeactivates: true,
    returnFocusOnDeactivate: true,
  });
}

private activateFocusTrap() {
  this.focusTrap.activate();
}

private deactivateFocusTrap() {
  this.focusTrap.deactivate();
}
```

This approach handles edge cases like dynamically added focusable elements and nested focus traps.

## HELiX Keyboard Navigation Examples

### Example 1: Basic Button Navigation

```html
<hx-button>Save</hx-button>
<hx-button variant="secondary">Cancel</hx-button>
<hx-button variant="danger">Delete</hx-button>
```

**Keyboard interaction:**

1. `Tab` — Focus moves to "Save" button
2. `Enter` or `Space` — Activates "Save" button
3. `Tab` — Focus moves to "Cancel" button
4. `Enter` or `Space` — Activates "Cancel" button
5. `Tab` — Focus moves to "Delete" button
6. `Enter` or `Space` — Activates "Delete" button

### Example 2: Form with Validation

```html
<form>
  <hx-text-input label="Email" type="email" required></hx-text-input>
  <hx-text-input label="Password" type="password" required></hx-text-input>
  <hx-checkbox>Remember me</hx-checkbox>
  <hx-button type="submit">Log In</hx-button>
</form>
```

**Keyboard interaction:**

1. `Tab` — Focus moves to email input
2. Type email address
3. `Tab` — Focus moves to password input
4. Type password
5. `Tab` — Focus moves to "Remember me" checkbox
6. `Space` — Toggles checkbox
7. `Tab` — Focus moves to "Log In" button
8. `Enter` — Submits form

If validation fails:

- Focus moves to the first invalid field
- Error message is announced via `aria-live="assertive"`
- `aria-invalid="true"` is set on invalid fields

### Example 3: Radio Group with Roving Tabindex

```html
<wc-radio-group label="Notification preference">
  <wc-radio value="email">Email</wc-radio>
  <wc-radio value="sms">SMS</wc-radio>
  <wc-radio value="push">Push notification</wc-radio>
</wc-radio-group>
```

**Keyboard interaction:**

1. `Tab` — Focus moves to the selected radio (or first radio if none selected)
2. `ArrowDown` or `ArrowRight` — Focus moves to next radio and selects it
3. `ArrowUp` or `ArrowLeft` — Focus moves to previous radio and selects it
4. `Tab` — Focus exits radio group and moves to next focusable element

Only one radio is in the tab order at a time, but all radios are navigable with arrow keys.

### Example 4: Interactive Card

```html
<hx-card href="/patient/12345" interactive>
  <h3 slot="header">John Doe</h3>
  <p>Patient ID: 12345</p>
  <p>Last visit: 2026-02-10</p>
</hx-card>
```

**Keyboard interaction:**

1. `Tab` — Focus moves to card (entire card is focusable)
2. `Enter` — Navigates to `/patient/12345`
3. Focus indicator surrounds entire card

Internally, hx-card uses `role="link"` and `tabindex="0"` when `href` is provided.

### Example 5: Select with Typeahead (Future Component)

```html
<hx-select label="Select a state">
  <wc-option value="AL">Alabama</wc-option>
  <wc-option value="AK">Alaska</wc-option>
  <wc-option value="AZ">Arizona</wc-option>
  <!-- ... 47 more states ... -->
</hx-select>
```

**Keyboard interaction:**

1. `Tab` — Focus moves to select
2. `Enter` or `Space` or `ArrowDown` — Opens dropdown
3. `ArrowDown` — Focus moves to next option
4. `ArrowUp` — Focus moves to previous option
5. `Home` — Focus moves to first option
6. `End` — Focus moves to last option
7. Type "C" — Focus moves to first option starting with "C" (California)
8. Type "O" (within 500ms of "C") — Focus moves to "Colorado" (typeahead buffer: "CO")
9. `Enter` — Selects focused option and closes dropdown
10. `Escape` — Closes dropdown without selecting

### Example 6: Modal Dialog with Focus Trap

```html
<hx-button onclick="document.querySelector('hx-modal').open = true"> Open Modal </hx-button>

<hx-modal id="confirm-modal">
  <h2 slot="header">Confirm Action</h2>
  <p>Are you sure you want to delete this record?</p>
  <div slot="footer">
    <hx-button variant="danger">Delete</hx-button>
    <hx-button variant="secondary" onclick="document.querySelector('hx-modal').open = false">
      Cancel
    </hx-button>
  </div>
</hx-modal>
```

**Keyboard interaction:**

1. `Tab` — Focus on "Open Modal" button
2. `Enter` — Opens modal, focus moves to "Delete" button (first focusable element in modal)
3. `Tab` — Focus moves to "Cancel" button
4. `Tab` — Focus wraps to "Delete" button (focus trap active)
5. `Shift+Tab` — Focus moves back to "Cancel" button
6. `Shift+Tab` — Focus wraps to "Delete" button
7. `Escape` — Closes modal, focus returns to "Open Modal" button

The focus trap ensures users cannot accidentally tab outside the modal while it's open.

## Testing Keyboard Navigation

### Manual Testing

1. **Unplug your mouse** (or don't touch it)
2. Press `Tab` repeatedly and verify:
   - All interactive elements receive focus
   - Focus order matches visual order
   - Focus indicators are clearly visible
   - No elements are skipped
   - No keyboard traps (except intentional ones)
3. Test keyboard shortcuts:
   - `Enter` and `Space` activate buttons
   - `Escape` closes modals and dropdowns
   - Arrow keys navigate composite widgets
4. Test with a screen reader (VoiceOver, NVDA, JAWS):
   - All interactive elements are announced
   - Roles and states are accurate
   - Instructions are clear

### Automated Testing

HELiX uses Vitest browser mode and Playwright for automated keyboard testing:

```typescript
// hx-button.test.ts
import { expect, test } from 'vitest';
import { fixture, oneEvent } from '../../test-utils';

test('activates on Enter key', async () => {
  const el = await fixture<HxButton>('<hx-button>Click me</hx-button>');
  const clickPromise = oneEvent(el, 'click');

  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

  await clickPromise;
  expect(true).toBe(true); // Click event fired
});

test('activates on Space key', async () => {
  const el = await fixture<HxButton>('<hx-button>Click me</hx-button>');
  const clickPromise = oneEvent(el, 'click');

  el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

  await clickPromise;
  expect(true).toBe(true); // Click event fired
});

test('is focusable', async () => {
  const el = await fixture<HxButton>('<hx-button>Click me</hx-button>');
  el.focus();
  expect(document.activeElement).toBe(el);
});
```

### axe-core Integration

Storybook's a11y addon includes axe-core, which automatically checks for common keyboard accessibility issues:

- Missing `tabindex` on interactive elements
- Positive `tabindex` values (anti-pattern)
- Focus order issues
- Missing focus indicators

Run Storybook and open the Accessibility panel to see axe-core results for each component.

## Common Keyboard Accessibility Mistakes

### 1. Using `<div>` Instead of `<button>`

**Bad:**

```html
<div class="button" onclick="submit()">Submit</div>
```

This element is not keyboard accessible. It has no `tabindex`, no default keyboard handling, and is not announced as a button by screen readers.

**Good:**

```html
<button onclick="submit()">Submit</button>
```

Or, if a custom element is required:

```html
<hx-button onclick="submit()">Submit</hx-button>
```

### 2. Forgetting `tabindex="0"` on Custom Interactive Elements

**Bad:**

```html
<span class="clickable" onclick="doSomething()">Click me</span>
```

Spans are not focusable by default. Keyboard users cannot access this element.

**Good:**

```html
<span role="button" tabindex="0" onclick="doSomething()" onkeydown="handleKey(event)">
  Click me
</span>
```

Better: use a `<button>` or `<hx-button>`.

### 3. Using Positive `tabindex` Values

**Bad:**

```html
<input type="text" tabindex="1" />
<button tabindex="3">Submit</button>
<a href="/help" tabindex="2">Help</a>
```

Focus order: Input → Help link → Submit button (confusing and unpredictable).

**Good:**

```html
<input type="text" />
<button>Submit</button>
<a href="/help">Help</a>
```

Focus order matches visual order.

### 4. Missing Focus Indicators

**Bad:**

```css
button:focus {
  outline: none; /* Focus indicator removed */
}
```

Keyboard users cannot see where focus is.

**Good:**

```css
button:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

Focus is clearly visible during keyboard navigation.

### 5. Not Handling `Escape` in Modal Dialogs

**Bad:**

```typescript
// Modal has no Escape key handler
```

Users are trapped in the modal. This violates WCAG 2.1 SC 2.1.2 (No Keyboard Trap).

**Good:**

```typescript
@keydown=${(e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    this.close();
  }
}}
```

### 6. Arrow Keys Not Working in Composite Widgets

**Bad:**

```html
<!-- Radio group with no arrow key handling -->
<div role="radiogroup">
  <label><input type="radio" name="option" /> Option 1</label>
  <label><input type="radio" name="option" /> Option 2</label>
</div>
```

Users must tab through each radio, which is inefficient.

**Good:**

Implement roving tabindex with arrow key navigation (see wc-radio-group example above).

## Keyboard Accessibility Checklist

Use this checklist when building or reviewing components:

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order matches visual order
- [ ] No positive `tabindex` values
- [ ] `Enter` and `Space` activate buttons and toggles
- [ ] `Escape` closes modals, dropdowns, and popovers
- [ ] Arrow keys navigate composite widgets (radio groups, tabs, menus)
- [ ] Roving tabindex is used where appropriate
- [ ] Focus indicators are clearly visible (`:focus-visible`)
- [ ] Focus is programmatically managed when elements appear/disappear
- [ ] Focus is restored after temporary UI states (modals, dropdowns)
- [ ] Focus traps work correctly in modals
- [ ] No keyboard traps (except intentional, escapable ones)
- [ ] Typeahead works in long lists
- [ ] Keyboard shortcuts don't conflict with browser shortcuts
- [ ] Manual keyboard testing completed (unplug mouse)
- [ ] Screen reader testing completed (VoiceOver, NVDA, JAWS)
- [ ] Automated keyboard tests pass

## Resources

### W3C Standards

- [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guideline 2.1 (Keyboard Accessible)](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible)
- [Understanding Success Criterion 2.1.1 (Keyboard)](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)
- [Understanding Success Criterion 2.1.2 (No Keyboard Trap)](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html)
- [Design Patterns and Widgets (WAI-ARIA APG)](https://www.w3.org/WAI/ARIA/apg/patterns/)

### Tools

- [axe-core](https://github.com/dequelabs/axe-core) — Automated accessibility testing
- [Storybook a11y addon](https://storybook.js.org/addons/@storybook/addon-a11y) — axe-core integration for Storybook
- [focus-trap](https://github.com/focus-trap/focus-trap) — Accessible focus trap library
- [VoiceOver (macOS)](https://www.apple.com/accessibility/voiceover/) — Built-in screen reader
- [NVDA (Windows)](https://www.nvaccess.org/) — Free, open-source screen reader
- [JAWS (Windows)](https://www.freedomscientific.com/products/software/jaws/) — Professional screen reader

### HELiX Documentation

- [WCAG Compliance](/components/accessibility/wcag) — Overview of WCAG 2.1 AA requirements
- [Focus Management](/components/accessibility/focus-management) — Advanced focus management patterns

---

**Next steps:**

- Explore [Focus Management Patterns](/components/accessibility/focus-management) for advanced focus management techniques
- Test your components with the [Keyboard Accessibility Checklist](#keyboard-accessibility-checklist)
