---
'@helixui/library': patch
---

fix(drupal): fix Drupal integration findings for hx-field, hx-link, hx-number-input, hx-prose, and hx-radio-group

Closes #795, #800, #802, #808, #809

- hx-field: add DrupalIntegration Storybook story with Twig template, Behaviors, and asset loading examples (P2-15)
- hx-link: add DrupalIntegration Storybook story with Twig template and Behaviors patterns (P2-8)
- hx-number-input: WithLabelSlot and DrupalFormAPI stories already present; confirmed @slot JSDoc fixed, formResetCallback restores \_defaultValue, step attribute always rendered (P0-02, P1-15, P1-16, P2-08, P2-09)
- hx-prose: fix clear: none → clear: both in \_drupal.css and prose.scoped.css so block-level content starts below floated images rather than wrapping beside them (P2-03); deprecated align attribute selectors documented as Drupal CKEditor compatibility shims (P2-05)
- hx-radio-group: confirmed monotonic counter replaces Math.random() for IDs (P2-2); confirmed \_individualDisabledStates map restores per-radio disabled state on group re-enable (P1-1)
