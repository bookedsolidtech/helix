# Accessibility Workflow for Web Components

Healthcare mandate: WCAG 2.1 AA minimum. Zero regressions. Zero exceptions.

---

## Shadow DOM ARIA Patterns

### ElementInternals for Form Components

```typescript
class HxTextInput extends LitElement {
  static formAssociated = true;
  private internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  updated() {
    // Set accessible name via internals, not aria-* attributes on host
    this.internals.ariaLabel = this.label;
    this.internals.role = 'textbox';
  }
}
```

### ARIA Attribute Reflection

- Use `ElementInternals` for ARIA on the host element (not `this.setAttribute('aria-*')`)
- Internal elements in shadow DOM use standard `aria-*` attributes
- `role` goes on the focusable element, not always the host
- `aria-describedby` / `aria-labelledby` cannot cross shadow boundaries -- use `aria-label` or `internals.ariaLabel` instead

### Cross-Shadow-Boundary Patterns

- Labels: Use `<label>` inside shadow DOM pointing to internal `<input>`, or use `aria-label`
- Descriptions: Use `aria-describedby` pointing to elements within the same shadow root
- Live regions: Place `aria-live` region inside shadow DOM for component-scoped announcements
- Error messages: Connect via `aria-describedby` to internal error element

---

## Keyboard Navigation

### Required Patterns by Component Type

**Buttons / Actions:**
- `Enter` and `Space`: Activate
- No arrow key navigation (unless in a toolbar/group)

**Text Inputs:**
- Standard text input keyboard behavior
- `Escape`: Clear or revert (context-dependent)

**Select / Combobox / Menu:**
- `Arrow Up/Down`: Navigate options
- `Enter`: Select focused option
- `Escape`: Close dropdown, return focus to trigger
- `Home/End`: Jump to first/last option
- Type-ahead: Character keys filter/jump to matching options

**Dialogs / Drawers:**
- `Escape`: Close
- `Tab`: Cycle focus within (focus trap)
- Focus returns to trigger element on close

**Tabs:**
- `Arrow Left/Right`: Navigate tabs (horizontal)
- `Arrow Up/Down`: Navigate tabs (vertical)
- `Enter/Space`: Activate tab (if manual activation)
- `Home/End`: First/last tab

**Checkbox / Radio / Switch:**
- `Space`: Toggle checkbox/switch
- `Arrow keys`: Move between radio options in group

### Implementation

```typescript
private handleKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      this.activate();
      break;
    case 'Escape':
      this.close();
      this.returnFocus();
      break;
    case 'ArrowDown':
      e.preventDefault();
      this.focusNext();
      break;
    case 'ArrowUp':
      e.preventDefault();
      this.focusPrevious();
      break;
  }
}
```

---

## Focus Management

### Focus Delegation

```typescript
class HxButton extends LitElement {
  static styles = css`
    :host { display: inline-block; }
  `;

  // Enable focus delegation so host focus goes to internal button
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true
  };
}
```

### Focus Trapping (Dialogs, Drawers)

1. On open: Move focus to first focusable element inside
2. On `Tab` at last element: Wrap to first element
3. On `Shift+Tab` at first element: Wrap to last element
4. On close: Return focus to the element that triggered the open
5. Use a sentinel approach or `inert` attribute on background content

### Focus Visible

```css
:host(:focus-visible) {
  outline: 2px solid var(--hx-color-focus);
  outline-offset: 2px;
}

/* Internal focusable elements */
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--hx-color-focus);
  outline-offset: 2px;
}
```

---

## Screen Reader Testing Checklist

For each component, verify:

- [ ] Component role announced correctly
- [ ] Accessible name announced (label, aria-label)
- [ ] State changes announced (expanded/collapsed, checked/unchecked, selected)
- [ ] Error messages announced via `aria-live` or `aria-describedby`
- [ ] Group relationships conveyed (radio group, tab list, menu)
- [ ] Required fields indicated (`aria-required`)
- [ ] Disabled state communicated (`aria-disabled` or `disabled` attribute)
- [ ] Loading state communicated (`aria-busy`)
- [ ] Dynamic content changes announced via live regions

---

## axe-core Integration with Vitest

```typescript
import { axe } from 'vitest-axe';
import { fixture, cleanup } from '../../test-utils.js';

describe('hx-button a11y', () => {
  afterEach(cleanup);

  it('has no accessibility violations', async () => {
    const el = await fixture('<hx-button>Click me</hx-button>');
    const results = await axe(el);
    expect(results.violations).toEqual([]);
  });

  it('has no a11y violations when disabled', async () => {
    const el = await fixture('<hx-button disabled>Click me</hx-button>');
    const results = await axe(el);
    expect(results.violations).toEqual([]);
  });
});
```

---

## WCAG 2.1 AA Criteria by Component Type

### All Components
- 1.3.1 Info and Relationships: Semantic structure conveyed programmatically
- 1.4.3 Contrast: 4.5:1 text, 3:1 UI components
- 1.4.11 Non-text Contrast: 3:1 for UI components and graphical objects
- 2.1.1 Keyboard: All functionality available via keyboard
- 2.4.7 Focus Visible: Focus indicator visible on all interactive elements
- 4.1.2 Name, Role, Value: All UI components have accessible name and role

### Form Components (text-input, select, checkbox, radio, switch)
- 1.3.5 Identify Input Purpose: `autocomplete` attribute support
- 3.3.1 Error Identification: Errors described in text
- 3.3.2 Labels or Instructions: Visible labels for all inputs
- 3.3.3 Error Suggestion: Constructive error messages

### Dynamic Components (dialog, drawer, toast, dropdown)
- 2.4.3 Focus Order: Logical tab order maintained
- 4.1.3 Status Messages: Status conveyed without focus change (aria-live)

### Navigation Components (tabs, menu, breadcrumb)
- 2.4.1 Bypass Blocks: Skip navigation mechanism
- 2.4.6 Headings and Labels: Descriptive headings

---

## Healthcare-Specific Requirements

1. **Error states must be unambiguous** -- never rely on color alone (use icons + text)
2. **Time-sensitive content** -- provide adequate time or ability to extend
3. **Critical actions** -- confirm before destructive operations (delete, submit)
4. **High contrast mode** -- components must be usable in Windows High Contrast Mode
5. **Zoom support** -- components must be functional at 200% zoom
6. **Motion sensitivity** -- respect `prefers-reduced-motion` for all animations
7. **Touch targets** -- minimum 44x44px for interactive elements (WCAG 2.5.5 AAA target, AA recommended)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
