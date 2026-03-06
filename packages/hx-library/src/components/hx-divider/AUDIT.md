# Audit: `hx-divider` — Deep Audit v2

**Status:** PASS (all CRITICAL/HIGH resolved)
**Reviewed:** 2026-03-06
**Branch:** `feature/deep-audit-v2-hx-divider`
**wc-mcp Score:** 88/100 (B)
**wc-mcp Accessibility:** 0/100 (F) — CEM-level only; runtime accessibility is correct

---

## Executive Summary

The `hx-divider` component is a well-implemented presentational separator with horizontal/vertical orientation, spacing variants, and an optional slotted label. This audit identified and resolved 4 CRITICAL/HIGH issues:

1. **Added `decorative` property** — `role="presentation"` for purely visual dividers
2. **Added `line` CSS part** — enables external styling of divider lines
3. **Fixed CEM leakage** — `@internal` tags on private members
4. **Updated JSDoc** — accessibility guidance in component description

---

## Findings

### 1. Design Tokens — PASS

All CSS values use `--hx-*` tokens with hardcoded fallbacks:

| Token                          | Semantic Fallback        | Hardcoded Fallback |
| ------------------------------ | ------------------------ | ------------------ |
| `--hx-divider-color`           | `--hx-color-neutral-200` | `#e2e8f0`          |
| `--hx-divider-width`           | `--hx-border-width-thin` | `1px`              |
| `--hx-divider-label-color`     | `--hx-color-neutral-500` | `#64748b`          |
| `--hx-divider-label-font-size` | `--hx-font-size-sm`      | `0.875rem`         |
| `--hx-divider-label-gap`       | `--hx-space-3`           | `0.75rem`          |
| Spacing variants               | `--hx-space-2/4/6`       | `0.5/1/1.5rem`     |

Three-tier cascade pattern is correctly implemented with private `--_` variables.

**No hardcoded values found.** Zero token violations.

### 2. Accessibility — PASS (after fixes)

| Check                                   | Status    | Detail                                      |
| --------------------------------------- | --------- | ------------------------------------------- |
| `role="separator"`                      | PASS      | Set on base div                             |
| `aria-orientation`                      | PASS      | Reflects orientation property               |
| Decorative mode (`role="presentation"`) | **FIXED** | Added `decorative` boolean property         |
| No `aria-orientation` when decorative   | **FIXED** | Uses Lit `nothing` to omit attribute        |
| axe-core: horizontal                    | PASS      | Zero violations                             |
| axe-core: vertical                      | PASS      | Zero violations                             |
| axe-core: with label                    | PASS      | Zero violations                             |
| axe-core: decorative                    | **ADDED** | Zero violations                             |
| Not focusable                           | PASS      | Correct — dividers should not receive focus |

### 3. Functionality — PASS

| Feature                          | Status                                                |
| -------------------------------- | ----------------------------------------------------- |
| Horizontal orientation (default) | PASS                                                  |
| Vertical orientation             | PASS                                                  |
| Spacing: none/sm/md/lg           | PASS                                                  |
| Slotted label detection          | PASS — smart slot detection with `_checkSlot`         |
| Label rendering (conditional)    | PASS — only renders `label` part when content present |
| Decorative mode                  | **ADDED**                                             |

### 4. TypeScript — PASS

| Check                              | Status                                  |
| ---------------------------------- | --------------------------------------- |
| Strict mode                        | PASS                                    |
| No `any` types                     | PASS                                    |
| Union types for orientation        | PASS — `'horizontal' \| 'vertical'`     |
| Union types for spacing            | PASS — `'none' \| 'sm' \| 'md' \| 'lg'` |
| HTMLElementTagNameMap augmentation | PASS                                    |
| `@internal` on private members     | **FIXED**                               |

### 5. CSS / Shadow DOM — PASS (after fixes)

| Check                    | Status                                          |
| ------------------------ | ----------------------------------------------- |
| Shadow DOM encapsulation | PASS                                            |
| `::part(base)`           | PASS                                            |
| `::part(line)`           | **FIXED** — added to both line spans            |
| `::part(label)`          | PASS (conditional)                              |
| Vertical layout          | PASS — `inline-flex` + `flex-direction: column` |
| No style leakage         | PASS                                            |

### 6. CEM Accuracy — PASS (after fixes)

| Item                         | Status                       |
| ---------------------------- | ---------------------------- |
| Tag name                     | PASS                         |
| `orientation` property       | PASS                         |
| `spacing` property           | PASS                         |
| `decorative` property        | **ADDED**                    |
| Default slot                 | PASS                         |
| CSS custom properties (5)    | PASS                         |
| CSS parts: base, line, label | **FIXED** — `line` added     |
| Private members hidden       | **FIXED** — `@internal` tags |

### 7. Tests — PASS

**3106 total tests pass.** hx-divider test coverage:

| Category                 | Tests  | Status                            |
| ------------------------ | ------ | --------------------------------- |
| Rendering                | 4      | PASS (added `line` CSS part test) |
| Property: orientation    | 6      | PASS                              |
| Property: spacing        | 4      | PASS                              |
| Property: decorative     | 4      | **ADDED**                         |
| Label slot               | 3      | PASS                              |
| Accessibility (axe-core) | 4      | PASS (added decorative test)      |
| **Total**                | **25** | **PASS**                          |

### 8. Storybook — PASS

| Story                        | Status                |
| ---------------------------- | --------------------- |
| Default                      | PASS — with play test |
| Horizontal                   | PASS                  |
| Vertical                     | PASS                  |
| WithLabel                    | PASS — with play test |
| Decorative                   | **ADDED**             |
| SpacingVariants              | PASS                  |
| PatientRecordSections        | PASS                  |
| InlinePatientMeta            | PASS                  |
| `decorative` argType/control | **ADDED**             |

### 9. Drupal Compatibility — PASS

All properties use reflect + primitive types (string/boolean). Works in Twig:

```twig
<hx-divider></hx-divider>
<hx-divider orientation="vertical"></hx-divider>
<hx-divider decorative></hx-divider>
<hx-divider>Section Label</hx-divider>
```

No JS behaviors required. Boolean `decorative` works as presence-only attribute.

### 10. Portability — PASS

- No external dependencies beyond Lit
- CDN-ready via `@customElement` self-registration
- Single file import: `import './hx-divider.js'`

---

## Changes Made

| File                    | Change                                                                     | Severity Fixed |
| ----------------------- | -------------------------------------------------------------------------- | -------------- |
| `hx-divider.ts`         | Added `decorative` property with `role="presentation"` / `nothing` pattern | CRITICAL       |
| `hx-divider.ts`         | Added `part="line"` to both line spans                                     | HIGH           |
| `hx-divider.ts`         | Added `@internal` JSDoc tags to private members                            | HIGH           |
| `hx-divider.ts`         | Updated component JSDoc with accessibility guidance and `@csspart line`    | MEDIUM         |
| `hx-divider.test.ts`    | Added 5 new tests (decorative property + line CSS part)                    | CRITICAL       |
| `hx-divider.stories.ts` | Added `Decorative` story + `decorative` argType                            | MEDIUM         |

---

## Remaining Items (LOW — no action required)

| Item                                                                               | Severity | Note                                                                     |
| ---------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| wc-mcp accessibility score 0/F                                                     | LOW      | CEM analyzer doesn't detect runtime ARIA from templates — false negative |
| `line-height` uses `--hx-line-height-tight` without component-level override token | LOW      | Acceptable — label line-height rarely needs override                     |
| No `@media (prefers-reduced-motion)`                                               | N/A      | Component has no animations or transitions                               |

---

## Verification

- **TypeScript:** `npm run type-check` — 0 errors
- **Tests:** `npm run test:library` — 3106 passed (0 failed)
- **axe-core:** 4 divider accessibility tests pass (horizontal, vertical, label, decorative)
