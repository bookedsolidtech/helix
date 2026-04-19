# Upgrading to HELiX 3.0.0

This guide walks through every breaking change between `@helixui/library@2.1.2` and `@helixui/library@3.0.0`. The same content is mirrored in Starlight at [`/docs/migration/3.0.0`](../apps/docs/src/content/docs/migration/3.0.0.mdx).

**Audience.** Application teams upgrading a production HELiX integration. The changes are surgical — most are renames with grep-able patterns. Plan for one engineer for a half day on a mid-sized app (~200 HELiX usages), or a few hours on a small app. Codemod support is tracked for 3.0.1 — see [Codemod availability](#codemod-availability) below.

**Scope.** This guide covers `@helixui/library`. The `@helixui/tokens` and `@helixui/react` packages also bump to 3.0.0 in lockstep; changes are summarized at the end.

---

## Pre-upgrade checklist

Before upgrading:

1. Pin current versions in a branch so you can diff. `git checkout -b chore/helix-3-upgrade`.
2. Run your full test suite on 2.1.2 to capture a green baseline.
3. Confirm your integration does not import from undocumented deep paths. Grep for `@helixui/library/src/` or `@helixui/library/internal` — anything found will break (see [Public-API allowlist](#public-api-allowlist)).
4. Confirm your consumer bundles or copies `ensureDocumentTokens` (auto-invoked on first component import). If your build strips `sideEffects`, fix that before upgrading (see [Adopted stylesheets](#adopted-stylesheets-side-effect)).

---

## 1. Install

```bash
pnpm add @helixui/library@^3.0.0 @helixui/tokens@^3.0.0
# or
npm install @helixui/library@^3.0.0 @helixui/tokens@^3.0.0
```

Consumers using the React wrapper:

```bash
pnpm add @helixui/react@^3.0.0
```

CDN consumers: pin `https://unpkg.com/@helixui/library@3.0.0/dist/cdn/helix-core-3.0.0.min.js` and the per-component modules you use (see [CDN delivery](#12-cdn-delivery)).

---

## 2. `aria-label` → `accessible-label`

Every component that previously accepted `aria-label` or `hxAriaLabel` now exposes the public attribute as `accessible-label` (property: `accessibleLabel`). The shadow-DOM forwarding of the label onto the ARIA target (via `ElementInternals` or template binding) is unchanged — this is a naming change only.

**Why.** ARIA 1.2 defines `aria-*` attributes as host-scoped global ARIA state, not authored component API. Custom elements that repurpose `aria-label` as a *component prop* conflate the two. `accessible-label` makes the intent explicit: "this is the public label surface for the component; the component forwards it to the correct internal node."

**Find-and-replace:**

```diff
- <hx-button aria-label="Close dialog">×</hx-button>
+ <hx-button accessible-label="Close dialog">×</hx-button>
```

```diff
- <hx-icon-button hxAriaLabel="Close"></hx-icon-button>
+ <hx-icon-button accessible-label="Close"></hx-icon-button>
```

**TypeScript:**

```diff
- el.hxAriaLabel = 'Close dialog';
+ el.accessibleLabel = 'Close dialog';
```

**Regex for codemod:**

- Attribute form: `/(\s)(hxAriaLabel|aria-label)=/g` → `$1accessible-label=` *(inside HELiX component tags only — do not rewrite `aria-label` on native HTML elements)*
- Property form: `/\.hxAriaLabel\b/g` → `.accessibleLabel`

Components affected: `hx-button`, `hx-icon-button`, `hx-badge`, `hx-chip`, `hx-copy-button`, `hx-file-upload`, `hx-link`, `hx-menu-item`, `hx-nav-item`, `hx-overflow-menu`, `hx-side-nav`, `hx-split-button`, `hx-step`, `hx-toggle`, `hx-tooltip` (full list in CEM).

**Exception — `hx-card`:** Interactive card accessible names use `hx-label` (HTML attribute) / `label` (JS property), not `accessible-label`. If you were using the deprecated `hxAriaLabel` property on `hx-card`, migrate:

```diff
- <hx-card hxAriaLabel="View patient record">...</hx-card>
+ <hx-card hx-label="View patient record">...</hx-card>
```

```diff
- el.hxAriaLabel = 'View patient record';
+ el.label = 'View patient record';
```

---

## 3. `::part(error-message)` → `::part(error)`

Every form control renames the validation-message CSS part from `error-message` to `error`. Help-text styling (`::part(help-text)`) is unchanged — the rename brings the two into symmetry (`help-text` / `error`).

**Find-and-replace:**

```diff
- hx-text-input::part(error-message) { color: var(--my-error); }
+ hx-text-input::part(error) { color: var(--my-error); }
```

**Regex for codemod:** `/::part\(error-message\)/g` → `::part(error)`.

Components affected: `hx-checkbox`, `hx-checkbox-group`, `hx-combobox`, `hx-date-picker`, `hx-field`, `hx-file-upload`, `hx-number-input`, `hx-radio-group`, `hx-select`, `hx-switch`, `hx-text-input`, `hx-textarea`, `hx-time-picker`.

---

## 4. `hx-date-picker` / `hx-time-picker` non-modal dialog

The calendar / clock popup on `hx-date-picker` and `hx-time-picker` migrates from a native modal `<dialog>` (opened with `.showModal()`) to a non-modal popup (opened with `.show()`). This removes the top-layer stacking and backdrop trap that conflicted with form-inline and drawer-embedded usage.

**What changes:**

- The popup no longer sits in the browser top layer. If your app manages stacking contexts manually, you may need to raise the popup's `z-index`.
- The backdrop element (`::backdrop`) is gone. If you were styling it, remove those rules.
- Focus is not trapped inside the popup — Tab from the last focusable element moves to the next document-flow focusable. Tests that asserted focus trap behavior must be updated.
- Escape still closes the popup and restores focus to the trigger.
- Click-outside still closes the popup.
- Arrow-key navigation inside the calendar/clock is unchanged.

**Find-and-replace (CSS):**

```diff
- hx-date-picker::part(dialog)::backdrop { background: rgba(0,0,0,0.5); }
+ /* removed — non-modal dialog has no backdrop */
```

**Test updates:** Any test asserting `document.activeElement` stays inside the popup after a Tab past the last control must be updated — the popup no longer traps focus. Escape-close and focus-restoration tests should continue to pass.

---

## 5. `hx-dialog` — `modal` property defaults to `false`

> **HIGH impact — silent behavior change.** No type error, no runtime warning. The dialog just behaves differently.

The `modal` property on `hx-dialog` now defaults to `false`, aligning with HTML boolean-attribute semantics (attribute absent = property `false`). In 2.x, `<hx-dialog open>` without an explicit `modal` attribute rendered in the top layer with a backdrop and a focus trap. In 3.0.0 the same markup renders as a non-modal dialog in document flow.

**Before (2.x):**

```html
<!-- Rendered as modal by default: top-layer, backdrop, focus trapped -->
<hx-dialog open>
  <p>Are you sure?</p>
</hx-dialog>
```

**After (3.0.0):**

```html
<!-- Non-modal — inline in document flow, no backdrop, no focus trap -->
<hx-dialog open>
  <p>Are you sure?</p>
</hx-dialog>

<!-- To preserve 2.x modal behavior, add `modal` explicitly -->
<hx-dialog open modal>
  <p>Are you sure?</p>
</hx-dialog>
```

**Find instances missing the attribute:**

```bash
# HTML / TSX / Vue templates (requires ripgrep with PCRE2 support)
rg -P '<hx-dialog\b(?![^>]*\bmodal\b)' -g '*.html' -g '*.tsx' -g '*.vue'

# Drupal / Twig templates
rg -P '<hx-dialog\b(?![^>]*\bmodal\b)' -g '*.twig' -g '*.html.twig'
```

**Audit each hit.** If the dialog was intended to be modal (confirmation dialogs, clinical alerts, blocking workflows), add `modal`. If it was intended to be non-modal (inline drawers, sidebar panels, toast-adjacent UIs), leave as-is.

---

## 6. `hx-phi-field` — PHI set via JS property, never as an HTML attribute

> **Positive security change — HIPAA hardening.** Most consumers benefit silently.

`hx-phi-field` holds Protected Health Information via the `data` JS property. The property is declared with `@property({ attribute: false })`, so Lit does not observe a `data` HTML attribute. If raw HTML markup sets `<hx-phi-field data="...">`, the component's `connectedCallback` detects the attribute, rescues the value into the `data` property, emits a `console.warn`, and removes the attribute from the DOM so PHI is not retained in `outerHTML`, DevTools, or SSR snapshots.

**The supported pattern — set `data` via JS:**

```html
<hx-phi-field id="mrn" field-id="patient-mrn" field-type="mrn"></hx-phi-field>
```

```typescript
const el = document.querySelector('hx-phi-field#mrn');
el.data = '123-45-6789';
```

**The unsupported pattern — setting via HTML attribute:**

```html
<!-- Do not do this. The component warns and strips the attribute at runtime,
     but the raw value is briefly present in the HTML source (SSR, view-source). -->
<hx-phi-field data="123-45-6789"></hx-phi-field>
```

**Consumer impact.** Consumers that already set PHI via the `data` property are unaffected. Consumers setting PHI via the HTML attribute must move the assignment to JavaScript.

**Why this change ships in 3.0.0.** HIPAA-aligned deployments (clinical records, patient portals) must not expose PHI through DOM serialization. The prior permissive attribute behavior was a latent exposure vector surfaced during the Figgy (Northwell) integration audit.

---

## 7. FormMixin consolidation

All 15 form-associated components now compose `FormMixin(HelixElement)`. If you subclass a HELiX form component, the mixin's interaction-state tracking is inherited automatically.

**What you inherit for free:**

- `dirty: boolean` — true after the first value mutation
- `touched: boolean` — true after the first blur
- `pristine: boolean` — opposite of `dirty`
- `checkValidity() / reportValidity()` — delegate to `ElementInternals`
- `_updateValidity()` — override hook called after every `updated()` cycle

**Subclassing example:**

```ts
import { HelixElement, FormMixin } from '@helixui/library';

class MyCustomInput extends FormMixin(HelixElement) {
  static override formAssociated = true;

  override _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        'This field is required',
        this._inputEl,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  override _onFormReset(): void {
    this.value = '';
    this._resetInteractionState();
    this._internals.setFormValue('');
  }
}
```

**If you previously implemented `dirty` / `touched` locally:** delete your implementation and rely on the inherited getters. Wire your native input's `input` event to call `this._handleInteractionInput()` and the `blur` event to `this._handleInteractionBlur()`.

---

## 8. Subclassing contract — `@protected` override hooks

HelixElement and FormMixin override hooks are now officially part of the public subclassing contract (previously tagged `@internal`). Breaking changes to their signatures will be gated to major releases.

Stable hooks:

| Base class / mixin | Hook | When called |
| --- | --- | --- |
| `HelixElement` | `_onFormDisabled(disabled)` | Parent `<fieldset>` disabled toggled |
| `HelixElement` | `_onFormReset()` | Owning form reset |
| `HelixElement` | `_onFormStateRestore(state, mode)` | Form state restore (bfcache / autofill) |
| `FormMixin` | `_handleInteractionInput()` | Call from native `input` event |
| `FormMixin` | `_handleInteractionBlur()` | Call from native `blur` event |
| `FormMixin` | `_resetInteractionState()` | Call from `_onFormReset()` |
| `FormMixin` | `_updateValidity()` | Override for constraint logic |

No code change required for consumers using these hooks in 2.1.x — the access modifier (`protected`) was already in place. The 3.0.0 change promotes them from internal to contract-level stability.

---

## 9. Deprecated symbols removed

### `Wc*` type aliases

All `Wc*` type aliases (carried over from the pre-rename era) are removed. Use the `Hx*` equivalents.

```diff
- import type { WcButton, WcCard, WcSwitch } from '@helixui/library';
+ import type { HxButton, HxCard, HxSwitch } from '@helixui/library';
```

Full list: `WcButton`, `WcCard`, `WcSwitch`, `WcTextInput`, `WcSelect`, `WcCombobox`, `WcCheckbox`, `WcRadio`, `WcDatePicker`, `WcTimePicker`, `WcNumberInput`, `WcSlider`, `WcFileUpload`, `WcColorPicker`, `WcField`, `WcPhiField`, `WcDialog`, `WcDrawer`, `WcToast`, `WcBanner`, `WcChip`, `WcBadge`, `WcBreadcrumb`, `WcCarousel`, `WcSplitButton`, `WcOverflowMenu`, `WcAccordion`, `WcTable`, `WcDataTable`, `WcTabs`, `WcPagination`, `WcRating`, `WcPatientBanner`, `WcClinicalStatus`, `WcTopNav`, `WcSideNav`, `WcStep`, `WcSteps`, `WcNavItem`, `WcTreeItem`, `WcPopover`, `WcTooltip`, `WcMeter`, `WcCounter`, `WcList`, `WcStructuredList`, `WcFormMixin`, `WcHelixElement`.

### 2.0.0 property-rename shims

The compatibility shims that preserved the pre-2.0 property names were removed in 3.0.0. Update to the renamed properties if you haven't already.

| Component | Removed (deprecated in 2.0) | Use |
| --- | --- | --- |
| `hx-card` | `hxHref` | `href` |
| `hx-card` | `hxAriaLabel` | `label` |
| `hx-field` | `hxSize` | `size` |
| `hx-banner` | `closeLabel` | `labelClose` |
| `hx-dialog` | `closeLabel` | `labelClose` |
| `hx-drawer` | `closeLabel` | `labelClose` |
| `hx-toast` | `closeLabel` | `labelClose` |
| `hx-split-button` | `triggerLabel` | `labelTrigger` |
| `hx-split-button` | `menuLabel` | `labelMenu` |
| `hx-overflow-menu` | `menuLabel` | `labelMenu` |

### `mergeTokenStyles` utility

`mergeTokenStyles` is removed. Tokens adopt at the document level via `ensureDocumentTokens()`, which is auto-invoked on first component import. Per-component merging is no longer required or supported.

```diff
- import { mergeTokenStyles } from '@helixui/library/utilities';
- static styles = mergeTokenStyles(ownStyles);
+ // No import or merge needed — tokens adopt at document level automatically.
+ static styles = ownStyles;
```

### Legacy `sticky` / `system` properties

Deprecated component variants' `sticky` and `system` properties (and their tests) are removed. Consumers should not have been using these — they were marked deprecated in 2.0.0.

---

## 10. `@floating-ui/dom` dynamic import

Components that use `@floating-ui/dom` for positioning (`hx-select`, `hx-combobox`, `hx-popover`, `hx-tooltip`, `hx-overflow-menu`) now load the library dynamically on first interaction. The core bundle drops the dependency.

**What you'll see:**

- A separate `chunk-floating-ui-*.js` in your build output.
- First click/hover/focus on one of the affected components triggers a chunk fetch (~12KB min+gz).
- Subsequent interactions use the cached chunk — no additional network cost.

**If your app has strict CSP:** ensure your `script-src` policy allows the chunk origin. For most consumers this is a no-op — the chunk serves from the same origin as the core bundle.

**If you pre-warm chunks:** you can pre-warm the floating-ui peer dependency at app startup by importing it directly:

```ts
import '@floating-ui/dom';
```

---

## 11. Public-API allowlist

3.0.0 introduces a public-API allowlist that blocks undocumented deep imports from leaking through `@helixui/library`. The public surface is the root barrel (`@helixui/library`) and the per-component entry points (`@helixui/library/components/<hx-name>`). There is no `@helixui/library/mixins` subpath export — `FocusMixin`, `FormMixin`, `HelixElement`, and `HelixAuditController` are all re-exported from the root barrel. Consumers importing from anything else will see a build-time error.

**Find-and-replace:**

```diff
- import { _internalHelper } from '@helixui/library/src/internal/helper.js';
+ // Not supported. Copy the helper locally, or open an issue to request public export.
```

If you were relying on an undocumented deep import, open an issue at [bookedsolidtech/helix](https://github.com/bookedsolidtech/helix/issues) with your use case. We can promote the symbol to the public surface in a minor release.

---

## 12. CDN delivery

The CDN build ships two strategies. 3.0.0 makes **Strategy B** the recommended path.

### Strategy B (recommended) — core + per-component

```html
<!-- Load core once (~8.4KB min+gz). Mounts the element registry. -->
<script type="module" src="https://unpkg.com/@helixui/library@3.0.0/dist/cdn/helix-core-3.0.0.min.js"></script>

<!-- Load only the components you use. -->
<script type="module" src="https://unpkg.com/@helixui/library@3.0.0/dist/cdn/components/hx-button-3.0.0.js"></script>
<script type="module" src="https://unpkg.com/@helixui/library@3.0.0/dist/cdn/components/hx-card-3.0.0.js"></script>
```

### Strategy A (kitchen-sink — back-compat only)

```html
<!-- Single bundle with everything. Larger payload, not recommended. -->
<script type="module" src="https://unpkg.com/@helixui/library@3.0.0/dist/cdn/helix-3.0.0.min.js"></script>
```

Strategy A is preserved in 3.0.0 for back-compat. It may be removed in a future major.

---

## 13. Adopted stylesheets side effect

HELiX design tokens adopt at the document level via `document.adoptedStyleSheets` on first import of any component. This is the only supported theming path.

Do not strip the side effect:

- `package.json` `sideEffects` must remain `true` (or include the token-adoption module).
- Module bundlers with aggressive dead-code elimination must be configured to preserve the first-import side effect.
- CDN consumers automatically get the adoption — it runs on the first `import` of any component module.

If your build tooling strips side effects, your HELiX components will render with missing design tokens (no colors, no spacing, no typography). The fix is always at the bundler config level; consumers should not manually call `ensureDocumentTokens()`.

---

## 14. Tokens package — `@helixui/tokens@3.0.0`

The tokens package bumps to 3.0.0 in lockstep with the library. Breaking changes:

- `tokenStyles` export (deprecated in 2.1.2) is removed. Use `lightTokenCss` for raw CSS or rely on the library's automatic document-level adoption.
- Semantic-tier token alignment (see [Design token delta](../packages/hx-library/CHANGELOG.md#design-token-delta) in the CHANGELOG). Consumers overriding at the semantic tier should audit their overrides.

---

## 15. React wrapper — `@helixui/react@3.0.0`

The React wrapper bumps to 3.0.0 to match. Breaking changes are mechanical — all wrapper props rename in parallel with the underlying component:

- `ariaLabel` prop → `accessibleLabel` prop (everywhere).
- `Wc*` type imports removed from `@helixui/react` — use `Hx*`.
- Event detail interfaces now exported as named types (`HxClickEvent`, `HxChangeEvent`, etc.) instead of anonymous `CustomEvent<unknown>`.

---

## Codemod availability

A grep-based codemod is tracked as a 3.0.1 follow-up. For 3.0.0, the find-and-replace patterns listed in each section are precise enough to run manually or via `sd` / `ripgrep-replace`:

```bash
# aria-label → accessible-label on HELiX component tags (excludes hx-card, which uses label=)
rg -P -l '<hx-(?!card\b)[a-z-]+[^>]*aria-label=' | xargs sd '(<hx-(?!card\b)[a-z-]+[^>]*?)aria-label=' '$1accessible-label='

# ::part(error-message) → ::part(error)
rg -l '::part\(error-message\)' | xargs sd '::part\(error-message\)' '::part(error)'

# Wc* type imports → Hx*
rg -l "from '@helixui/library'" | xargs sd "\bWc([A-Z][a-zA-Z]+)\b" 'Hx$1'
```

Run your test suite after each replacement.

---

## Rollback

If 3.0.0 surfaces a critical defect in your app, pin back to 2.1.2:

```bash
pnpm add @helixui/library@2.1.2 @helixui/tokens@2.1.2
```

Report the issue at [bookedsolidtech/helix/issues](https://github.com/bookedsolidtech/helix/issues) with a minimal reproduction. HELiX maintains the 2.1.x line with security-only patches for six months post-3.0.0 release.

---

## Getting help

- Migration questions: open an issue at [bookedsolidtech/helix](https://github.com/bookedsolidtech/helix/issues) tagged `migration-3.0`.
- CEM / API reference: [helix.bst.dev/api](https://helix.bst.dev/api) (Starlight auto-docs from CEM).
- Subclassing contract: [`packages/hx-library/src/base/helix-element.ts`](../packages/hx-library/src/base/helix-element.ts) and [`packages/hx-library/src/mixins/FormMixin.ts`](../packages/hx-library/src/mixins/FormMixin.ts).
