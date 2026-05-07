# WCAG Contrast Report — `@helixui/tokens`

_Generated 2026-05-07T01:57:27.392Z from `@helixui/tokens@3.3.1`._

Per-mode pass/fail telemetry for every semantically valid `(text × surface)` pair declared in the contrast matrix. **AA is the published gate** (enforced by `contrast.test.ts`); **AAA is informational** and surfaces here so consumers and auditors can see the actual ceiling each pairing reaches.

Thresholds (WCAG 2.1):

- Body text — AA ≥ 4.5:1, AAA ≥ 7.0:1
- UI / large text — AA ≥ 3.0:1, AAA ≥ 4.5:1

Legend: ✅ AAA pass · ⚠️ AA pass (sub-AAA) · ❌ sub-AA (gate failure)

## Aggregate

**Across all three modes:** 100 of 163 pair-instances AAA-pass · 63 AA-only · 0 sub-AA

## Light Mode

**Summary:** 28 of 59 pairs AAA-pass · 31 AA-only · 0 sub-AA

| Status | Text token | Surface token | Ratio | AA | AAA |
|---|---|---|---:|:---:|:---:|
| ✅ | `text-primary` | `surface-default` | 17.88:1 | ✅ | ✅ |
| ✅ | `text-primary` | `surface-raised` | 16.69:1 | ✅ | ✅ |
| ✅ | `text-primary` | `surface-sunken` | 15.27:1 | ✅ | ✅ |
| ✅ | `text-strong` | `surface-default` | 14.32:1 | ✅ | ✅ |
| ✅ | `text-strong` | `surface-raised` | 13.37:1 | ✅ | ✅ |
| ✅ | `text-secondary` | `surface-default` | 10.93:1 | ✅ | ✅ |
| ✅ | `text-secondary` | `surface-raised` | 10.20:1 | ✅ | ✅ |
| ✅ | `text-muted` | `surface-default` | 7.76:1 | ✅ | ✅ |
| ✅ | `text-muted` | `surface-raised` | 7.25:1 | ✅ | ✅ |
| ✅ | `text-placeholder` | `surface-default` | 4.63:1 | ✅ | ✅ |
| ⚠️ | `text-placeholder` | `surface-raised` | 4.32:1 | ✅ | ⚠️ |
| ✅ | `text-inverse` | `surface-inverse` | 17.88:1 | ✅ | ✅ |
| ⚠️ | `text-on-primary` | `primary-500` | 5.20:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-secondary` | `secondary-500` | 5.18:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-success` | `success-500` | 5.29:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-warning` | `warning-500` | 4.83:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-error` | `error-500` | 4.56:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-info` | `info-500` | 5.03:1 | ✅ | ⚠️ |
| ⚠️ | `neutral-0` | `primary-600` | 5.82:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `primary-700` | 7.03:1 | ✅ | ✅ |
| ⚠️ | `neutral-0` | `secondary-600` | 6.13:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `secondary-700` | 7.07:1 | ✅ | ✅ |
| ⚠️ | `neutral-0` | `success-600` | 4.42:1 | ✅ | ⚠️ |
| ⚠️ | `neutral-0` | `success-700` | 6.88:1 | ✅ | ⚠️ |
| ⚠️ | `neutral-0` | `warning-600` | 4.28:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `warning-700` | 7.51:1 | ✅ | ✅ |
| ⚠️ | `neutral-0` | `error-600` | 5.46:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `error-700` | 7.96:1 | ✅ | ✅ |
| ⚠️ | `neutral-0` | `info-600` | 4.92:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `info-700` | 7.26:1 | ✅ | ✅ |
| ⚠️ | `text-on-primary-strong` | `action-primary-bg-hover` | 5.82:1 | ✅ | ⚠️ |
| ✅ | `text-on-primary-strong` | `action-primary-bg-active` | 7.03:1 | ✅ | ✅ |
| ⚠️ | `text-on-error-strong` | `action-danger-bg-hover` | 5.46:1 | ✅ | ⚠️ |
| ✅ | `text-on-error-strong` | `action-danger-bg-active` | 7.96:1 | ✅ | ✅ |
| ✅ | `action-primary-bg-inverted-hover` | `surface-inverse` | 7.27:1 | ✅ | ✅ |
| ✅ | `action-danger-bg-inverted-hover` | `surface-inverse` | 6.58:1 | ✅ | ✅ |
| ✅ | `text-on-primary` | `action-primary-bg-inverted-hover` | 7.27:1 | ✅ | ✅ |
| ⚠️ | `text-on-error` | `action-danger-bg-inverted-hover` | 6.58:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-primary` | `action-primary-bg` | 5.20:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-error` | `action-danger-bg` | 4.56:1 | ✅ | ⚠️ |
| ⚠️ | `action-secondary-fg` | `surface-default` | 5.82:1 | ✅ | ⚠️ |
| ⚠️ | `action-secondary-fg` | `action-secondary-bg-hover` | 5.35:1 | ✅ | ⚠️ |
| ⚠️ | `action-ghost-fg` | `surface-default` | 5.82:1 | ✅ | ⚠️ |
| ⚠️ | `action-ghost-fg` | `action-ghost-bg-hover` | 5.35:1 | ✅ | ⚠️ |
| ✅ | `action-secondary-border` | `surface-default` | 5.82:1 | ✅ | ✅ |
| ✅ | `action-secondary-border` | `action-secondary-bg-hover` | 5.35:1 | ✅ | ✅ |
| ⚠️ | `text-on-success-strong` | `surface-success-strong` | 6.88:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-warning` | `surface-warning-strong` | 4.83:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-error-strong` | `surface-danger-strong` | 5.46:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-primary-strong` | `surface-info-strong` | 5.82:1 | ✅ | ⚠️ |
| ⚠️ | `text-link` | `surface-default` | 5.82:1 | ✅ | ⚠️ |
| ✅ | `text-link-hover` | `surface-default` | 7.03:1 | ✅ | ✅ |
| ⚠️ | `text-link-visited` | `surface-default` | 6.13:1 | ✅ | ⚠️ |
| ✅ | `text-link-active` | `surface-default` | 10.19:1 | ✅ | ✅ |
| ⚠️ | `error-text` | `surface-default` | 5.46:1 | ✅ | ⚠️ |
| ⚠️ | `success-text` | `surface-default` | 6.88:1 | ✅ | ⚠️ |
| ✅ | `focus-ring` | `surface-default` | 5.82:1 | ✅ | ✅ |
| ✅ | `action-primary-bg-inverted-rest` | `surface-inverse` | 5.20:1 | ✅ | ✅ |
| ✅ | `border-strong` | `surface-default` | 4.63:1 | ✅ | ✅ |

## Dark Mode

**Summary:** 30 of 58 pairs AAA-pass · 28 AA-only · 0 sub-AA

| Status | Text token | Surface token | Ratio | AA | AAA |
|---|---|---|---:|:---:|:---:|
| ✅ | `text-primary` | `surface-default` | 15.27:1 | ✅ | ✅ |
| ✅ | `text-primary` | `surface-raised` | 12.24:1 | ✅ | ✅ |
| ✅ | `text-primary` | `surface-sunken` | 17.22:1 | ✅ | ✅ |
| ✅ | `text-strong` | `surface-default` | 16.69:1 | ✅ | ✅ |
| ✅ | `text-strong` | `surface-raised` | 13.37:1 | ✅ | ✅ |
| ✅ | `text-secondary` | `surface-default` | 9.49:1 | ✅ | ✅ |
| ✅ | `text-secondary` | `surface-raised` | 7.60:1 | ✅ | ✅ |
| ⚠️ | `text-muted` | `surface-default` | 6.27:1 | ✅ | ⚠️ |
| ⚠️ | `text-muted` | `surface-raised` | 5.02:1 | ✅ | ⚠️ |
| ✅ | `text-placeholder` | `surface-default` | 6.27:1 | ✅ | ✅ |
| ✅ | `text-placeholder` | `surface-raised` | 5.02:1 | ✅ | ✅ |
| ✅ | `text-inverse` | `surface-inverse` | 15.27:1 | ✅ | ✅ |
| ⚠️ | `text-on-primary` | `primary-500` | 5.20:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-secondary` | `secondary-500` | 5.18:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-success` | `success-500` | 5.29:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-warning` | `warning-500` | 4.83:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-error` | `error-500` | 4.56:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-info` | `info-500` | 5.03:1 | ✅ | ⚠️ |
| ⚠️ | `neutral-0` | `primary-600` | 5.82:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `primary-700` | 7.03:1 | ✅ | ✅ |
| ⚠️ | `neutral-0` | `secondary-600` | 6.13:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `secondary-700` | 7.07:1 | ✅ | ✅ |
| ⚠️ | `neutral-0` | `success-600` | 4.42:1 | ✅ | ⚠️ |
| ⚠️ | `neutral-0` | `success-700` | 6.88:1 | ✅ | ⚠️ |
| ⚠️ | `neutral-0` | `warning-600` | 4.28:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `warning-700` | 7.51:1 | ✅ | ✅ |
| ⚠️ | `neutral-0` | `error-600` | 5.46:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `error-700` | 7.96:1 | ✅ | ✅ |
| ⚠️ | `neutral-0` | `info-600` | 4.92:1 | ✅ | ⚠️ |
| ✅ | `neutral-0` | `info-700` | 7.26:1 | ✅ | ✅ |
| ⚠️ | `text-on-primary-strong` | `action-primary-bg-hover` | 5.82:1 | ✅ | ⚠️ |
| ✅ | `text-on-primary-strong` | `action-primary-bg-active` | 7.03:1 | ✅ | ✅ |
| ⚠️ | `text-on-error-strong` | `action-danger-bg-hover` | 5.46:1 | ✅ | ⚠️ |
| ✅ | `text-on-error-strong` | `action-danger-bg-active` | 7.96:1 | ✅ | ✅ |
| ✅ | `text-on-primary` | `action-primary-bg-inverted-hover` | 7.27:1 | ✅ | ✅ |
| ⚠️ | `text-on-error` | `action-danger-bg-inverted-hover` | 6.58:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-primary` | `action-primary-bg` | 5.20:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-error` | `action-danger-bg` | 4.56:1 | ✅ | ⚠️ |
| ✅ | `action-secondary-fg` | `surface-default` | 7.27:1 | ✅ | ✅ |
| ⚠️ | `action-secondary-fg` | `action-secondary-bg-hover` | 5.63:1 | ✅ | ⚠️ |
| ✅ | `action-ghost-fg` | `surface-default` | 7.27:1 | ✅ | ✅ |
| ⚠️ | `action-ghost-fg` | `action-ghost-bg-hover` | 5.63:1 | ✅ | ⚠️ |
| ✅ | `action-secondary-border` | `surface-default` | 7.27:1 | ✅ | ✅ |
| ✅ | `action-secondary-border` | `action-secondary-bg-hover` | 5.63:1 | ✅ | ✅ |
| ⚠️ | `text-on-success-strong` | `surface-success-strong` | 6.88:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-warning` | `surface-warning-strong` | 4.83:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-error-strong` | `surface-danger-strong` | 5.46:1 | ✅ | ⚠️ |
| ⚠️ | `text-on-primary-strong` | `surface-info-strong` | 5.82:1 | ✅ | ⚠️ |
| ✅ | `text-link` | `surface-default` | 7.27:1 | ✅ | ✅ |
| ✅ | `text-link-hover` | `surface-default` | 10.15:1 | ✅ | ✅ |
| ✅ | `text-link-visited` | `surface-default` | 7.31:1 | ✅ | ✅ |
| ✅ | `text-link-active` | `surface-default` | 12.77:1 | ✅ | ✅ |
| ⚠️ | `text-disabled` | `surface-default` | 3.86:1 | ✅ | ⚠️ |
| ⚠️ | `error-text` | `surface-default` | 6.58:1 | ✅ | ⚠️ |
| ✅ | `success-text` | `surface-default` | 7.41:1 | ✅ | ✅ |
| ✅ | `focus-ring` | `surface-default` | 7.27:1 | ✅ | ✅ |
| ✅ | `action-primary-bg-inverted-rest` | `surface-inverse` | 4.97:1 | ✅ | ✅ |
| ✅ | `border-strong` | `surface-default` | 6.27:1 | ✅ | ✅ |

## High-Contrast Mode

**Summary:** 42 of 46 pairs AAA-pass · 4 AA-only · 0 sub-AA

| Status | Text token | Surface token | Ratio | AA | AAA |
|---|---|---|---:|:---:|:---:|
| ✅ | `text-primary` | `surface-default` | 21.00:1 | ✅ | ✅ |
| ✅ | `text-primary` | `surface-raised` | 17.40:1 | ✅ | ✅ |
| ✅ | `text-primary` | `surface-sunken` | 21.00:1 | ✅ | ✅ |
| ✅ | `text-strong` | `surface-default` | 21.00:1 | ✅ | ✅ |
| ✅ | `text-strong` | `surface-raised` | 17.40:1 | ✅ | ✅ |
| ✅ | `text-secondary` | `surface-default` | 21.00:1 | ✅ | ✅ |
| ✅ | `text-secondary` | `surface-raised` | 17.40:1 | ✅ | ✅ |
| ✅ | `text-muted` | `surface-default` | 15.91:1 | ✅ | ✅ |
| ✅ | `text-muted` | `surface-raised` | 13.18:1 | ✅ | ✅ |
| ✅ | `text-placeholder` | `surface-default` | 9.68:1 | ✅ | ✅ |
| ✅ | `text-placeholder` | `surface-raised` | 8.03:1 | ✅ | ✅ |
| ✅ | `text-inverse` | `surface-inverse` | 21.00:1 | ✅ | ✅ |
| ⚠️ | `text-on-primary` | `primary-500` | 5.71:1 | ✅ | ⚠️ |
| ✅ | `text-on-secondary` | `secondary-500` | 11.62:1 | ✅ | ✅ |
| ✅ | `text-on-success` | `success-500` | 12.05:1 | ✅ | ✅ |
| ✅ | `text-on-warning` | `warning-500` | 12.58:1 | ✅ | ✅ |
| ✅ | `text-on-error` | `error-500` | 7.59:1 | ✅ | ✅ |
| ✅ | `text-on-info` | `info-500` | 9.80:1 | ✅ | ✅ |
| ✅ | `text-on-primary` | `primary-600` | 8.26:1 | ✅ | ✅ |
| ✅ | `text-on-secondary` | `secondary-600` | 14.49:1 | ✅ | ✅ |
| ✅ | `text-on-success` | `success-600` | 14.96:1 | ✅ | ✅ |
| ✅ | `text-on-warning` | `warning-600` | 14.56:1 | ✅ | ✅ |
| ✅ | `text-on-error` | `error-600` | 11.06:1 | ✅ | ✅ |
| ✅ | `text-on-info` | `info-600` | 12.60:1 | ✅ | ✅ |
| ✅ | `text-on-primary-strong` | `action-primary-bg-hover` | 8.26:1 | ✅ | ✅ |
| ✅ | `text-on-primary-strong` | `action-primary-bg-active` | 11.65:1 | ✅ | ✅ |
| ✅ | `text-on-error-strong` | `action-danger-bg-hover` | 11.06:1 | ✅ | ✅ |
| ✅ | `text-on-error-strong` | `action-danger-bg-active` | 7.59:1 | ✅ | ✅ |
| ⚠️ | `text-on-primary` | `action-primary-bg` | 5.71:1 | ✅ | ⚠️ |
| ✅ | `text-on-error` | `action-danger-bg` | 7.59:1 | ✅ | ✅ |
| ✅ | `action-secondary-fg` | `surface-default` | 8.26:1 | ✅ | ✅ |
| ✅ | `action-ghost-fg` | `surface-default` | 8.26:1 | ✅ | ✅ |
| ✅ | `text-on-success-strong` | `surface-success-strong` | 12.05:1 | ✅ | ✅ |
| ✅ | `text-on-warning` | `surface-warning-strong` | 12.58:1 | ✅ | ✅ |
| ✅ | `text-on-error-strong` | `surface-danger-strong` | 7.59:1 | ✅ | ✅ |
| ⚠️ | `text-on-primary-strong` | `surface-info-strong` | 5.71:1 | ✅ | ⚠️ |
| ✅ | `text-link` | `surface-default` | 19.56:1 | ✅ | ✅ |
| ✅ | `text-link-hover` | `surface-default` | 20.02:1 | ✅ | ✅ |
| ✅ | `text-link-visited` | `surface-default` | 9.78:1 | ✅ | ✅ |
| ✅ | `text-link-active` | `surface-default` | 21.00:1 | ✅ | ✅ |
| ✅ | `text-disabled` | `surface-default` | 4.62:1 | ✅ | ✅ |
| ✅ | `error-text` | `surface-default` | 11.06:1 | ✅ | ✅ |
| ✅ | `success-text` | `surface-default` | 14.96:1 | ✅ | ✅ |
| ✅ | `focus-ring` | `surface-default` | 19.56:1 | ✅ | ✅ |
| ⚠️ | `action-primary-bg-inverted-rest` | `surface-inverse` | 3.68:1 | ✅ | ⚠️ |
| ✅ | `border-strong` | `surface-default` | 21.00:1 | ✅ | ✅ |
