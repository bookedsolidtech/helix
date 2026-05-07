# WCAG Contrast Report — `@helixui/tokens`

_Generated 2026-05-07T05:35:37.222Z from `@helixui/tokens@3.3.1`._

Per-mode pass/fail telemetry for every semantically valid `(text × surface)` pair declared in the contrast matrix. **AA is the published gate** (enforced by `contrast.test.ts`); **AAA is informational** and surfaces here so consumers and auditors can see the actual ceiling each pairing reaches.

Thresholds (WCAG 2.1, **role-aware**):

- `body` — body text, prose, inline links: AA ≥ 4.5:1 (1.4.3), **AAA ≥ 7.0:1** (1.4.6)
- `large` — button labels (≥1rem semibold), status callouts: AA ≥ 3.0:1, **AAA ≥ 4.5:1** (1.4.6 large-text bold branch — `≥14pt bold`)
- `ui` — focus rings, borders, status fills, placeholders: AA ≥ 3.0:1 (1.4.11), **AAA ≥ 3.0:1** (1.4.6 has no AAA tier above 1.4.11 for non-text)

Legend: ✅ AAA pass · ⚠️ AA pass (sub-AAA) · ❌ sub-AA (gate failure). The `Role` column documents the WCAG carve-out applied to each pair; the `AAA min` column shows the role-specific AAA threshold the pair was scored against.

## Aggregate

**Across all three modes:** 156 of 163 pair-instances AAA-pass · 7 AA-only · 0 sub-AA

## Light Mode

**Summary:** 55 of 59 pairs AAA-pass · 4 AA-only · 0 sub-AA

| Status | Role | Text token | Surface token | Ratio | AAA min | AA | AAA |
|---|---|---|---|---:|---:|:---:|:---:|
| ✅ | body | `text-primary` | `surface-default` | 17.88:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-primary` | `surface-raised` | 16.69:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-primary` | `surface-sunken` | 15.27:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-strong` | `surface-default` | 14.32:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-strong` | `surface-raised` | 13.37:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-secondary` | `surface-default` | 10.93:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-secondary` | `surface-raised` | 10.20:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-muted` | `surface-default` | 7.76:1 | 7.0:1 | ✅ | ✅ |
| ✅ | body | `text-muted` | `surface-raised` | 7.25:1 | 7.0:1 | ✅ | ✅ |
| ✅ | ui | `text-placeholder` | `surface-default` | 4.63:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `text-placeholder` | `surface-raised` | 4.32:1 | 3.0:1 | ✅ | ✅ |
| ✅ | body | `text-inverse` | `surface-inverse` | 17.88:1 | 7.0:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `primary-500` | 5.20:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-secondary` | `secondary-500` | 5.18:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-success` | `success-500` | 5.29:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-warning` | `warning-500` | 4.83:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `error-500` | 4.56:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-info` | `info-500` | 5.03:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `primary-600` | 5.82:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `primary-700` | 7.03:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `secondary-600` | 6.13:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `secondary-700` | 7.07:1 | 4.5:1 | ✅ | ✅ |
| ✅ | ui | `neutral-0` | `success-600` | 4.42:1 | 3.0:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `success-700` | 6.88:1 | 4.5:1 | ✅ | ✅ |
| ✅ | ui | `neutral-0` | `warning-600` | 4.28:1 | 3.0:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `warning-700` | 7.51:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `error-600` | 5.46:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `error-700` | 7.96:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `info-600` | 4.92:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `info-700` | 7.26:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `action-primary-bg-hover` | 5.82:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `action-primary-bg-active` | 7.03:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `action-danger-bg-hover` | 5.46:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `action-danger-bg-active` | 7.96:1 | 4.5:1 | ✅ | ✅ |
| ✅ | ui | `action-primary-bg-inverted-hover` | `surface-inverse` | 7.27:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-danger-bg-inverted-hover` | `surface-inverse` | 6.58:1 | 3.0:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `action-primary-bg-inverted-hover` | 7.27:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `action-danger-bg-inverted-hover` | 6.58:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `action-primary-bg` | 5.20:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `action-danger-bg` | 4.56:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-secondary-fg` | `surface-default` | 5.82:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-secondary-fg` | `action-secondary-bg-hover` | 5.35:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-ghost-fg` | `surface-default` | 5.82:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-ghost-fg` | `action-ghost-bg-hover` | 5.35:1 | 4.5:1 | ✅ | ✅ |
| ✅ | ui | `action-secondary-border` | `surface-default` | 5.82:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-secondary-border` | `action-secondary-bg-hover` | 5.35:1 | 3.0:1 | ✅ | ✅ |
| ✅ | large | `text-on-success-strong` | `surface-success-strong` | 6.88:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-warning` | `surface-warning-strong` | 4.83:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `surface-danger-strong` | 5.46:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `surface-info-strong` | 5.82:1 | 4.5:1 | ✅ | ✅ |
| ⚠️ | body | `text-link` | `surface-default` | 5.82:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-link-hover` | `surface-default` | 7.03:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `text-link-visited` | `surface-default` | 6.13:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | body | `text-link-active` | `surface-default` | 10.19:1 | 7.0:1 | ✅ | ✅ |
| ⚠️ | body | `error-text` | `surface-default` | 5.46:1 | 7.0:1 | ✅ | ⚠️ |
| ⚠️ | body | `success-text` | `surface-default` | 6.88:1 | 7.0:1 | ✅ | ⚠️ |
| ✅ | ui | `focus-ring` | `surface-default` | 5.82:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-primary-bg-inverted-rest` | `surface-inverse` | 5.20:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `border-strong` | `surface-default` | 4.63:1 | 3.0:1 | ✅ | ✅ |

## Dark Mode

**Summary:** 55 of 58 pairs AAA-pass · 3 AA-only · 0 sub-AA

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
| ✅ | ui | `text-placeholder` | `surface-default` | 6.27:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `text-placeholder` | `surface-raised` | 5.02:1 | 3.0:1 | ✅ | ✅ |
| ✅ | body | `text-inverse` | `surface-inverse` | 15.27:1 | 7.0:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `primary-500` | 5.20:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-secondary` | `secondary-500` | 5.18:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-success` | `success-500` | 5.29:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-warning` | `warning-500` | 4.83:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `error-500` | 4.56:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-info` | `info-500` | 5.03:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `primary-600` | 5.82:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `primary-700` | 7.03:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `secondary-600` | 6.13:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `secondary-700` | 7.07:1 | 4.5:1 | ✅ | ✅ |
| ✅ | ui | `neutral-0` | `success-600` | 4.42:1 | 3.0:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `success-700` | 6.88:1 | 4.5:1 | ✅ | ✅ |
| ✅ | ui | `neutral-0` | `warning-600` | 4.28:1 | 3.0:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `warning-700` | 7.51:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `error-600` | 5.46:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `error-700` | 7.96:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `info-600` | 4.92:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `neutral-0` | `info-700` | 7.26:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `action-primary-bg-hover` | 5.82:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `action-primary-bg-active` | 7.03:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `action-danger-bg-hover` | 5.46:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `action-danger-bg-active` | 7.96:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `action-primary-bg-inverted-hover` | 7.27:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `action-danger-bg-inverted-hover` | 6.58:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `action-primary-bg` | 5.20:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `action-danger-bg` | 4.56:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-secondary-fg` | `surface-default` | 7.27:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-secondary-fg` | `action-secondary-bg-hover` | 5.63:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-ghost-fg` | `surface-default` | 7.27:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-ghost-fg` | `action-ghost-bg-hover` | 5.63:1 | 4.5:1 | ✅ | ✅ |
| ✅ | ui | `action-secondary-border` | `surface-default` | 7.27:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `action-secondary-border` | `action-secondary-bg-hover` | 5.63:1 | 3.0:1 | ✅ | ✅ |
| ✅ | large | `text-on-success-strong` | `surface-success-strong` | 6.88:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-warning` | `surface-warning-strong` | 4.83:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `surface-danger-strong` | 5.46:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `surface-info-strong` | 5.82:1 | 4.5:1 | ✅ | ✅ |
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

**Summary:** 46 of 46 pairs AAA-pass · 0 AA-only · 0 sub-AA

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
| ✅ | ui | `text-placeholder` | `surface-default` | 9.68:1 | 3.0:1 | ✅ | ✅ |
| ✅ | ui | `text-placeholder` | `surface-raised` | 8.03:1 | 3.0:1 | ✅ | ✅ |
| ✅ | body | `text-inverse` | `surface-inverse` | 21.00:1 | 7.0:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `primary-500` | 5.71:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-secondary` | `secondary-500` | 11.62:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-success` | `success-500` | 12.05:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-warning` | `warning-500` | 12.58:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `error-500` | 7.59:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-info` | `info-500` | 9.80:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `primary-600` | 8.26:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-secondary` | `secondary-600` | 14.49:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-success` | `success-600` | 14.96:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-warning` | `warning-600` | 14.56:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `error-600` | 11.06:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-info` | `info-600` | 12.60:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `action-primary-bg-hover` | 8.26:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `action-primary-bg-active` | 11.65:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `action-danger-bg-hover` | 11.06:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `action-danger-bg-active` | 7.59:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary` | `action-primary-bg` | 5.71:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error` | `action-danger-bg` | 7.59:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-secondary-fg` | `surface-default` | 8.26:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `action-ghost-fg` | `surface-default` | 8.26:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-success-strong` | `surface-success-strong` | 12.05:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-warning` | `surface-warning-strong` | 12.58:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-error-strong` | `surface-danger-strong` | 7.59:1 | 4.5:1 | ✅ | ✅ |
| ✅ | large | `text-on-primary-strong` | `surface-info-strong` | 5.71:1 | 4.5:1 | ✅ | ✅ |
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
