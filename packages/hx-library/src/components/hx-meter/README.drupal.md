# hx-meter — Drupal Integration Guide

## Overview

`hx-meter` renders a scalar measurement gauge within a defined numeric range. It supports optional `low`, `high`, and `optimum` threshold attributes for semantic color feedback (optimum / warning / danger states). Common healthcare uses include disk usage, patient risk scores, medication adherence, and lab value ranges.

## Twig Template

Use the provided `hx-meter.twig` template or render the component directly:

```twig
{# Direct render — simple disk usage meter #}
<hx-meter
  value="{{ disk_used_gb }}"
  min="0"
  max="{{ disk_total_gb }}"
  label="Disk usage"
></hx-meter>
```

```twig
{# Include via template with threshold zones #}
{% include 'hx-meter.twig' with {
  value: risk_score,
  min: 0,
  max: 100,
  low: 30,
  high: 70,
  optimum: 10,
  label: 'Patient risk score',
} %}
```

## Template Variables

| Variable     | Type   | Default | Description                                                                  |
| ------------ | ------ | ------- | ---------------------------------------------------------------------------- |
| `value`      | number | —       | **Required.** Current value. Clamped to `[min, max]`.                        |
| `min`        | number | `0`     | Minimum value of the range.                                                  |
| `max`        | number | `100`   | Maximum value of the range.                                                  |
| `label`      | string |         | Visible label and accessible name. Required unless using the label slot.     |
| `low`        | number |         | Threshold below which value is suboptimal.                                   |
| `high`       | number |         | Threshold above which value is suboptimal.                                   |
| `optimum`    | number |         | The optimal value. Determines which zone is "good" relative to `low`/`high`. |
| `attributes` | object |         | Additional Drupal attributes object.                                         |

## Semantic State Reference

The component resolves a semantic state from the numeric values and applies color automatically via CSS custom properties:

| State     | Meaning                              | CSS Custom Property          |
| --------- | ------------------------------------ | ---------------------------- |
| `default` | No threshold attributes set          | `--hx-meter-indicator-color` |
| `optimum` | Value is in the optimal zone         | `--hx-meter-color-optimum`   |
| `warning` | Value is outside the optimal zone    | `--hx-meter-color-warning`   |
| `danger`  | Value is in the least desirable zone | `--hx-meter-color-danger`    |

## Healthcare Examples

### Lab Value in Range

```twig
{# Blood glucose — target 70–140 mg/dL, danger below 54 or above 250 #}
<hx-meter
  value="{{ patient.glucose_level }}"
  min="0"
  max="400"
  low="70"
  high="140"
  optimum="100"
  label="Blood glucose (mg/dL)"
></hx-meter>
```

### Medication Adherence (higher is better)

```twig
{# Adherence — optimum zone is high end (>80%); warning 50–80%; danger <50% #}
<hx-meter
  value="{{ adherence_pct }}"
  min="0"
  max="100"
  low="50"
  high="80"
  optimum="100"
  label="{{ 'Medication adherence'|t }}"
></hx-meter>
```

### Patient Risk Score (lower is better)

```twig
{# Risk score — optimum zone is low end (<30); warning 30–70; danger >70 #}
<hx-meter
  value="{{ patient.risk_score }}"
  min="0"
  max="100"
  low="30"
  high="70"
  optimum="0"
  label="{{ 'Patient risk score'|t }}"
></hx-meter>
```

### Views Integration — Patient List

```twig
{# views/views-view-unformatted--patient-list.html.twig #}
<div class="patient-metrics">
  {% for row in rows %}
    {% set patient = row.content['#row'] %}
    <div class="patient-metric-row">
      <span>{{ patient.title }}</span>
      <hx-meter
        value="{{ patient.field_risk_score }}"
        min="0"
        max="100"
        low="30"
        high="70"
        optimum="0"
        label="{{ 'Risk score for @name'|t({'@name': patient.title}) }}"
      ></hx-meter>
    </div>
  {% endfor %}
</div>
```

## Drupal Views Field Formatter

For automated rendering from entity fields, consider a custom `FieldFormatter` plugin:

```php
// src/Plugin/Field/FieldFormatter/HxMeterFormatter.php
// Maps a numeric entity field to <hx-meter> with configurable min/max/thresholds.
// See apps/docs/src/content/docs/drupal/field-formatters.mdx for implementation guidance.
```

## Accessibility Notes

- The component exposes `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext`.
- `aria-valuetext` includes the semantic state: `"75 of 100 — warning"` or `"50 of 100 — optimum"`.
- The `label` attribute provides the accessible name. Always supply a meaningful label.
- Keyboard focusability (`tabindex="0"`) is not yet implemented. See outstanding P2 finding in AUDIT.md.

## Asset Loading

```yaml
# mytheme.libraries.yml
hx-meter:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-meter.js:
      type: external
      attributes:
        type: module
```

Attach in your template:

```twig
{{ attach_library('mytheme/hx-meter') }}
```
