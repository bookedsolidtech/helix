# Browser Compatibility — @helixui/library

## Supported Browsers

| Browser | Engine | Min Version | Support Level |
|---------|--------|-------------|---------------|
| Chrome | Blink/V8 | 120+ | Full support |
| Edge | Blink/V8 | 120+ | Full support |
| Firefox | Gecko/SpiderMonkey | 120+ | Full support |
| Safari | WebKit | 17+ | Full support |
| Safari iOS | WebKit | 17+ | Full support |
| Chrome Android | Blink/V8 | 120+ | Full support |

All components require browsers that support:
- Custom Elements v1
- Shadow DOM v1
- CSS Custom Properties (CSS Variables)
- ElementInternals (for form-associated components)
- CSS `::part()` pseudo-element

---

## Test Matrix

### Automated Cross-Browser Tests

The library runs its full Vitest test suite across three browser engines:

| Engine | Browser | Test Runner | CI Job |
|--------|---------|------------|--------|
| Blink | Chromium (Playwright) | Primary CI + cross-browser | `test` (ci.yml), `cross-browser` |
| Gecko | Firefox (Playwright) | Cross-browser only | `cross-browser` (cross-browser.yml) |
| WebKit | WebKit (Playwright) | Cross-browser only | `cross-browser` (cross-browser.yml) |

### Running Cross-Browser Tests Locally

```bash
# From packages/hx-library
pnpm run test:cross-browser

# Specific browser only (via env override)
BROWSER=firefox pnpm run test:cross-browser
BROWSER=webkit pnpm run test:cross-browser
```

---

## Keyboard Navigation Support

All interactive components support keyboard navigation across browsers:

| Component | Tab | Enter/Space | Arrow Keys | Escape |
|-----------|-----|-------------|------------|--------|
| `hx-button` | Focus | Activate | — | — |
| `hx-text-input` | Focus | — | — | — |
| `hx-checkbox` | Focus | Toggle | — | — |
| `hx-radio-group` | Focus group | — | Navigate options | — |
| `hx-select` | Focus | Open/select | Navigate options | Close |
| `hx-accordion` | Navigate items | Open/close | — | — |
| `hx-tabs` | — | Activate | Navigate tabs | — |
| `hx-dialog` | Cycle within (trap) | — | — | Close |
| `hx-drawer` | Cycle within (trap) | — | — | Close |
| `hx-dropdown` | Focus trigger | Open/select | Navigate options | Close |
| `hx-combobox` | Focus input | Select | Navigate options | Close/clear |
| `hx-menu` | Navigate items | Activate item | Navigate items | Close |
| `hx-date-picker` | Navigate | Select | Navigate calendar | Close |
| `hx-badge` (removable) | Focus remove btn | Remove | — | — |
| `hx-icon-button` | Focus | Activate | — | — |

### Display-Only Components (No Keyboard Interaction Required)

These components are not interactive and do not require keyboard navigation tests:

- `hx-avatar` — visual display only
- `hx-badge` (non-removable) — status indicator
- `hx-breadcrumb` — navigation (relies on native `<a>` elements)
- `hx-card` (non-interactive) — container
- `hx-divider` — visual separator
- `hx-progress` — status indicator
- `hx-spinner` — loading indicator
- `hx-help-text` — static text
- `hx-icon` — visual element

---

## CSS Custom Properties (Design Tokens)

All components use CSS custom properties with the `--hx-` prefix. These work consistently across all supported browsers via the native CSS custom property cascade.

Shadow DOM `::part()` pseudo-element is used for external styling. Supported in all modern browsers (Chrome 73+, Firefox 72+, Safari 13.1+).

---

## Known Browser-Specific Behaviors

### ElementInternals

- **Safari < 16.4**: `ElementInternals.setValidity()` with anchor element parameter may not be fully supported. Components fall back to standard validity without anchor.
- **Workaround**: The `FormMixin` detects support and degrades gracefully.

### CSS Shadow Parts (`::part()`)

- **All supported browsers**: Full support. No known issues.

### Focus Delegation (`delegatesFocus: true`)

- **All supported browsers**: Full support in Chrome 83+, Firefox 94+, Safari 15.4+.
- **Impact**: Components using `delegatesFocus` (e.g., `hx-button`, `hx-text-input`) forward focus to the inner native element, enabling correct `:focus-visible` behavior.

### `aria-live` Regions in Shadow DOM

- **JAWS + Chrome**: Best support with `role="status"` / `role="alert"` on the host element.
- **NVDA + Firefox**: Live regions inside Shadow DOM may have reduced announcement reliability. Components use a Sr-only announcer element pattern to improve compatibility.
- **VoiceOver + Safari**: Generally reliable with current WebKit.

### Adopted Stylesheets (`adoptedStyleSheets`)

- **All supported browsers**: Full support. Used internally by Lit for Shadow DOM style injection.

### Pointer Events

- **Touch targets**: All interactive elements meet the 44×44px minimum touch target size (WCAG 2.5.5 recommended).

---

## Testing Approach for Browser-Specific Issues

When a cross-browser test reveals rendering differences:

1. **Document the behavior** in this file under "Known Browser-Specific Behaviors"
2. **Create browser-specific assertions** using the `browser` context from `@vitest/browser/context`:

```typescript
import { page } from '@vitest/browser/context';

it('handles focus correctly across browsers', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  // Behavior is consistent — test normally
  const btn = shadowQuery(el, 'button')!;
  btn.focus();
  expect(document.activeElement).toBe(el); // delegatesFocus active
});
```

3. **File a follow-up issue** if a cross-browser failure is a genuine browser bug rather than a test issue.

---

## CI Workflow

Cross-browser tests run automatically:

- **Weekly** (Monday 06:00 UTC) — full suite across all three browsers
- **On push to main/staging** — post-merge validation
- **On manual trigger** — via GitHub Actions workflow dispatch, with optional component filter

Results are uploaded as per-browser artifacts: `cross-browser-results-{browser}`.

To view results: GitHub Actions → Cross-Browser Tests → Artifacts.
