# Extension API Version Contract

**Current API Version: 1.0.0**

This document defines the formal version contract for the Helix Extension API. Teams extending Helix components in production systems should reference this document to understand what they can rely on and what may change.

---

## Definitions

| Term | Definition |
|---|---|
| **Public API** | `@property` decorated properties, `@fires` events, `@slot` names, `@csspart` names |
| **Extension API** | `protected` methods documented in this Extension API reference |
| **Internal** | Private members (`_*`), internal CSS classes, render implementation details |

---

## Breaking vs Non-Breaking Changes

### Non-Breaking (minor version bump, e.g., 1.0.0 → 1.1.0)

These changes are safe and will NOT break existing extensions:

- **Adding** a new `protected` method
- **Adding** a new `@property`
- **Adding** a new `@slot`
- **Adding** a new `@csspart`
- **Adding** a new `@fires` event
- Changing an internal `private` implementation without altering observable behavior
- Improving accessibility (ARIA refinements that preserve existing patterns)
- Bug fixes that restore documented behavior

### Breaking (major version bump, e.g., 1.x → 2.0.0)

These changes **will break existing extensions** and trigger a major version:

- **Renaming** a `protected` method
- **Removing** a `protected` method
- **Changing the signature** of a `protected` method (parameter types, return type)
- **Changing the semantics** of a `protected` method (when it's called, what it does)
- **Renaming** a `@property`
- **Removing** a `@property`
- **Changing the type** of a `@property`
- **Renaming** a `@customElement` tag name
- **Removing** a `@slot`
- **Removing** a `@csspart`
- **Removing** a `@fires` event
- **Changing the detail shape** of a `@fires` event

---

## Extension API Stability Matrix

| Component | Tag | Class | API Status | Since |
|---|---|---|---|---|
| Alert | `hx-alert` | `HelixAlert` | Stable | 1.0.0 |
| Badge | `hx-badge` | `HelixBadge` | Stable | 1.0.0 |
| Button | `hx-button` | `HelixButton` | Stable | 1.0.0 |
| Card | `hx-card` | `HelixCard` | Stable | 1.0.0 |
| Checkbox | `hx-checkbox` | `HelixCheckbox` | Stable | 1.0.0 |
| Container | `hx-container` | `HelixContainer` | Stable | 1.0.0 |
| Form | `hx-form` | `HelixForm` | Stable | 1.0.0 |
| Prose | `hx-prose` | `HelixProse` | Stable | 1.0.0 |
| Radio Group | `hx-radio-group` | `HelixRadioGroup` | Stable | 1.0.0 |
| Select | `hx-select` | `HelixSelect` | Stable | 1.0.0 |
| Switch | `hx-switch` | `HelixSwitch` | Stable | 1.0.0 |
| Text Input | `hx-text-input` | `HelixTextInput` | Stable | 1.0.0 |
| Textarea | `hx-textarea` | `HelixTextarea` | Stable | 1.0.0 |

---

## Deprecation Policy

When an Extension API method needs to change:

1. The old method is **deprecated** (marked with `@deprecated`) in the next minor release
2. The new method is **added** in the same minor release
3. The old method is **removed** in the next major release (minimum 6 months after deprecation)

Example:
```
v1.1.0 — `renderIcon()` deprecated, `renderDefaultIcon()` added
v2.0.0 — `renderIcon()` removed
```

---

## Extending Responsibly

### Do

```typescript
// Override protected methods to customize behavior
class MyCard extends HelixCard {
  protected override getCardClasses(): Record<string, boolean> {
    // Always spread super's classes to preserve base styling
    return { ...super.getCardClasses(), 'my-card': true };
  }
}
```

### Do Not

```typescript
// Do NOT access private internals
class MyInput extends HelixTextInput {
  doSomething() {
    // BAD: _internals is private — this can break at any time
    (this as any)._internals.setValidity(...);
  }
}

// Do NOT override render() without calling super
class MyButton extends HelixButton {
  override render() {
    // BAD: loses all base ARIA, event handling, and accessibility
    return html`<button>Custom</button>`;
  }
}

// Do NOT use CSS class names from Shadow DOM
// BAD: .button--primary is internal — use CSS parts instead
```

### Safe render() Override Pattern

If you must override `render()` entirely, preserve the protected render helpers:

```typescript
class MyCard extends HelixCard {
  override render() {
    return html`
      <div part="card" class=${classMap(this.getCardClasses())}>
        ${this.renderImageSection()}
        ${this.renderHeadingSection()}
        <!-- Custom content -->
        <div class="my-custom-section"><slot name="custom"></slot></div>
        ${this.renderBodySection()}
        ${this.renderFooterSection()}
        ${this.renderActionsSection()}
      </div>
    `;
  }
}
```

---

## Filing Extension API Issues

If you discover that:

- A `protected` method's behavior changed without a major version bump
- A documented `protected` method is missing from the source
- An extension pattern breaks in an unexpected way

File an issue at the repository with label **`extension-api`** and include:

1. The Helix library version you're using
2. The component being extended
3. The `protected` method being overridden
4. The observed vs. expected behavior

---

## Future API Additions (Roadmap)

Planned protected methods for future releases (not yet stable):

- `renderLoadingState(): unknown` — for async data components
- `renderEmptyState(): unknown` — for list/table components
- `getA11yAttributes(): Record<string, string>` — centralized ARIA attribute map
- `onThemeChange(theme: string): void` — design token theme change hook

These will be added as minor version bumps when implemented.
