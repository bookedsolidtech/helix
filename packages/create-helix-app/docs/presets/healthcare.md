# Healthcare Preset

The healthcare preset extends [blog](./blog.md) with components specific to patient-facing healthcare portals. Component boundaries are designed with HIPAA-aware separation in mind.

## SDCs Included

Includes all [blog SDCs](./blog.md) (which include all [standard SDCs](./standard.md)), plus:

| SDC | Purpose |
|-----|---------|
| `provider-card` | Clinician profile with specialty and contact |
| `appointment-cta` | Appointment scheduling call-to-action |
| `condition-tag` | Medical condition taxonomy term display |
| `medical-disclaimer` | Required legal/medical disclaimer block |

## Dependencies

```json
{
  "@helixui/drupal-starter": "^0.1.0",
  "@helixui/tokens": "^0.2.0"
}
```

## Usage

```bash
npx @helixui/create --drupal --preset healthcare
```

## Architecture Notes

Extends blog with provider directory, appointment flows, condition taxonomy, and medical disclaimers. HIPAA-aware component boundaries ensure patient-identifiable data is never rendered in shared slots. Medical disclaimer SDC includes required legal text and must appear on all clinically-relevant pages per organizational policy.

## Accessibility Requirements

All healthcare SDCs must meet WCAG 2.1 AA at minimum. The `medical-disclaimer` component uses `role="note"` for assistive technology discoverability.
