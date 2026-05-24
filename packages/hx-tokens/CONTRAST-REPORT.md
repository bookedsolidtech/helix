# WCAG Contrast Report — `@helixui/tokens`

_Generated 2026-05-22T12:42:56.795Z from `@helixui/tokens@3.9.1`._

Per-mode pass/fail telemetry for every semantically valid `(text × surface)` pair declared in the contrast matrix. **AA is the published gate** (enforced by `contrast.test.ts`); **AAA is informational** and surfaces here so consumers and auditors can see the actual ceiling each pairing reaches.

Thresholds (WCAG 2.1, **role-aware**):

- `body` — body text, prose, inline links, **button labels, badge labels, status callouts**: AA ≥ 4.5:1 (1.4.3), **AAA ≥ 7.0:1** (1.4.6). 16px semibold does NOT qualify for the large-text carve-out under WCAG 2.1 1.4.6 (which requires 24px regular OR 18.66px weight-700 bold).
- `large` — explicitly large headings or display copy at ≥24px regular / ≥18.66px true-bold (CSS weight ≥700): AA ≥ 3.0:1, **AAA ≥ 4.5:1** (1.4.6 large-text branch). This codebase intentionally has no pairs in this tier today.
- `ui` — focus rings, borders, status fills, non-text indicators: AA ≥ 3.0:1 (1.4.11), **AAA ≥ 3.0:1** (1.4.6 has no AAA tier above 1.4.11 for non-text)

Legend: ✅ AAA pass · ⚠️ AA pass (sub-AAA) · ❌ sub-AA (gate failure). The `Role` column documents the WCAG carve-out applied to each pair; the `AAA min` column shows the role-specific AAA threshold the pair was scored against.

## Aggregate

**Across all three modes:** 114 of 160 pair-instances AAA-pass · 46 AA-only · 0 sub-AA

## Light Mode

**Summary:** 37 of 58 pairs AAA-pass · 21 AA-only · 0 sub-AA

| Status | Role | Text token | Surface token | Ratio | AAA min | AA | AAA |
|---|---|---|---|---:|---:|:---:|:---:|
| ✅ | body | `text-primary` | `surface-default` | 17.88:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-primary` | `surface-raised` | 16.69:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-primary` | `surface-sunken` | 15.27:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-strong` | `surface-default` | 14.32:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-strong` | `surface-raised` | 13.37:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-secondary` | `surface-default` | 10.93:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-secondary` | `surface-raised` | 10.20:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-muted` | `surface-default` | 10.93:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-muted` | `surface-raised` | 10.20:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-placeholder` | `surface-default` | 4.63:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-placeholder` | `surface-raised` | 4.32:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-inverse` | `surface-inverse` | 17.88:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-secondary` | `secondary-500` | 5.18:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-success` | `success-500` | 5.29:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-warning` | `warning-500` | 4.83:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-error` | `error-500` | 4.56:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-info` | `info-500` | 5.03:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `neutral-0` | `primary-600` | 5.82:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `neutral-0` | `primary-700` | 7.03:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `neutral-0` | `secondary-600` | 6.13:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `neutral-0` | `secondary-700` | 7.07:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `neutral-0` | `success-600` | 4.42:1 | 3.0:1 | ✅ | ✅ |
| ⚠️ | body | `neutral-0` | `success-700` | 6.88:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | ui | `neutral-0` | `warning-600` | 4.28:1 | 3.0:1 | ✅ | ✅ |
| ✅ | body | `neutral-0` | `warning-700` | 7.51:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `neutral-0` | `error-600` | 5.46:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `neutral-0` | `error-700` | 7.96:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `neutral-0` | `info-600` | 4.92:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `neutral-0` | `info-700` | 7.26:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-primary-strong` | `action-primary-bg-hover` | 10.19:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-primary-strong` | `action-primary-bg-active` | 13.85:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-error-strong` | `action-danger-bg-hover` | 5.46:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-on-error-strong` | `action-danger-bg-active` | 7.96:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `action-primary-bg-inverted-hover` | `surface-inverse` | 7.27:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-danger-bg-inverted-hover` | `surface-inverse` | 6.58:1 | 3.0:1 | ✅ | ✅ |
| ✅ | body | `neutral-900` | `action-primary-bg-inverted-hover` | 7.27:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-error` | `action-danger-bg-inverted-hover` | 6.58:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-on-primary` | `action-primary-bg` | 7.03:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-error` | `action-danger-bg` | 4.56:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `action-secondary-fg` | `surface-default` | 7.03:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `action-secondary-fg` | `action-secondary-bg-hover` | 6.47:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `action-ghost-fg` | `surface-default` | 7.03:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `action-ghost-fg` | `action-ghost-bg-hover` | 6.47:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | ui | `action-secondary-border` | `surface-default` | 7.03:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-secondary-border` | `action-secondary-bg-hover` | 6.47:1 | 3.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-success-strong` | `surface-success-strong` | 6.88:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-warning` | `surface-warning-strong` | 4.83:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-error-strong` | `surface-danger-strong` | 5.46:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-primary-strong` | `surface-info-strong` | 5.82:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-link` | `surface-default` | 7.03:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-hover` | `surface-default` | 10.19:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-visited` | `surface-default` | 7.07:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-active` | `surface-default` | 13.85:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `error-text` | `surface-default` | 7.96:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `success-text` | `surface-default` | 10.00:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `focus-ring` | `surface-default` | 5.82:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-primary-bg-inverted-rest` | `surface-inverse` | 5.20:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `border-strong` | `surface-default` | 4.63:1 | 3.0:1 | ✅ | ✅ |

## Dark Mode

**Summary:** 33 of 57 pairs AAA-pass · 24 AA-only · 0 sub-AA

| Status | Role | Text token | Surface token | Ratio | AAA min | AA | AAA |
|---|---|---|---|---:|---:|:---:|:---:|
| ✅ | body | `text-primary` | `surface-default` | 15.27:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-primary` | `surface-raised` | 12.24:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-primary` | `surface-sunken` | 17.22:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-strong` | `surface-default` | 16.69:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-strong` | `surface-raised` | 13.37:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-secondary` | `surface-default` | 9.49:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-secondary` | `surface-raised` | 7.60:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-muted` | `surface-default` | 6.27:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-muted` | `surface-raised` | 5.02:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-placeholder` | `surface-default` | 6.27:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-placeholder` | `surface-raised` | 5.02:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-inverse` | `surface-inverse` | 15.27:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-secondary` | `secondary-500` | 5.18:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-success` | `success-500` | 5.29:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-warning` | `warning-500` | 4.83:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-error` | `error-500` | 4.56:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-info` | `info-500` | 5.03:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `neutral-0` | `primary-600` | 5.82:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `neutral-0` | `primary-700` | 7.03:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `neutral-0` | `secondary-600` | 6.13:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `neutral-0` | `secondary-700` | 7.07:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `neutral-0` | `success-600` | 4.42:1 | 3.0:1 | ✅ | ✅ |
| ⚠️ | body | `neutral-0` | `success-700` | 6.88:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | ui | `neutral-0` | `warning-600` | 4.28:1 | 3.0:1 | ✅ | ✅ |
| ✅ | body | `neutral-0` | `warning-700` | 7.51:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `neutral-0` | `error-600` | 5.46:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `neutral-0` | `error-700` | 7.96:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `neutral-0` | `info-600` | 4.92:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `neutral-0` | `info-700` | 7.26:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-primary-strong` | `action-primary-bg-hover` | 10.19:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-primary-strong` | `action-primary-bg-active` | 13.85:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-error-strong` | `action-danger-bg-hover` | 5.46:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-on-error-strong` | `action-danger-bg-active` | 7.96:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `neutral-900` | `action-primary-bg-inverted-hover` | 7.27:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-error` | `action-danger-bg-inverted-hover` | 6.58:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-on-primary` | `action-primary-bg` | 7.03:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-error` | `action-danger-bg` | 4.56:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `action-secondary-fg` | `surface-default` | 7.27:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `action-secondary-fg` | `action-secondary-bg-hover` | 5.63:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `action-ghost-fg` | `surface-default` | 7.27:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `action-ghost-fg` | `action-ghost-bg-hover` | 5.63:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | ui | `action-secondary-border` | `surface-default` | 7.27:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-secondary-border` | `action-secondary-bg-hover` | 5.63:1 | 3.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-success-strong` | `surface-success-strong` | 6.88:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-warning` | `surface-warning-strong` | 4.83:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-error-strong` | `surface-danger-strong` | 5.46:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `text-on-primary-strong` | `surface-info-strong` | 5.82:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-link` | `surface-default` | 7.27:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-hover` | `surface-default` | 10.15:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-visited` | `surface-default` | 7.31:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-active` | `surface-default` | 12.77:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `text-disabled` | `surface-default` | 3.86:1 | 3.0:1 | ✅ | ✅ |
| ⚠️ | body | `error-text` | `surface-default` | 6.58:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `success-text` | `surface-default` | 7.41:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `focus-ring` | `surface-default` | 7.27:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-primary-bg-inverted-rest` | `surface-inverse` | 4.97:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `border-strong` | `surface-default` | 6.27:1 | 3.0:1 | ✅ | ✅ |

## High-Contrast Mode

**Summary:** 44 of 45 pairs AAA-pass · 1 AA-only · 0 sub-AA

| Status | Role | Text token | Surface token | Ratio | AAA min | AA | AAA |
|---|---|---|---|---:|---:|:---:|:---:|
| ✅ | body | `text-primary` | `surface-default` | 21.00:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-primary` | `surface-raised` | 17.40:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-primary` | `surface-sunken` | 21.00:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-strong` | `surface-default` | 21.00:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-strong` | `surface-raised` | 17.40:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-secondary` | `surface-default` | 21.00:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-secondary` | `surface-raised` | 17.40:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-muted` | `surface-default` | 15.91:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-muted` | `surface-raised` | 13.18:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-placeholder` | `surface-default` | 9.68:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-placeholder` | `surface-raised` | 8.03:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-inverse` | `surface-inverse` | 21.00:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-secondary` | `secondary-500` | 11.62:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-success` | `success-500` | 12.05:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-warning` | `warning-500` | 12.58:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-error` | `error-500` | 7.59:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-info` | `info-500` | 9.80:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-primary` | `primary-600` | 8.26:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-secondary` | `secondary-600` | 14.49:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-success` | `success-600` | 14.96:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-warning` | `warning-600` | 14.56:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-error` | `error-600` | 11.06:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-info` | `info-600` | 12.60:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-primary-strong` | `action-primary-bg-hover` | 8.26:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-primary-strong` | `action-primary-bg-active` | 11.65:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-error-strong` | `action-danger-bg-hover` | 11.06:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-error-strong` | `action-danger-bg-active` | 7.59:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-primary` | `action-primary-bg` | 11.65:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-error` | `action-danger-bg` | 7.59:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `action-secondary-fg` | `surface-default` | 11.65:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `action-ghost-fg` | `surface-default` | 11.65:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-success-strong` | `surface-success-strong` | 12.05:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-warning` | `surface-warning-strong` | 12.58:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-on-error-strong` | `surface-danger-strong` | 7.59:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-on-primary-strong` | `surface-info-strong` | 5.71:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-link` | `surface-default` | 19.56:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-hover` | `surface-default` | 20.02:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-visited` | `surface-default` | 9.78:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-link-active` | `surface-default` | 21.00:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `text-disabled` | `surface-default` | 4.62:1 | 3.0:1 | ✅ | ✅ |
| ✅ | body | `error-text` | `surface-default` | 11.06:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `success-text` | `surface-default` | 14.96:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `focus-ring` | `surface-default` | 19.56:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-primary-bg-inverted-rest` | `surface-inverse` | 3.68:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `border-strong` | `surface-default` | 21.00:1 | 3.0:1 | ✅ | ✅ |
