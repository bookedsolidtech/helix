---
title: Extending HELiX Components
description: Architectural overview of the four extension vectors available to enterprise consumers — tokens, CSS parts, slots, and class inheritance — with a decision tree and semantic versioning guarantees.
---

HELiX components are built to be extended, not just used. This page orients enterprise teams on the architectural posture of the library and the four vectors available for customization — before writing a single line of code.

## Architectural Posture

Every HELiX component extends `LitElement` directly. There is no intermediate base class, no `HxBaseElement`, no mixin tower between your code and the platform.

```
LitElement (Lit 3.x)
├── HxButton
├── HxCard
├── HxTextInput
├── HxDialog
└── ... (77 components total)
```

**Why this matters for extension:**

- You can subclass any HELiX component and get a clean `super` chain — no hidden lifecycle layers to debug
- TypeScript types are precise and complete — no inherited overloads from an abstraction layer
- Lit's own extension patterns (mixins, controllers) work without friction
- Upgrading HELiX does not silently change behavior through a shared base class

The library is deliberately thin on convention. Convention lives in the token system and the Custom Elements Manifest — not in the class hierarchy.

## The Four Extension Vectors

```
┌─────────────────────────────────────────────────────────────────┐
│                   HELiX Extension Surface                       │
├───────────────────┬─────────────────────────────────────────────┤
│  CSS Custom Props │  Override visual design via token cascade   │
│  (--hx-*)        │  Works in any stylesheet, Twig, or inline   │
├───────────────────┼─────────────────────────────────────────────┤
│  CSS ::part()    │  Style specific internal elements directly   │
│  Selectors       │  Bypasses shadow DOM encapsulation cleanly   │
├───────────────────┼─────────────────────────────────────────────┤
│  Slot Composition │  Project content into defined slots         │
│                   │  Wrap components without subclassing        │
├───────────────────┼─────────────────────────────────────────────┤
│  Class Inheritance│  Subclass to add properties, methods,      │
│  (extends HxFoo)  │  override render, or register a new tag    │
└───────────────────┴─────────────────────────────────────────────┘
```

### Vector 1: CSS Custom Properties (Token Override)

HELiX components expose `--hx-*` CSS custom properties at two levels:

- **Semantic tokens** (`--hx-color-primary`, `--hx-spacing-md`) — affect the entire library at once
- **Component tokens** (`--hx-button-bg`, `--hx-card-padding`) — scope to a single component

Override at the root for global theming:

```css
:root {
  --hx-color-primary: #005eb8;      /* NHS Blue — affects all components */
  --hx-color-error: #d0021b;        /* Clinical alert red */
  --hx-border-radius-md: 2px;       /* Tighter corners for clinical UI */
}
```

Override at the component level for targeted customization:

```css
hx-button[variant="danger"] {
  --hx-button-bg: var(--hx-color-error);
  --hx-button-color: #ffffff;
}
```

Override inline for one-off instances:

```html
<hx-alert style="--hx-alert-border-color: #ff6b35;">
  Medication interaction detected
</hx-alert>
```

**Reach:** Any stylesheet — global CSS, Twig templates, React `style` prop, or Shadow DOM `::slotted()` context. The cascade works everywhere.

### Vector 2: CSS `::part()` Selectors (Style Injection)

Every HELiX component exposes named `part` attributes on its internal elements. The `::part()` pseudo-element lets you style those internals from outside the shadow boundary — without modifying the component source.

```css
/* Style the internal button element of hx-button */
hx-button::part(button) {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

/* Style the label inside hx-text-input */
hx-text-input::part(label) {
  font-size: 0.75rem;
  color: var(--hx-color-text-secondary);
}

/* Target the track of hx-slider */
hx-slider::part(track) {
  height: 6px;
  border-radius: 3px;
}
```

Parts are always composable with other selectors:

```css
/* Disabled state via attribute + part */
hx-button[disabled]::part(button) {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Focus ring customization */
hx-text-input:focus-within::part(input) {
  outline: 3px solid var(--hx-color-focus);
  outline-offset: 2px;
}
```

Every component's available parts are listed in the [Component Library](/component-library/overview/) and in the Custom Elements Manifest.

### Vector 3: Slot Composition (Content Projection)

Slots let you inject content into a component's shadow DOM without touching its internals. This is the primary mechanism for building wrapper components and branded variants in Drupal.

**Default slot** — plain content projection:

```html
<hx-card>
  <p>Patient vitals recorded at 14:32. All within normal range.</p>
</hx-card>
```

**Named slots** — structured content composition:

```html
<hx-card>
  <span slot="header">Patient: Sarah Chen — MRN 00847291</span>
  <div slot="body">
    <hx-badge variant="success">Stable</hx-badge>
    <p>Last updated 4 minutes ago</p>
  </div>
  <div slot="footer">
    <hx-button size="sm">View Full Record</hx-button>
  </div>
</hx-card>
```

Slots compose with other components for compound patterns:

```html
<hx-dialog>
  <span slot="title">Confirm Medication Order</span>
  <hx-alert slot="body" variant="warning">
    This dosage exceeds the recommended daily limit.
  </hx-alert>
  <div slot="footer">
    <hx-button variant="secondary">Cancel</hx-button>
    <hx-button variant="danger">Override and Submit</hx-button>
  </div>
</hx-dialog>
```

In Twig, slots map directly to named attributes on the `<slot>` element:

```twig
<hx-card>
  <span slot="header">{{ card.title }}</span>
  {{ card.body }}
</hx-card>
```

### Vector 4: Class Inheritance (Behavioral Extension)

When token overrides and slots are not enough — when you need new reactive properties, overridden lifecycle methods, or a registered custom element tag — subclass directly:

```typescript
import { HxButton } from '@helixui/library';
import { property } from 'lit/decorators.js';
import { html } from 'lit';

export class ClinicalActionButton extends HxButton {
  /** Requires two-click confirmation before firing hx-click */
  @property({ type: Boolean }) requireConfirm = false;

  private _pendingConfirm = false;

  override handleClick(e: MouseEvent): void {
    if (this.requireConfirm && !this._pendingConfirm) {
      e.stopImmediatePropagation();
      this._pendingConfirm = true;
      this.requestUpdate();
      setTimeout(() => {
        this._pendingConfirm = false;
        this.requestUpdate();
      }, 3000);
      return;
    }
    this._pendingConfirm = false;
    super.handleClick(e);
  }

  override render() {
    return this._pendingConfirm
      ? html`<button part="button">Click again to confirm</button>`
      : super.render();
  }
}

customElements.define('clinical-action-button', ClinicalActionButton);
```

Subclassing inherits all Lit reactive properties, event handling, and accessibility semantics. You extend behavior — you do not reimplement it.

---

## Decision Tree

Use this tree to choose the right vector before writing code:

```
Does the change affect only visual appearance?
│
├─ YES → Does it apply globally (all instances)?
│         │
│         ├─ YES → Override a semantic token at :root
│         │        (--hx-color-primary, --hx-spacing-md)
│         │
│         └─ NO → Does it apply to a specific component?
│                  │
│                  ├─ YES, surface-level → Override a component token
│                  │                       (--hx-button-bg, --hx-card-radius)
│                  │
│                  └─ YES, internal element → Use ::part() selector
│                                              (hx-button::part(button))
│
└─ NO → Does the change add or replace content inside the component?
         │
         ├─ YES → Use slot composition
         │        (slot="header", slot="footer", default slot)
         │
         └─ NO → Do you need new reactive properties, methods, or a new tag?
                  │
                  ├─ YES → Subclass and extend
                  │        (class MyButton extends HxButton)
                  │
                  └─ NO → You may not need extension — check the component's
                           existing properties and slots first
```

### Quick Reference Table

| Goal | Vector | Stability | Example |
| --- | --- | --- | --- |
| Brand color theming | CSS custom property (semantic) | **Stable** | `--hx-color-primary: #005eb8` |
| Component-specific style | CSS custom property (component) | **Stable** | `--hx-button-bg: navy` |
| Style an internal DOM element | `::part()` selector | **Stable** | `hx-button::part(button)` |
| Inject content into a component | Slot | **Stable** | `<span slot="header">` |
| Add properties or new tag | Class inheritance | **Stable** (public API only) | `class X extends HxButton` |
| Patch internal DOM structure | — | **Unstable** — do not do this | Shadow DOM internals are private |

---

## Semantic Versioning Contract

HELiX follows [Semantic Versioning 2.0.0](https://semver.org/). The versioning guarantee applies per extension vector:

### What Is Stable (Covered by SemVer)

The Custom Elements Manifest (`custom-elements.json`) is the authoritative source of the public API. Anything listed there is guaranteed stable across patch and minor releases:

| CEM Field | What It Covers | Vector |
| --- | --- | --- |
| `customElements[].tagName` | The `hx-*` tag name | All vectors |
| `customElements[].attributes` | HTML attributes and reflected properties | Tokens, inheritance |
| `customElements[].cssProperties` | `--hx-*` CSS custom properties | Token override |
| `customElements[].cssParts` | Named CSS parts (`::part()`) | `::part()` selectors |
| `customElements[].slots` | Named and default slots | Slot composition |
| `customElements[].events` | Custom events (`hx-*`) | Inheritance |
| `customElements[].members` (public) | Public properties and methods | Inheritance |

Breaking changes to any of these require a **major** version bump and an advance deprecation window.

### What Is Unstable (Not Covered by SemVer)

The following are implementation details. They may change in any release without a major version bump:

- Internal shadow DOM structure (DOM nodes inside the shadow root)
- Unexposed CSS class names inside shadow DOM
- Private TypeScript properties and methods (prefixed with `_` or marked `@private`)
- Internal event handler names
- Undocumented CSS custom properties not in the CEM

**Do not build on shadow DOM internals.** If you find yourself using `shadowRoot.querySelector()` or targeting unlisted CSS classes, you are building on unstable ground. File an issue requesting a named `::part()` or a slot instead.

### Contract Per Vector

| Vector | Stable Guarantee | Breaking Change Example |
| --- | --- | --- |
| CSS custom properties | All `--hx-*` in CEM | Removing `--hx-button-bg` |
| `::part()` selectors | All parts listed in CEM | Renaming `part="button"` to `part="control"` |
| Slots | All slots listed in CEM | Removing `slot="header"` |
| Public inheritance | All `public` members in CEM | Renaming `handleClick()` to `onClick()` |
| Internal DOM | **None** | Any internal restructuring |

### Reading the CEM

The generated manifest lives at `packages/hx-library/custom-elements.json`. You can also browse it per-component in the [Component Library](/component-library/overview/):

```bash
# View all CSS parts for hx-button
cat packages/hx-library/custom-elements.json | \
  jq '.modules[].declarations[] | select(.tagName == "hx-button") | .cssParts'

# View all slots for hx-dialog
cat packages/hx-library/custom-elements.json | \
  jq '.modules[].declarations[] | select(.tagName == "hx-dialog") | .slots'
```

---

## Choosing Your Strategy

Most enterprise customization falls into one of three strategies:

### Configure

Use tokens and `::part()` selectors. No new files, no build step, works directly from Twig or global CSS. The right choice for:

- Brand theming (colors, typography, spacing)
- Density adjustments (compact vs. comfortable layouts)
- Clinical UI patterns (high contrast, larger touch targets)
- Single-instance overrides in a specific page template

```css
/* Tightly-scoped clinical override */
.patient-vitals-panel hx-badge::part(label) {
  font-size: 1.125rem;
  font-weight: 700;
}
```

### Compose

Wrap HELiX components with slots in a Twig template, a Lit component, or a React component. No subclassing — just structural composition. The right choice for:

- Application-specific compound components (`PatientSummaryCard` built from `hx-card` + `hx-badge` + `hx-button`)
- Drupal paragraph types that combine multiple HELiX elements
- Design system layers that add business logic around standard components

```html
<!-- Drupal: patient-summary-card.html.twig -->
<hx-card class="patient-summary">
  <span slot="header">
    {{ patient.name }} — MRN {{ patient.mrn }}
  </span>
  <div slot="body">
    <hx-badge variant="{{ patient.status_variant }}">
      {{ patient.status_label }}
    </hx-badge>
  </div>
</hx-card>
```

### Extend

Subclass a HELiX component when you need new behavior that cannot be composed from the outside. The right choice for:

- Domain-specific interaction patterns (double-confirm buttons for destructive actions)
- New reactive properties that change rendering
- A registered custom element with your team's tag prefix (`clinical-*`, `ehr-*`)
- Accessibility enhancements beyond the base component's ARIA pattern

```typescript
// clinical-confirm-button.ts
import { HxButton } from '@helixui/library';
customElements.define('clinical-confirm-button', class extends HxButton { ... });
```

**Only extend when composing is not sufficient.** Subclasses take on maintenance responsibility for compatibility with future HELiX releases. Configure and compose whenever possible.

---

## Next Steps

- [CSS Custom Properties](/design-tokens/customization/) — Full reference for token overrides
- [CSS Parts](/components/shadow-dom/parts/) — How to use `::part()` selectors
- [Slots](/components/shadow-dom/slots/) — Slot composition patterns
- [Composition Patterns](/components/advanced/composition-patterns/) — Advanced compound component techniques
- [Release Policy](/getting-started/release-policy/) — Full semver commitment and breaking change process
